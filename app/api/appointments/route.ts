import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";

/**
 * GET /api/appointments
 * Returns CALLBACK_SCHEDULED PostCallActions for the current agent (SALES_AGENT)
 * or all agents (ADMIN), ordered by createdAt desc.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const db = getTenantClient(session.tenantId);

    // For agents, scope to contacts assigned to them
    // For admins, return all tenant-scoped callbacks
    const where: any = {
      tenantId: session.tenantId,
      actionType: "CALLBACK_SCHEDULED",
    };

    if (session.role === "SALES_AGENT") {
      where.contact = { assignedAgentId: session.sub };
    }

    const appointments = await db.postCallAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        contact: {
          select: { id: true, name: true, phone: true, email: true, status: true },
        },
        callLog: {
          select: { id: true, durationSeconds: true, outcomeType: true, transcriptSummary: true },
        },
      },
    });

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    console.error("[appointments] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
