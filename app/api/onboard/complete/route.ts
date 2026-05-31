import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionJwt } from "../../../../proxy";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const payload = await verifySessionJwt(sessionCookie);
    if (!payload) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const tenantId = payload.tenantId;

    // Update Prisma database
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingComplete: true },
    });

    // Synchronize onboardingComplete status with Redis Edge Cache
    try {
      await redis.set(`tenant:onboarding:${tenantId}`, "true");
    } catch (redisError) {
      console.error("[ONBOARDING] Failed to push onboardingComplete:true to Redis", redisError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ONBOARDING] Onboarding complete endpoint failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to mark onboarding as completed." },
      { status: 500 }
    );
  }
}
