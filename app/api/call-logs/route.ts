import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";
import { CallOutcome } from "@prisma/client";

/**
 * GET /api/call-logs?page=1&limit=20&campaignId=...&outcome=...&agentId=...
 * Returns paginated call logs for the admin call-review page.
 * All results are scoped to the authenticated tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const campaignId = searchParams.get("campaignId") || undefined;
    const outcome = searchParams.get("outcome") as CallOutcome | null;
    const agentId = searchParams.get("agentId") || undefined;

    const where: any = { tenantId: session.tenantId };
    if (campaignId) where.campaignId = campaignId;
    if (outcome) where.outcomeType = outcome;
    if (agentId) where.assignedAgentId = agentId;

    const db = getTenantClient(session.tenantId);

    const [callLogs, total] = await Promise.all([
      db.callLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: {
            select: { id: true, name: true, phone: true, email: true, status: true },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
      }),
      db.callLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      callLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[call-logs] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
