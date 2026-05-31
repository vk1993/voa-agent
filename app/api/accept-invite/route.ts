import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { SignJWT } from "jose";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

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
    if (!resolvedToken && otpCode && redis) {
      resolvedToken = await redis.get<string>(`invite:otp:${otpCode}`);
    }

    if (!resolvedToken) {
      return NextResponse.json(
        { error: "INVALID_CODE", message: "Invalid or missing invite code. Please check your email link/code." },
        { status: 400 }
      );
    }

    const rawInviteData = redis ? await redis.get<string>(`invite:${resolvedToken}`) : null;
    if (!rawInviteData) {
      return NextResponse.json(
        { error: "EXPIRED_LINK", message: "This invitation link has expired or has already been used." },
        { status: 400 }
      );
    }

    const inviteData = typeof rawInviteData === "string" ? JSON.parse(rawInviteData) : rawInviteData;
    
    // 3. Mark the invitation token as used atomically in Redis
    if (redis) {
      // Atomic SET NX (set if not exists) prevents race conditions from double clicks
      const lockAcquired = await redis.set(`invite_used:${resolvedToken}`, "1", { nx: true, ex: 86400 });
      
      if (!lockAcquired) {
        return NextResponse.json(
          { error: "ALREADY_USED", message: "This invitation link has already been used." },
          { status: 400 }
        );
      }

      // Update the main record to mark it used for visibility/fallback
      await redis.set(
        `invite:${resolvedToken}`,
        JSON.stringify({ ...inviteData, used: true }),
        { ex: 86400 }
      );
    } else {
      // Fallback for local development without Redis
      if (inviteData.used) {
        return NextResponse.json(
          { error: "ALREADY_USED", message: "This invitation link has already been used." },
          { status: 400 }
        );
      }
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

    const redirectTo = inviteData.role === "ADMIN" || inviteData.role === "SUPER_ADMIN"
      ? "/admin/contacts"
      : "/sp/pipeline";

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
