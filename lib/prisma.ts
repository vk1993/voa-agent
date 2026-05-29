import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client Singleton.
 * Prevents multiple PrismaClient instantiations in serverless/edge environments
 * (Vercel, Lambda) where module-scoped variables may be re-evaluated per request.
 *
 * Usage: import prisma from "@/lib/prisma";
 *
 * NOTE: This client does NOT enforce Row-Level Security (RLS).
 * For tenant-scoped queries that require RLS, use getTenantClient() from lib/prisma-tenant.ts.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
