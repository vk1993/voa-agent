import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { withAuditLog } from "@/lib/security/api-wrapper";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import redis from "@/lib/redis";

async function inviteHandler(request: NextRequest) {
  try {
    // 1. Authenticate and enforce administrative privileges (ADMIN or SUPER_ADMIN)
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only admins can invite team members." },
        { status: 403 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json().catch(() => ({}));
    const { email, role } = body as { email: string; role: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "Please specify a valid business email." },
        { status: 400 }
      );
    }

    if (!role || !["SALES_AGENT", "READ_ONLY"].includes(role)) {
      return NextResponse.json(
        { error: "INVALID_ROLE", message: "Please select a valid role (SALES_AGENT or READ_ONLY)." },
        { status: 400 }
      );
    }

    const tenantId = session.tenantId;

    // 3. Prevent duplicate active accounts in the same tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId },
    });

    if (existingUser && existingUser.status !== "INVITED") {
      return NextResponse.json(
        { error: "CONFLICT", message: "User already exists in this tenant organization." },
        { status: 409 }
      );
    }

    // 4. Generate random invitation tokens
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const inviteExpiry = new Date(Date.now() + 86400000); // 24 hours validity

    // 5. Caching OIDC invitation contexts in standard TCP Redis safely
    try {
      await redis.set(
        `invite:${inviteToken}`,
        JSON.stringify({ email, role, tenantId, otpCode, used: false }),
        "EX",
        86400
      );
      await redis.set(`invite:otp:${otpCode}`, inviteToken, "EX", 86400);
    } catch (redisError) {
      console.error("[TEAM-INVITE] Caching invite in Redis failed (fail-open to database only):", redisError);
    }

    // 6. Deliver magic links via AWS SES
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
            Destination: { ToAddresses: [email] },
            Message: {
              Subject: { Data: "You've been invited to VOXA" },
              Body: {
                Html: {
                  Data: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background: #0F0F12; color: #F3F4F6; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #C9A14A; font-size: 22px; margin: 0;">You're Invited to VOXA</h2>
                        <p style="color: #94A3B8; font-size: 13px; margin-top: 6px;">Collaborative outbound sales platform gateway.</p>
                      </div>
                      
                      <p style="font-size: 14px; line-height: 1.6; color: #F3F4F6;">
                        You have been granted access to join our organization's dialer workspace on VOXA with the role of <strong>${role.replace("_", " ")}</strong>.
                      </p>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${magicLink}" style="display: inline-block; padding: 12px 28px; background: #C9A14A; color: #0F0F12; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(201,161,74,0.25);">
                          Accept Platform Invitation
                        </a>
                      </div>

                      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 10px; text-align: center; margin-top: 24px;">
                        <span style="font-size: 11px; color: #94A3B8; display: block; margin-bottom: 4px; font-family: monospace;">FALLBACK SECURITY CODE</span>
                        <strong style="font-size: 24px; color: #C9A14A; letter-spacing: 0.15em;">${otpCode}</strong>
                        <p style="font-size: 11px; color: #94A3B8; margin-top: 8px; line-height: 1.4;">
                          If the link fails to load, navigate to <a href="${appUrl}/accept-invite" style="color: #C9A14A; text-decoration: none;">${appUrl}/accept-invite</a> and input the code manually.
                        </p>
                      </div>
                      
                      <p style="font-size: 11px; color: #475569; margin-top: 30px; text-align: center;">
                        This magic activation code is highly sensitive and expires in 24 hours.
                      </p>
                    </div>
                  `,
                },
              },
            },
          })
        );
      } catch (sesError) {
        // Log error internally but do not crash the invite — database user is still created
        console.error("[INVITE] AWS SES delivery exception:", sesError);
      }
    }

    // 7. Store / Upsert placeholder user record in database
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        role: role as any,
        tenantId,
        cognitoSub: "PENDING_INVITE",
        isActive: false,
        status: "INVITED",
        inviteToken,
        inviteExpiry,
        name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      },
      update: {
        inviteToken,
        inviteExpiry,
        status: "INVITED",
        role: role as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization team invitation dispatched successfully.",
    });
  } catch (error) {
    console.error("POST /api/team/invite failure context:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to dispatch platform invitation." },
      { status: 500 }
    );
  }
}

export const POST = withAuditLog(inviteHandler, "USER_INVITED", "TEAM_MEMBER");
