import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJwt } from "../../../../proxy";
import redis from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (sessionCookie) {
      const payload = await verifySessionJwt(sessionCookie);
      
      // If the session is valid and has a JTI, blacklist it in Redis with multi-tenant prefix format
      if (payload && payload.jti) {
        const blacklistKey = `t:${payload.tenantId}:blacklist:jti:${payload.jti}`;
        
        try {
          // Blacklist token for 24 hours (86400 seconds) matching token TTL
          await redis.set(blacklistKey, "true", "EX", 86400);
          console.log(`[AUTH] Session blacklisted locally/production: ${payload.jti}`);
        } catch (redisErr) {
          console.error("[AUTH] Blacklist set failure (fail-open):", redisErr);
        }
      }
    }

    // Prepare response clearing the HttpOnly session cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieFlags = isProduction
      ? "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      : "HttpOnly; SameSite=Lax; Path=/; Max-Age=0";

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.headers.set("Set-Cookie", `session=; ${cookieFlags}`);

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/logout failed:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
