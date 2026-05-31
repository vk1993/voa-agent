import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import Redis from "ioredis";

// Define the JWKS cache endpoint
const JWKS_URL = "https://auth.voxa.ai/.well-known/jwks.json";
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SALES_AGENT" | "READ_ONLY";
  jti?: string;
  email?: string;
}

// Instantiate standard TCP Redis Client outside the handler to persist the connection pool
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
});

// Event listener for Redis logging
redis.on("error", (err) => {
  console.error("[REDIS PROXY CONNECTION ERROR]:", err);
});

// Cache tenant statuses in-memory at Middleware for 60 seconds to optimize latency
const statusCache = new Map<string, { status: string; expiresAt: number }>();

/**
 * Helper: Extract tenant slug from subdomain or X-Forwarded-Host header.
 */
export function extractTenantSlug(hostname: string): string | null {
  if (!hostname) return null;
  
  // Clean port if present (e.g. prestige.localhost:3000 -> prestige.localhost)
  const parts = hostname.split(":");
  const hostOnly = parts[0];
  const hostParts = hostOnly.split(".");
  
  if (hostParts.length <= 1) {
    return null;
  }
  
  // Support local test subdomains (e.g. prestige.localhost)
  if (hostOnly.includes("localhost")) {
    if (hostParts.length >= 2 && hostParts[0] !== "www") {
      return hostParts[0];
    }
    return null;
  }
  
  // Support production subdomains (e.g. prestige.voxa.ai)
  if (hostParts.length >= 3) {
    const sub = hostParts[0];
    if (sub !== "www") {
      return sub;
    }
  }
  
  return null;
}

/**
 * Helper: Resolve custom domain to tenant slug from Redis.
 */
async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  try {
    const slug = await redis.get(`domain:tenant:${host}`);
    return slug || null;
  } catch (error) {
    console.error("Failed to resolve custom domain from Redis (fail-open):", error);
    return null;
  }
}

/**
 * Helper: Verify VOXA session JWT.
 * - Development: HS256 with local secret (matches what /api/auth/exchange signs with)
 * - Production:  RS256 via remote JWKS (set JWKS_URL env var)
 */
export async function verifySessionJwt(token: string): Promise<JwtPayload | null> {
  const jwksUrl = process.env.JWKS_URL;

  try {
    let payload: JwtPayload | null = null;

    if (jwksUrl) {
      // Production: verify against real Cognito/Okta JWKS (RS256)
      const { payload: jwtPayload } = await jwtVerify(token, JWKS, {
        audience: "https://voxa.ai/app",
        issuer: "https://auth.voxa.ai",
        algorithms: ["RS256"],
      });
      payload = {
        sub: jwtPayload.sub as string,
        tenantId: jwtPayload.tenantId as string,
        role: jwtPayload.role as "SUPER_ADMIN" | "ADMIN" | "SALES_AGENT" | "READ_ONLY",
        jti: jwtPayload.jti as string,
        email: jwtPayload.email as string,
      };
    } else {
      // Development: verify with the secure JWT_SECRET environment variable
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error(
          "FATAL: JWT_SECRET environment variable is not set. " +
          "Refusing to verify tokens without a secure secret."
        );
      }
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload: jwtPayload } = await jwtVerify(token, secret, {
        audience: "https://voxa.ai/app",
        issuer: "https://auth.voxa.ai",
        algorithms: ["HS256"],
      });
      payload = {
        sub: jwtPayload.sub as string,
        tenantId: jwtPayload.tenantId as string,
        role: jwtPayload.role as "SUPER_ADMIN" | "ADMIN" | "SALES_AGENT" | "READ_ONLY",
        jti: jwtPayload.jti as string,
        email: jwtPayload.email as string,
      };
    }

    // Blacklist check (Token Revocation / Logout support) using strict tenant prefix format
    if (payload && payload.jti) {
      try {
        const blacklistKey = `t:${payload.tenantId}:blacklist:jti:${payload.jti}`;
        const isBlacklisted = await redis.get(blacklistKey);
        if (isBlacklisted) {
          console.warn(`[AUTH] Rejected blacklisted session JTI: ${payload.jti}`);
          return null;
        }
      } catch (redisError) {
        console.error("[AUTH] Blacklist check failed (fail-open):", redisError);
      }
    }

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}


/**
 * Helper: Fetch tenant status from Redis with 60-second local cache and fail-open.
 */
async function getTenantStatus(tenantId: string): Promise<string> {
  const now = Date.now();
  const cached = statusCache.get(tenantId);
  if (cached && cached.expiresAt > now) {
    return cached.status;
  }

  try {
    const status = await redis.get(`t:${tenantId}:status`);
    if (status) {
      statusCache.set(tenantId, { status, expiresAt: now + 60000 });
      return status;
    }
  } catch (error) {
    console.error("Tenant active check failed at Middleware (fail-open). Defaulting to ACTIVE.", error);
  }

  return "ACTIVE";
}

