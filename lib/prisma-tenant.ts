import { PrismaClient } from "@prisma/client";

// Global singleton to prevent connection exhaustion
const globalPrisma = new PrismaClient();

/**
 * Tenant-scoped Prisma Client Provider.
 * Attaches a dynamic query middleware using Prisma Client Extensions.
 * It wraps every query in a transaction that first executes a set_tenant_context
 * call with the session's tenant UUID, enforcing PostgreSQL Row-Level Security
 * boundaries at the connection transaction layer for all database operations.
 */
export function getTenantClient(tenantId: string): PrismaClient {
  return globalPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await globalPrisma.$transaction([
            globalPrisma.$executeRaw`SELECT set_tenant_context(${tenantId}::uuid)`,
            query(args)
          ]);
          return result;
        }
      }
    }
  }) as unknown as PrismaClient;
}
