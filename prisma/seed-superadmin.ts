// prisma/seed-superadmin.ts
import { PrismaClient, Role, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "superadmin@local.dev";

    // Check if the user already exists – idempotent script
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        console.log(`✅ Super‑Admin already exists (id: ${existing.id})`);
        return;
    }

    // Ensure a placeholder tenant exists (global tenant)
    const globalTenant = await prisma.tenant.upsert({
      where: { slug: "global" },
      update: {},
      create: {
        name: "Global",
        slug: "global",
        status: "ACTIVE",
        onboardingComplete: false,
        vertical: "CUSTOM",
      },
    });

    // Create the Super‑Admin user attached to the global tenant
    const user = await prisma.user.create({
      data: {
        email,
        role: "SUPER_ADMIN" as Role,
        status: "ACTIVE" as UserStatus,
        isActive: true,
        cognitoSub: "LOCAL_SUPER_ADMIN",
        name: "Local Super‑Admin",
        tenantId: globalTenant.id,
      },
    });

    console.log(`🚀 Super‑Admin created → id: ${user.id}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
