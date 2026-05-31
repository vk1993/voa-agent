import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import redis from "@/lib/redis";

const IS_DEV = process.env.NODE_ENV !== "production";

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
    const { companyName, email, password, vertical } = await request.json();

    if (!companyName || !email || !password) {
      return NextResponse.json({ error: "Company Name, Email, and Password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // In a real production environment, this is where we would call:
    // cognitoClient.send(new AdminCreateUserCommand({ UserPoolId, Username: email, ... }));
    // For local and early development, we will mock the Cognito Sub identity.
    const cognitoSub = crypto.randomUUID();

    // Generate Tenant Slug
    let baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "tenant";
    
    // Ensure uniqueness of slug
    let tenantSlug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: tenantSlug } })) {
      tenantSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Start Database Transaction for isolation
    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: tenantSlug,
          status: "ACTIVE", // For immediate onboarding
          onboardingComplete: false,
          vertical: vertical || "CUSTOM",
        },
      });

      const newUser = await tx.user.create({
        data: {
          email,
          role: "ADMIN",
          tenantId: newTenant.id,
          cognitoSub: cognitoSub,
          isActive: true,
          name:
            email.split("@")[0].charAt(0).toUpperCase() +
            email.split("@")[0].slice(1), // derive name from email prefix
        },
      });

      return { tenant: newTenant, user: newUser };
    });

    const { tenant, user } = result;

    // Synchronize onboarding complete false status with Redis Edge Cache using partitioned namespace
    try {
      await redis.set(`t:${tenant.id}:onboarding`, "false");
    } catch (redisError) {
      console.error("[ONBOARDING] Failed to push onboardingComplete:false to Redis", redisError);
    }

    // S3 Cold Storage Partition Setup
    try {
      if (process.env.AWS_REGION && process.env.RECORDINGS_BUCKET_NAME) {
        const s3Client = new S3Client({ region: process.env.AWS_REGION });
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.RECORDINGS_BUCKET_NAME,
            Key: `tenants/${tenant.id}/.keep`,
            Body: "",
          })
        );
      } else {
        console.warn("[ONBOARDING] AWS S3 environment variables missing. Skipping S3 prefix creation.");
      }
    } catch (s3Error) {
      console.error("[ONBOARDING] Failed to create S3 prefix", s3Error);
      // We don't fail the whole onboarding if S3 bucket isn't available right now.
    }

    // Sign JWT directly
    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      sub: user.id,
      email,
      role: "ADMIN",
      tenantId: tenant.id,
      jti,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("https://auth.voxa.ai")
      .setAudience("https://voxa.ai/app")
      .setExpirationTime("24h")
      .sign(getJwtSecret());

    // Set HttpOnly session cookie
    const cookieFlags = !IS_DEV
      ? "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400"
      : "HttpOnly; SameSite=Lax; Path=/; Max-Age=86400";

    const response = NextResponse.json({ success: true, role: "ADMIN", email, redirectTo: "/onboarding" });
    response.headers.set("Set-Cookie", `session=${token}; ${cookieFlags}`);

    return response;
  } catch (error: any) {
    console.error("Onboarding route failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Onboarding failed due to an internal error." },
      { status: 500 }
    );
  }
}
