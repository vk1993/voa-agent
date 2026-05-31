import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionJwt } from "../../../../proxy";
import redis from "@/lib/redis";

export async function POST(request: NextRequest) {
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

    const { vertical, tenantContext } = await request.json();

    if (!vertical || !tenantContext) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "vertical and tenantContext are required." },
        { status: 400 }
      );
    }

    // Update Prisma database: save vertical, config, set onboardingComplete = true and onboardingStep = 7
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        vertical: vertical,
        config: tenantContext,
        onboardingComplete: true,
        onboardingStep: 7,
      },
    });

    // Synchronize onboardingComplete status with Redis Edge Cache using partitioned namespace
    try {
      await redis.set(`t:${tenantId}:onboarding`, "true");
    } catch (redisError) {
      console.error("[ONBOARDING] Failed to push onboardingComplete:true to Redis:", redisError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ONBOARDING] Onboarding complete route failure:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to save onboarding configuration." },
      { status: 500 }
    );
  }
}