/**
 * Helper: Atomic Rate Limiting via standard ioredis pipelines.
 */
async function checkRateLimit(tenantId: string, type: "tenant" | "ip", keySuffix: string, limit: number): Promise<{ limited: boolean; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowIndex = Math.floor(now / 60);

  // Logical partitioning based on multi-tenant structure
  const redisKey = type === "tenant"
    ? `t:${tenantId}:ratelimit:${windowIndex}`
    : `t:anonymous:ratelimit:${keySuffix}:${windowIndex}`;

  try {
    const p = redis.pipeline();
    p.incr(redisKey);
    p.expire(redisKey, 120); // 2-minute TTL
    
    const results = await p.exec();
    if (!results || results.length === 0) {
      return { limited: false, retryAfter: 0 };
    }

    // In standard ioredis, exec results are returned as [error, result][] tuples
    const incrResult = results[0];
    if (incrResult[0]) {
      console.error("[RATE LIMIT] increment operation failed in pipeline:", incrResult[0]);
      return { limited: false, retryAfter: 0 }; // Fail-open
    }

    const count = incrResult[1] as number;
    if (count > limit) {
      const retryAfter = 60 - (now % 60);
      return { limited: true, retryAfter };
    }
  } catch (error) {
    console.error("Rate limiting check failed (fail-open):", error);
  }

  return { limited: false, retryAfter: 0 };
}

/**
 * Helper: Add mandatory security headers to every response.
 */
function addSecurityHeaders(response: NextResponse, slug: string | null): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Tenant-Routed", slug || "none");
  return response;
}

/**
 * Helper: Build structured JSON responses for API routes.
 */
function buildJsonError(error: string, message: string, status: number, slug: string | null, retryAfter?: number): NextResponse {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (retryAfter !== undefined) {
    headers["Retry-After"] = String(retryAfter);
  }
  const response = new NextResponse(
    JSON.stringify({ error, message }),
    {
      status,
      headers,
    }
  );
  return addSecurityHeaders(response, slug);
}

