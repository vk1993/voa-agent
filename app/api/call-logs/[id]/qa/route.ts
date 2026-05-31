import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";

/**
 * POST /api/call-logs/:id/qa
 * Saves a QA score into the CallLog.qaScore JSON field.
 * Body: { criteria: string[], score: number, note: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden — Admin role required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { criteria, score, note } = body;

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { success: false, error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }
    if (!Array.isArray(criteria)) {
      return NextResponse.json(
        { success: false, error: "Criteria must be an array of strings" },
        { status: 400 }
      );
    }

    const db = getTenantClient(session.tenantId);

    // Verify the call log belongs to this tenant
    const callLog = await db.callLog.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!callLog) {
      return NextResponse.json({ success: false, error: "Call log not found" }, { status: 404 });
    }

    const qaScore = {
      criteria,
      score,
      note: note || "",
      scoredAt: new Date().toISOString(),
      scoredBy: session.sub,
    };

    const updated = await db.callLog.update({
      where: { id },
      data: { qaScore },
    });

    return NextResponse.json({ success: true, callLog: updated });
  } catch (error: any) {
    console.error("[call-logs/id/qa] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
