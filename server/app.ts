import Fastify, { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { PrismaClient } from "@prisma/client";
import { getTenantClient } from "../lib/prisma-tenant";
import { logAuditEvent } from "../lib/security/audit-logger";
import { contactsRoutes } from "./routes/contacts.route";
import { tenantRoutes } from "./routes/tenant.route";

// Extends Fastify types with user identity & tenant-scoped Prisma clients
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SALES_AGENT" | "READ_ONLY";
      tenantId: string;
    };
    db: PrismaClient;
  }
}

/**
 * Creates and configures the production Fastify Server with the E2E Security Stack.
 */
export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    disableRequestLogging: true,
  });

  // Initialize secure Redis reference for rate limiting and JWT blacklisting
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "https://mock.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "mock_token",
  });

  // Cache JWKS in edge memory via Jose remote JWKSet if in production
  const jwtSecret = process.env.JWT_SECRET;
  const jwksUrl   = process.env.JWKS_URL; // set only in production with real Cognito
  
  const JWKS = jwksUrl
    ? createRemoteJWKSet(new URL(jwksUrl))
    : null;

  // =========================================================================
  // 1. SECURITY HEADERS MIDDLEWARE (@fastify/helmet)
  // =========================================================================
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameAncestors: ["'none'"], // Defend against Clickjacking
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    hsts: { maxAge: 31536000, includeSubDomains: true }, // Strict SSL
  });

  // =========================================================================
  // 2. RESTRICTED CORS ORIGINS (@fastify/cors)
  // =========================================================================
  await app.register(cors, {
    origin: (origin, cb) => {
      const IS_DEV = process.env.NODE_ENV !== "production";
      const allowed = [
        "https://voxa.ai",
        /\.voxa\.ai$/,
        ...(IS_DEV ? [/^http:\/\/localhost(:\d+)?$/] : []),
      ];
      const ok = !origin || allowed.some(p =>
        typeof p === "string" ? p === origin : p.test(origin)
      );
      cb(ok ? null : new Error("CORS_NOT_ALLOWED"), ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // =========================================================================
  // 3. REQUEST ID TRACING PLUGIN (UUID v4)
  // =========================================================================
  app.addHook("onRequest", async (req, reply) => {
    const existingId = req.headers["x-request-id"];
    req.id = Array.isArray(existingId) ? existingId[0] : (existingId || crypto.randomUUID());
    reply.header("X-Request-ID", req.id);
  });



  // =========================================================================
  // 5. AUTH GUARD (JWT verification via TokenFactory claims)
  // =========================================================================
  app.addHook("preHandler", async (req, reply) => {
    const publicRoutes = ["/health", "/status", "/login"];
    if (publicRoutes.includes(req.routeOptions.url || "")) return;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.status(401).send({ error: "Unauthorized", code: "TOKEN_MISSING" });
      return;
    }

    const token = authHeader.split(" ")[1];
    try {
      let payload;
      if (JWKS) {
        const result = await jwtVerify(token, JWKS, {
          issuer: "https://auth.voxa.ai",
          audience: "https://voxa.ai/app",
        });
        payload = result.payload;
      } else {
        // HS256 dev mode
        const { jwtVerify: verify } = await import("jose");
        const secret = new TextEncoder().encode(jwtSecret || "");
        const result = await verify(token, secret, {
          issuer: "https://auth.voxa.ai",
          audience: "https://voxa.ai/app",
          algorithms: ["HS256"],
        });
        payload = result.payload;
      }

      // Assert Blacklisted Session Tokens (JTI) for revoked access tokens
      const isRevoked = await redis.get(`blacklist:jti:${payload.jti}`);
      if (isRevoked) {
        reply.status(401).send({
          error: "Unauthorized",
          code: "TOKEN_REVOKED",
          message: "This session token has been explicitly blacklisted.",
        });
        return;
      }

      req.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        role: payload.role as any,
        tenantId: payload.tenantId as string,
      };
    } catch (err: any) {
      const code = err.code === "ERR_JWT_EXPIRED" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      reply.status(401).send({ error: "Unauthorized", code });
    }
  });

  // =========================================================================
  // 5.5. RATE LIMITING MIDDLEWARE (Per-Tenant Sliding Window)
  // =========================================================================
  app.addHook("preHandler", async (req, reply) => {
    // Avoid rate limiting internal/health checks
    if (req.routeOptions.url === "/health" || req.routeOptions.url === "/status") return;

    // Securely pull tenantId from the verified JWT payload rather than spoofable headers
    const tenantId = req.user ? req.user.tenantId : "anonymous";
    const key = `ratelimit:tenant:${tenantId}`;
    const now = Date.now();
    const windowStart = now - 60000; // 60s sliding window

    try {
      const p = redis.pipeline();
      p.zremrangebyscore(key, 0, windowStart);
      p.zadd(key, { score: now, member: String(now) });
      p.zcard(key);
      p.expire(key, 60);

      const results = await p.exec();
      const requestCount = results[2] as number;

      // Default to STARTER limit securely
      const limit = 100; // Starter: 100 req/min

      if (requestCount > limit) {
        reply.header("Retry-After", "60");
        reply.status(429).send({
          error: "Too Many Requests",
          code: "TENANT_RATE_LIMIT_EXCEEDED",
          message: "Sliding window rate limit exceeded for your tier.",
          limit,
          remaining: 0,
        });
      }
    } catch (err) {
      app.log.error(err as Error, "Sliding window rate limiting pipeline failed");
    }
  });

  // =========================================================================
  // 6. TENANT CONTEXT INJECTION (Scoped DB Client)
  // =========================================================================
  app.addHook("preHandler", async (req, reply) => {
    if (!req.user) return;
    // Binds tenant database context to enforce PostgreSQL RLS policies
    req.db = getTenantClient(req.user.tenantId);
  });

  // =========================================================================
  // 7. AUDIT HOOKS (Auto-log B2B transaction states)
  // =========================================================================
  app.addHook("onResponse", async (req, reply) => {
    const isStateChanging = ["POST", "PUT", "DELETE"].includes(req.method);
    if (!isStateChanging || !req.user || reply.statusCode >= 400) return;

    // Track dynamic endpoint actions (e.g. POST_EXPORT)
    const resourceName = req.routeOptions.url || "UNKNOWN_RESOURCE";
    const endpointSegments = resourceName.split("/");
    const suffix = endpointSegments.pop() || "";
    const action = `${req.method}_${suffix}`.toUpperCase();

    const previousState = { status: "STAGED" };
    const newState = {
      status: "COMPLETED",
      requestId: req.id,
      statusCode: reply.statusCode,
      latencyMs: reply.elapsedTime,
    };

    // Log the transaction state asynchronously
    logAuditEvent(
      req.user.tenantId,
      req.user.email,
      action,
      resourceName,
      previousState,
      newState
    ).catch((err) => {
      app.log.error(err as Error, "[AUDIT LOG FAILURE] Asynchronous trace injection failed");
    });
  });

  // =========================================================================
  // 8. ROUTE REGISTRATIONS
  // =========================================================================
  app.get("/health", async () => ({
    status: "ok",
    service: "voxa-fastify",
    timestamp: new Date().toISOString()
  }));

  await app.register(contactsRoutes, { prefix: "/contacts" });
  await app.register(tenantRoutes, { prefix: "/tenant" });

  return app;
}
