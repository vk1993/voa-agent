import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { withAuditLog } from "@/lib/security/api-wrapper";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import redis from "@/lib/redis";

async function createOrgHandler(request: NextRequest) {
  try {
    // 1. Verify SUPER_ADMIN only
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only Super Admins can provision organizations." },
        { status: 403 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json().catch(() => ({}));
    const { companyName, adminEmail, vertical } = body as {
      companyName: string;
      adminEmail: string;
      vertical?: string;
    };

    if (!companyName || !adminEmail) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "companyName and adminEmail are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 3. Check if user already exists globally (allow re-invite of INVITED users)
    const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (existing && existing.status !== "INVITED") {
      return NextResponse.json(
        { error: "CONFLICT", message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Generate unique tenant slug
    let baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "tenant";
    let tenantSlug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: tenantSlug } })) {
      tenantSlug = `${baseSlug}-${counter++}`;
    }

    // Validate vertical against Prisma enum values
    const VALID_VERTICALS = [
      "INTERIOR_DESIGN", "REAL_ESTATE", "CONSTRUCTION", "PRODUCT_SALES",
      "FINANCIAL_SERVICES", "HEALTHCARE", "EDUCATION", "CUSTOM", "GENERIC",
    ];
    const resolvedVertical = vertical && VALID_VERTICALS.includes(vertical) ? vertical : "CUSTOM";

    // 5. Create Tenant + placeholder Admin user in an atomic transaction
    const { tenant, adminUser } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: tenantSlug,
          status: "ACTIVE",
          onboardingComplete: false,
          vertical: resolvedVertical as any,
        },
      });

      // Upsert: if the user existed as INVITED from a previous attempt, overwrite them
      let adminUser;
      if (existing) {
        adminUser = await tx.user.update({
          where: { id: existing.id },
          data: {
            tenantId: tenant.id,
            role: "ADMIN",
            isActive: false,
            status: "INVITED",
            cognitoSub: "PENDING_INVITE",
          },
        });
      } else {
        adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            role: "ADMIN",
            tenantId: tenant.id,
            cognitoSub: "PENDING_INVITE",
            isActive: false,
            status: "INVITED",
            name:
              adminEmail.split("@")[0].charAt(0).toUpperCase() +
              adminEmail.split("@")[0].slice(1),
          },
        });
      }

      return { tenant, adminUser };
    });

    // 6. Sync onboarding state to Redis (fail-open)
    try {
      await redis.set(`t:${tenant.id}:onboarding`, "false");
    } catch (e) {
      console.error("[SUPER_ADMIN] Redis onboarding sync failed (fail-open):", e);
    }

    // 7. Generate magic-link token + 6-digit OTP backup code
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const inviteExpiry = new Date(Date.now() + 86400000); // 24h

    // Cache in Redis (fail-open)
    try {
      await redis.set(
        `invite:${inviteToken}`,
        JSON.stringify({
          email: adminEmail,
          role: "ADMIN",
          tenantId: tenant.id,
          otpCode,
          used: false,
        }),
        "EX",
        86400
      );
      await redis.set(`invite:otp:${otpCode}`, inviteToken, "EX", 86400);
    } catch (e) {
      console.error("[SUPER_ADMIN] Redis invite cache failed (fail-open):", e);
    }

    // Persist token in DB so it survives Redis eviction
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { inviteToken, inviteExpiry },
    });

    // 8. Send onboarding invitation email via SES
    const sesRegion = process.env.AWS_SES_REGION;
    const fromEmail = process.env.SES_FROM_EMAIL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voxa.ai";

    if (sesRegion && fromEmail) {
      try {
        const ses = new SESClient({ region: sesRegion });
        const magicLink = `${appUrl}/accept-invite?token=${inviteToken}`;

        await ses.send(
          new SendEmailCommand({
            Source: fromEmail,
            Destination: { ToAddresses: [adminEmail] },
            Message: {
              Subject: {
                Data: `You've been invited to set up ${companyName} on VOXA`,
              },
              Body: {
                Html: {
                  Data: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#0F0F12;color:#F3F4F6;border-radius:16px;border:1px solid rgba(255,255,255,0.06)">
                      <div style="text-align:center;margin-bottom:24px">
                        <div style="width:40px;height:40px;background:#C9A14A;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#0F0F12;margin-bottom:12px">V</div>
                        <h2 style="color:#C9A14A;font-size:22px;margin:0">Welcome to VOXA</h2>
                        <p style="color:#94A3B8;font-size:13px;margin-top:6px">Your organization <strong style="color:#F3F4F6">${companyName}</strong> has been provisioned.</p>
                      </div>
                      <p style="font-size:14px;line-height:1.65;color:#F3F4F6">
                        You have been designated as the <strong>Admin</strong> for ${companyName} on VOXA.
                        Click the button below to set your password and complete your organization setup.
                      </p>
                      <div style="text-align:center;margin:32px 0">
                        <a href="${magicLink}"
                          style="display:inline-block;padding:14px 32px;background:#C9A14A;color:#0F0F12;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(201,161,74,0.3)">
                          Activate your account →
                        </a>
                      </div>
                      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:16px;border-radius:10px;text-align:center">
                        <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:6px;font-family:monospace;letter-spacing:0.06em">BACKUP ACCESS CODE</span>
                        <strong style="font-size:26px;color:#C9A14A;letter-spacing:0.18em">${otpCode}</strong>
                        <p style="font-size:11px;color:#94A3B8;margin-top:10px;line-height:1.5">
                          If the button doesn't open, go to
                          <a href="${appUrl}/accept-invite" style="color:#C9A14A;text-decoration:none">${appUrl}/accept-invite</a>
                          and enter this code.
                        </p>
                      </div>
                      <p style="font-size:11px;color:#475569;margin-top:28px;text-align:center">
                        This invitation expires in 24 hours. Do not share this code.
                      </p>
                    </div>
                  `,
                },
              },
            },
          })
        );
      } catch (sesErr) {
        // Log but don't fail — token is valid in Redis + DB
        console.error("[SUPER_ADMIN] SES delivery failed (fail-open):", sesErr);
      }
    } else {
      // Dev: log magic link to console so it can be tested without SES
      console.info(
        `[SUPER_ADMIN DEV] Invite link for ${adminEmail}: ${appUrl}/accept-invite?token=${inviteToken} | OTP: ${otpCode}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Organization "${companyName}" provisioned. Invitation sent to ${adminEmail}.`,
      tenantId: tenant.id,
      tenantSlug,
    });
  } catch (error) {
    console.error("[SUPER_ADMIN] Create org failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to provision organization." },
      { status: 500 }
    );
  }
}

// GET — list all orgs (Super Admin only)
async function listOrgsHandler(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        vertical: true,
        onboardingComplete: true,
        plan: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json({ success: true, tenants });
  } catch (error) {
    console.error("[SUPER_ADMIN] List orgs failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to list organizations." },
      { status: 500 }
    );
  }
}

export const POST = withAuditLog(createOrgHandler, "TENANT_PROVISIONED", "ORGANIZATION");
export const GET = listOrgsHandler;
