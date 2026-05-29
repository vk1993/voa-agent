import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJwt } from "../../../../proxy";
import { Redis } from "@upstash/redis";

// Instantiate Upstash Redis client safely
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (sessionCookie) {
      const payload = await verifySessionJwt(sessionCookie);
      
      // If the session is valid and has a JTI, blacklist it in Redis
      if (payload && payload.jti && redis) {
        const blacklistKey = `blacklist:jti:${payload.jti}`;
        // Blacklist token for 24 hours (86400 seconds) matching token TTL
        await redis.set(blacklistKey, "true", { ex: 86400 });
        console.log(`[AUTH] Session blacklisted: ${payload.jti}`);
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
