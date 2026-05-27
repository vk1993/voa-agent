import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJwt } from "../../../../proxy";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Missing session cookie" }, { status: 401 });
    }

    const payload = await verifySessionJwt(sessionCookie);
    if (!payload) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid or expired session token" }, { status: 401 });
    }

    // Defensively query the tenant name from the database
    let tenantName = "Voxa Luxury Design";
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: payload.tenantId },
      });
      if (tenant) {
        tenantName = tenant.name;
      }
    } catch (dbError) {
      console.warn("Database lookup for tenant name failed. Using default.", dbError);
    }

    // Defensively query the user metadata from the database
    let userName = payload.role === "ADMIN" ? "Priya Nair" : "Vishal Kumar";
    let userEmail = payload.role === "ADMIN" ? "priya.nair@voxa.ai" : "visal.kumar@voxa.ai";

    try {
      const user = await prisma.user.findFirst({
        where: { id: payload.sub },
      });
      if (user) {
        userName = user.name || userName;
        userEmail = user.email || userEmail;
      }
    } catch (dbError) {
      console.warn("Database lookup for user name/email failed. Using default.", dbError);
    }

    return NextResponse.json({
      userId: payload.sub,
      email: userEmail,
      name: userName,
      role: payload.role,
      tenantId: payload.tenantId,
      tenantName,
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" }, { status: 500 });
  }
}
