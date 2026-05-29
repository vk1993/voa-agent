import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJwt } from "../../../../proxy";
import prisma from "@/lib/prisma";

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

    // Query the tenant from the database
    let tenantName: string | null = null;
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
      });
      if (tenant) {
        tenantName = tenant.name;
      }
    } catch (dbError) {
      console.warn("Database lookup for tenant name failed:", dbError);
    }

    // Query the user metadata from the database
    let userName: string | null = null;
    let userEmail: string | null = payload.email || null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (user) {
        userName = user.name || null;
        userEmail = user.email || userEmail;
      }
    } catch (dbError) {
      console.warn("Database lookup for user details failed:", dbError);
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
