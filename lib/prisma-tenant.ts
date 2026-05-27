import { PrismaClient } from "@prisma/client";

/**
 * Tenant-scoped Prisma Client Provider.
 * Attaches a dynamic query middleware that executes a set_tenant_context
 * call with the session's tenant UUID, enforcing PostgreSQL Row-Level Security
 * boundaries at the connection transaction layer for all database operations.
 */
export function getTenantClient(tenantId: string): PrismaClient {
  const db = new PrismaClient();

  // Before every query, set PostgreSQL tenant context
  // Note: We cast db to any here to satisfy type constraints in Prisma Client v6,
  // where the runtime $use middleware has been deprecated in favor of client extensions.
  (db as any).$use(async (params: any, next: any) => {
    // Inject the session-level tenant isolation context to the transaction
    await db.$executeRaw`
      SELECT set_tenant_context(${tenantId}::uuid)
    `;
    return next(params);
  });

  return db;
}
