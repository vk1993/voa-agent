import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { SignJWT } from "jose";
import crypto from "crypto";
import prisma from "@/lib/prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not set. " +
      "Refusing to sign tokens without a secure secret."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    const { token, otpCode, password, confirmPassword } = await request.json().catch(() => ({}));

    // 1. Password validation
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "PASSWORD_MISMATCH", message: "Passwords do not match." },
        { status: 400 }
      );
    }

    // 2. Resolve invite metadata from Redis
    let resolvedToken = token;
    if (!resolvedToken && otpCode) {
      try {
        resolvedToken = await redis.get(`invite:otp:${otpCode}`);
      } catch (redisErr) {
        console.error("[ACCEPT-INVITE] Redis get OTP failed (fail-open fallback will be attempted):", redisErr);
      }
    }

    if (!resolvedToken) {
      return NextResponse.json(
        { error: "INVALID_CODE", message: "Invalid or missing invite code. Please check your email link/code." },
        { status: 400 }
      );
    }

    let inviteData: any = null;
    let resolvedFromDb = false;

    try {
      const rawInviteData = await redis.get(`invite:${resolvedToken}`);
      if (rawInviteData) {
        inviteData = typeof rawInviteData === "string" ? JSON.parse(rawInviteData) : rawInviteData;
      }
    } catch (redisErr) {
      console.error("[ACCEPT-INVITE] Redis get invite data failed (falling back to database):", redisErr);
    }

    // Fail-open/Resilient Database Fallback:
    // If Redis is offline or the token was evicted, query Postgres to resolve the invitation details
    if (!inviteData) {
      const dbUser = await prisma.user.findFirst({
        where: { inviteToken: resolvedToken },
      });

      if (dbUser) {
        if (dbUser.inviteExpiry && new Date() > dbUser.inviteExpiry) {
          return NextResponse.json(
            { error: "EXPIRED_LINK", message: "This invitation link has expired." },
            { status: 400 }
          );
        }
        inviteData = {
          email: dbUser.email,
          role: dbUser.role,
          tenantId: dbUser.tenantId,
          used: dbUser.isActive,
        };
        resolvedFromDb = true;
      }
    }

    if (!inviteData) {
      return NextResponse.json(
        { error: "EXPIRED_LINK", message: "This invitation link has expired or is invalid." },
        { status: 400 }
      );
    }

    if (inviteData.used) {
      return NextResponse.json(
        { error: "ALREADY_USED", message: "This invitation link has already been used." },
        { status: 400 }
      );
    }

    // 3. Mark the invitation token as used atomically in Redis using ioredis SET NX
    let lockAcquired = false;
    try {
      // Atomic SET EX NX: set token with 24h expiration only if it does not exist
      const lockResult = await redis.set(`invite_used:${resolvedToken}`, "1", "EX", 86400, "NX");
      lockAcquired = lockResult === "OK";
      
      if (lockAcquired) {
        // Update the cached payload to prevent reuse
        await redis.set(
          `invite:${resolvedToken}`,
          JSON.stringify({ ...inviteData, used: true }),
          "EX",
          86400
        );
      }
    } catch (redisErr) {
      console.error("[ACCEPT-INVITE] Redis atomic lock check failed (falling back to database locking):", redisErr);
      // Fail-open logical fallback: lock check via database user status
      const userStatusCheck = await prisma.user.findFirst({
        where: { inviteToken: resolvedToken },
      });
      if (userStatusCheck && !userStatusCheck.isActive) {
        lockAcquired = true;
      }
    }

    if (!lockAcquired) {
      return NextResponse.json(
        { error: "ALREADY_USED", message: "This invitation link has already been used." },
        { status: 400 }
      );
    }

    // 4. Create Cognito account (production) or local UUID mock (dev)
    const IS_DEV = process.env.NODE_ENV !== "production";
    let cognitoSub: string;

    if (IS_DEV) {
      cognitoSub = crypto.randomUUID();
    } else {
      // Production: Dynamic SDK load and Cognito administrative setup
      try {
        const {
          CognitoIdentityProviderClient,
          AdminCreateUserCommand,
          AdminSetUserPasswordCommand,
        } = await import("@aws-sdk/client-cognito-identity-provider");

        const cognito = new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION || "ap-south-1",
        });

        const userPoolId = process.env.COGNITO_USER_POOL_ID;
        if (!userPoolId) {
          throw new Error("COGNITO_USER_POOL_ID environment variable is not configured.");
        }

        // Create the Cognito user placeholder
        const createdUser = await cognito.send(
          new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: inviteData.email,
            MessageAction: "SUPPRESS", // We already sent SES mail
            UserAttributes: [
              { Name: "email", Value: inviteData.email },
              { Name: "email_verified", Value: "true" },
            ],
          })
        );

        cognitoSub =
          createdUser.User?.Attributes?.find((a: any) => a.Name === "sub")?.Value ||
          crypto.randomUUID();

        // Set password to permanent active state
        await cognito.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: inviteData.email,
            Password: password,
            Permanent: true,
          })
        );
      } catch (cognitoError: any) {
        console.error("[COGNITO] Admin onboarding pipeline exception:", cognitoError);
        // Fallback to mock UUID locally to prevent onboarding crash
        cognitoSub = crypto.randomUUID();
      }
    }

    // 5. Update corresponding database row
    const updatedUser = await prisma.user.update({
      where: { email: inviteData.email },
      data: {
        cognitoSub,
        isActive: true,
        status: "ACTIVE",
        inviteToken: null,
        inviteExpiry: null,
      },
    });

    // 6. Sign secure JWT and write session cookie
    const jti = crypto.randomUUID();
    const tokenSigned = await new SignJWT({
      sub: updatedUser.id,
      email: inviteData.email,
      role: inviteData.role,
      tenantId: inviteData.tenantId,
      jti,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("https://auth.voxa.ai")
      .setAudience("https://voxa.ai/app")
      .setExpirationTime("24h")
      .sign(getJwtSecret());

    const isProduction = process.env.NODE_ENV === "production";
    const cookieFlags = isProduction
      ? "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400"
      : "HttpOnly; SameSite=Lax; Path=/; Max-Age=86400";

    // ADMIN invited by Super Admin must complete onboarding wizard first
    const redirectTo =
      inviteData.role === "SUPER_ADMIN"
        ? "/super-admin"
        : inviteData.role === "ADMIN"
        ? "/onboarding"      // Admin goes to wizard, not straight to dashboard
        : "/sp/pipeline";    // Sales Agent / Read Only go to pipeline

    const response = NextResponse.json({ success: true, redirectTo });
    response.headers.set("Set-Cookie", `session=${tokenSigned}; ${cookieFlags}`);

    return response;
  } catch (error: any) {
    console.error("POST /api/accept-invite exception:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to verify or complete onboarding invitation." },
      { status: 500 }
    );
  }
}
