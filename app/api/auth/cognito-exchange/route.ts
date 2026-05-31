import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import * as Cognito from "@aws-sdk/client-cognito-identity-provider";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * DEV-ONLY mock credential store.
 * In production, authentication is delegated entirely to AWS Cognito.
 * These credentials are NEVER checked when NODE_ENV === "production".
 */
const DEV_CREDENTIALS: Record<string, { password: string | undefined; role: "ADMIN" | "SALES_AGENT" }> = {
  "admin@voxa.ai": { password: process.env.DEV_ADMIN_PASSWORD, role: "ADMIN" },
  "agent@voxa.ai": { password: process.env.DEV_AGENT_PASSWORD, role: "SALES_AGENT" },
};

/**
 * Returns the JWT signing secret. Fails hard if not configured.
 */
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let role: "ADMIN" | "SALES_AGENT";

    // ── Authentication Gate ──────────────────────────────────────────
    if (IS_DEV) {
      // Development only: validate against local mock credentials
      console.warn("[AUTH] ⚠️  Using DEV mock credentials. This is disabled in production.");
      const devUser = DEV_CREDENTIALS[email];
      if (!devUser || !devUser.password || devUser.password !== password) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Invalid credentials" },
          { status: 401 }
        );
      }
      role = devUser.role;
    } else {
      // Production: delegate to AWS Cognito InitiateAuth
      const cognito = new Cognito.CognitoIdentityProviderClient({
        region: process.env.AWS_REGION || "ap-south-1",
      });

      const userPoolId   = process.env.COGNITO_USER_POOL_ID;
      const clientId     = process.env.COGNITO_CLIENT_ID;
      const clientSecret = process.env.COGNITO_CLIENT_SECRET; // optional

      if (!userPoolId || !clientId) {
        return NextResponse.json(
          { error: "MISCONFIGURED", message: "Cognito not configured." },
          { status: 503 }
        );
      }

      // Build AUTH_PARAMETERS — add SECRET_HASH if client has a secret
      const authParams: Record<string, string> = {
        USERNAME: email,
        PASSWORD: password,
      };
      if (clientSecret) {
        const { createHmac } = await import("crypto");
        const hash = createHmac("sha256", clientSecret)
          .update(email + clientId)
          .digest("base64");
        authParams.SECRET_HASH = hash;
      }

      let cognitoRole: "ADMIN" | "SALES_AGENT";
      try {
        // @ts-ignore
        const authResult = await cognito.send(new Cognito.InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: clientId,
          AuthParameters: authParams,
        }));
        // Extract role from Cognito custom attribute or fall back to DB
        const idToken = authResult.AuthenticationResult?.IdToken;
        if (!idToken) {
          return NextResponse.json(
            { error: "AUTH_FAILED", message: "No token returned from Cognito." },
            { status: 401 }
          );
        }
        // Decode payload (no verify needed — we trust Cognito's response)
        const payloadB64 = idToken.split(".")[1];
        const claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
        cognitoRole = (claims["custom:role"] || "SALES_AGENT") as any;
      } catch (err: any) {
        if (err.name === "NotAuthorizedException" || err.name === "UserNotFoundException") {
          return NextResponse.json(
            { error: "UNAUTHORIZED", message: "Invalid credentials." },
            { status: 401 }
          );
        }
        throw err;
      }
      role = cognitoRole;
    }

    // ── Resolve user & tenant from database ──────────────────────────
    let dbUser = await prisma.user.findFirst({
      where: { email },
    });

    let userId: string;
    let tenantId: string;

    if (dbUser) {
      userId = dbUser.id;
      tenantId = dbUser.tenantId;
    } else {
      // In development: seed a default tenant if none exists
      let dbTenant = await prisma.tenant.findFirst();
      if (!dbTenant) {
        dbTenant = await prisma.tenant.create({
          data: {
            name: "Prestige Premium Interiors",
            slug: "prestige-premium-interiors",
          },
        });
      }
      tenantId = dbTenant.id;

      dbUser = await prisma.user.create({
        data: {
          email,
          role,
          tenantId,
          cognitoSub: crypto.randomUUID(),
          isActive: true,
        },
      });
      userId = dbUser.id;
    }

    // ── Sign JWT directly (no external exchange endpoint) ────────────
    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      sub: userId,
      email,
      role,
      tenantId,
      jti,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("https://auth.voxa.ai")
      .setAudience("https://voxa.ai/app")
      .setExpirationTime("24h")
      .sign(getJwtSecret());

    // ── Set HttpOnly session cookie ──────────────────────────────────
    const isProduction = process.env.NODE_ENV === "production";
    const cookieFlags = isProduction
      ? "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400"
      : "HttpOnly; SameSite=Lax; Path=/; Max-Age=86400";

    const response = NextResponse.json({ success: true, role, email });
    response.headers.set("Set-Cookie", `session=${token}; ${cookieFlags}`);

    return response;
  } catch (error: any) {
    console.error("Cognito exchange route failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Authentication failed due to an internal error." },
      { status: 500 }
    );
  }
}