/**
 * Node-Native Routing Proxy Interceptor for VOXA Next.js.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Resolve Tenant Slug from Subdomain or custom domain X-Forwarded-Host header
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.host || "";
  let slug = extractTenantSlug(hostHeader);
  if (!slug && hostHeader && !hostHeader.includes("voxa.ai") && !hostHeader.includes("localhost")) {
    slug = await resolveCustomDomainSlug(hostHeader);
  }

  // 2. Public route validation: allow root and .well-known routes with IP Rate Limit
  if (pathname === "/" || pathname.startsWith("/.well-known")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const { limited, retryAfter } = await checkRateLimit("anonymous", "ip", `ip:${ip}`, 100);
    if (limited) {
      return buildJsonError("TOO_MANY_REQUESTS", "Rate limit exceeded. Please try again later.", 429, slug, retryAfter);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res, slug);
  }

  // 2.5 Redirect directly visiting "/admin" to "/admin/contacts"
  if (pathname === "/admin" || pathname === "/admin/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/contacts";
    return addSecurityHeaders(NextResponse.redirect(url), slug);
  }

  // 3. Extract and Verify Cryptographic Session JWT (RS256 / HS256)
  const sessionCookie = request.cookies.get("session")?.value;
  let userPayload: JwtPayload | null = null;
  if (sessionCookie) {
    userPayload = await verifySessionJwt(sessionCookie);
  }

  // 4. Rate Limiting Check
  if (userPayload) {
    const { limited, retryAfter } = await checkRateLimit(userPayload.tenantId, "tenant", "", 1000);
    if (limited) {
      return buildJsonError("TOO_MANY_REQUESTS", "Tenant rate limit exceeded.", 429, slug, retryAfter);
    }
  } else {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const { limited, retryAfter } = await checkRateLimit("anonymous", "ip", `ip:${ip}`, 100);
    if (limited) {
      return buildJsonError("TOO_MANY_REQUESTS", "Rate limit exceeded.", 429, slug, retryAfter);
    }
  }

  // 5. Tenant suspension check for authenticated sessions
  if (userPayload) {
    const tenantStatus = await getTenantStatus(userPayload.tenantId);
    if (tenantStatus === "SUSPENDED") {
      if (pathname.startsWith("/api/")) {
        return buildJsonError("FORBIDDEN", "Tenant account has been suspended.", 403, slug);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
    if (tenantStatus === "CANCELLED") {
      if (pathname.startsWith("/api/")) {
        return buildJsonError("FORBIDDEN", "Tenant account has been cancelled.", 403, slug);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/cancelled";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
  }

  // 5.5 Check onboardingComplete status for authenticated UI requests
  if (
    userPayload &&
    !pathname.startsWith("/api/") &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/super-admin")  // Super Admins bypass onboarding wizard
  ) {
    try {
      const onboardingComplete = await redis.get(`t:${userPayload.tenantId}:onboarding`);
      // Redirect if explicitly false OR if key is missing (null = unknown state)
      // But only for ADMIN/SUPER_ADMIN — Sales Agents don't do onboarding
      if (
        (userPayload.role === "ADMIN" || userPayload.role === "SUPER_ADMIN") &&
        (onboardingComplete === "false" || onboardingComplete === null)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return addSecurityHeaders(NextResponse.redirect(url), slug);
      }
    } catch (err) {
      console.error("[EDGE] Failed to fetch onboarding status from Redis (fail-open):", err);
    }
  }

  // 6. Access Control & Authorization Matrix Checking
  const isApiRoute = pathname.startsWith("/api/");

  if (pathname.startsWith("/onboarding")) {
    if (!userPayload) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res, slug);
  }

  // A. Guard Login Route, Invite Acceptance & Signup
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/accept-invite") ||
    pathname.startsWith("/signup")    // ADD: prevent authenticated users from seeing signup
  ) {
    if (userPayload) {
      const url = request.nextUrl.clone();
      url.pathname =
        userPayload.role === "ADMIN" || userPayload.role === "SUPER_ADMIN"
          ? "/admin/contacts"
          : "/sp/pipeline";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res, slug);
  }

  // Authentication Guards
  // NOTE: /api/auth/* routes are public — they ARE the login flow itself.
  if (!userPayload) {
    if (pathname.startsWith("/api/auth/") || pathname === "/api/accept-invite" || pathname === "/api/onboard") {
      const res = NextResponse.next();
      return addSecurityHeaders(res, slug);
    }
    if (isApiRoute) {
      return buildJsonError("UNAUTHORIZED", "Missing or invalid session token.", 401, slug);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(url), slug);
  }

  // Role-Based Authorization Guarding
  const userRole = userPayload.role;

  // B. Guard /admin/* and /api/admin/* (ADMIN or SUPER_ADMIN only)
  if (pathname.startsWith("/admin/") || pathname === "/admin" || pathname.startsWith("/api/admin/")) {
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      if (isApiRoute) {
        return buildJsonError("FORBIDDEN", "Insufficient administrative privileges.", 403, slug);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/sp/pipeline";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
  }

  // E. Guard /super-admin/* and /api/super-admin/* (SUPER_ADMIN only)
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    if (userRole !== "SUPER_ADMIN") {
      if (isApiRoute) {
        return buildJsonError("FORBIDDEN", "Super Admin access required.", 403, slug);
      }
      const url = request.nextUrl.clone();
      url.pathname = userRole === "ADMIN" ? "/admin/contacts" : "/sp/pipeline";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
  }

  // C. Guard /sp/* (ADMIN or SALES_AGENT)
  if (pathname.startsWith("/sp/") || pathname === "/sp") {
    if (userRole !== "ADMIN" && userRole !== "SALES_AGENT") {
      if (isApiRoute) {
        return buildJsonError("FORBIDDEN", "Insufficient access permissions.", 403, slug);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
  }

  // D. General Auth APIs Guard
  if (isApiRoute) {
    // All API requests forward custom identity context headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", userPayload.tenantId);
    requestHeaders.set("x-user-id", userPayload.sub);
    requestHeaders.set("x-user-role", userRole);
    if (sessionCookie) {
      requestHeaders.set("authorization", `Bearer ${sessionCookie}`);
    }
    if (slug) requestHeaders.set("x-tenant-slug", slug);

    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return addSecurityHeaders(res, slug);
  }

  // 7. Subdomain Tenant Routing and Header Forwarding
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", userPayload.tenantId);
  requestHeaders.set("x-user-id", userPayload.sub);
  requestHeaders.set("x-user-role", userRole);
  if (sessionCookie) {
    requestHeaders.set("authorization", `Bearer ${sessionCookie}`);
  }
  if (slug) requestHeaders.set("x-tenant-slug", slug);

  // Perform dynamic internal rewrite if slug is present (avoid infinite loop)
  if (slug && !pathname.startsWith("/t/")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/t/${slug}${pathname}`;
    const res = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    return addSecurityHeaders(res, slug);
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return addSecurityHeaders(res, slug);
}

// Node.js configuration matching boundaries for Middleware
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/sp/:path*",
    "/api/:path*",
    "/login",
    "/signup",               // Guard authenticated users out of signup page
    "/accept-invite",
    "/onboarding",
    "/super-admin/:path*",   // Future Super Admin pages
  ],
};
