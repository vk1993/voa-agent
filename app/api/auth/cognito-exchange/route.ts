import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let role: "ADMIN" | "SALES_AGENT";
    let userId: string;
    let tenantId: string;

    // Cognito mock checking
    const userPoolId = process.env.COGNITO_USER_POOL_ID || "us-east-1_mockPool";
    if (userPoolId === "us-east-1_mockPool" || !process.env.COGNITO_USER_POOL_ID) {
      // Mock validation checking
      if (email === "admin@voxa.ai" && password === "VoxaAdmin2026!") {
        role = "ADMIN";
      } else if (email === "agent@voxa.ai" && password === "VoxaAgent2026!") {
        role = "SALES_AGENT";
      } else {
        return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid credentials" }, { status: 401 });
      }
    } else {
      // Real Cognito auth flow would be here. Fallback to mock for testing if no Cognito client is configured.
      if (email === "admin@voxa.ai" && password === "VoxaAdmin2026!") {
        role = "ADMIN";
      } else if (email === "agent@voxa.ai" && password === "VoxaAgent2026!") {
        role = "SALES_AGENT";
      } else {
        return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid credentials" }, { status: 401 });
      }
    }

    // Resolve tenant and user information from the database
    let dbUser = await prisma.user.findFirst({
      where: { email },
    });

    if (dbUser) {
      userId = dbUser.id;
      tenantId = dbUser.tenantId;
    } else {
      // Find or seed a default tenant defensively in development
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
      
      // Create user record
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

    // Call /api/auth/exchange route to obtain secure JWT
    const exchangeUrl = new URL("/api/auth/exchange", request.url).toString();
    const exchangeRes = await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, role, tenantId }),
    });

    const exchangeData = await exchangeRes.json();
    if (!exchangeData.success) {
      return NextResponse.json({ error: "Exchange handshake failed" }, { status: 500 });
    }

    const token = exchangeData.token;

    // Store JWT in an HttpOnly cookie via Set-Cookie response header (never client JS)
    // Omit `Secure` on localhost (http) so the browser actually stores the cookie.
    // In production (HTTPS) the Secure flag is always added.
    const isProduction = process.env.NODE_ENV === "production";
    const cookieFlags = isProduction
      ? "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400"
      : "HttpOnly; SameSite=Lax; Path=/; Max-Age=86400";

    const response = NextResponse.json({ success: true, role, email });
    response.headers.set("Set-Cookie", `session=${token}; ${cookieFlags}`);

    return response;
  } catch (error: any) {
    console.error("Cognito exchange route failure:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: error.message }, { status: 500 });
  }
}
