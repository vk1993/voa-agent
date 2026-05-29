import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { Redis } from "@upstash/redis";

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

// Instantiate Upstash Redis Client safely
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Cache tenant statuses in-memory at Edge for 60 seconds to optimize latency
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
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const slug = await redis.get<string>(`domain:tenant:${host}`);
    return slug || null;
  } catch (error) {
    console.error("Failed to resolve custom domain from Redis:", error);
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

    // Blacklist check (Token Revocation / Logout support)
    if (payload && payload.jti && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const isBlacklisted = await redis.get(`blacklist:jti:${payload.jti}`);
      if (isBlacklisted) {
        console.warn(`[AUTH] Rejected blacklisted session JTI: ${payload.jti}`);
        return null;
      }
    }

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}


/**
 * Helper: Fetch tenant status from Upstash Redis with 60-second local cache.
 */
async function getTenantStatus(tenantId: string): Promise<string> {
  const now = Date.now();
  const cached = statusCache.get(tenantId);
  if (cached && cached.expiresAt > now) {
    return cached.status;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return "ACTIVE";
  }

  try {
    const status = await redis.get<string>(`tenant:status:${tenantId}`);
    if (status) {
      statusCache.set(tenantId, { status, expiresAt: now + 60000 });
      return status;
    }
  } catch (error) {
    console.error("Tenant active check failed at Edge. Defaulting to ACTIVE.", error);
  }

  return "ACTIVE";
}

/**
 * Helper: Atomic Rate Limiting via Upstash Redis pipelines.
 */
async function checkRateLimit(key: string, limit: number): Promise<{ limited: boolean; retryAfter: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { limited: false, retryAfter: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowIndex = Math.floor(now / 60);
  const redisKey = `ratelimit:${key}:${windowIndex}`;

  try {
    const p = redis.pipeline();
    p.incr(redisKey);
    p.expire(redisKey, 120); // 2-minute TTL
    const [count] = await p.exec<[number, number]>();

    if (count > limit) {
      const retryAfter = 60 - (now % 60);
      return { limited: true, retryAfter };
    }
  } catch (error) {
    console.error("Rate limiting check failed at Edge:", error);
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
 * Edge-Native Routing Proxy Interceptor for VOXA Next.js.
 */
export async function proxy(request: NextRequest) {
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
    const { limited, retryAfter } = await checkRateLimit(`ip:${ip}`, 100);
    if (limited) {
      return buildJsonError("TOO_MANY_REQUESTS", "Rate limit exceeded. Please try again later.", 429, slug, retryAfter);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res, slug);
  }

  // 3. Extract and Verify Cryptographic Session JWT (RS256)
  const sessionCookie = request.cookies.get("session")?.value;
  let userPayload: JwtPayload | null = null;
  if (sessionCookie) {
    userPayload = await verifySessionJwt(sessionCookie);
  }

  // 4. Rate Limiting Check
  if (userPayload) {
    const { limited, retryAfter } = await checkRateLimit(`tenant:${userPayload.tenantId}`, 1000);
    if (limited) {
      return buildJsonError("TOO_MANY_REQUESTS", "Tenant rate limit exceeded.", 429, slug, retryAfter);
    }
  } else {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const { limited, retryAfter } = await checkRateLimit(`ip:${ip}`, 100);
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

  // 6. Access Control & Authorization Matrix Checking
  const isApiRoute = pathname.startsWith("/api/");

  // A. Guard Login Route
  if (pathname.startsWith("/login")) {
    if (userPayload) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return addSecurityHeaders(NextResponse.redirect(url), slug);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res, slug);
  }

  // Authentication Guards
  // NOTE: /api/auth/* routes are public — they ARE the login flow itself.
  if (!userPayload) {
    if (pathname.startsWith("/api/auth/")) {
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

// Edge configuration matching boundaries
export const config = {
  matcher: [
    "/admin/:path*",
    "/sp/:path*",
    "/api/:path*",
    "/login",
  ],
};
