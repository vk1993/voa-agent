import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";

/**
 * GET /api/contacts/:id
 * Returns a single contact + last 20 call logs + tags for the detail / call-review panel.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getTenantClient(session.tenantId);

    const contact = await db.contact.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        callLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            postCallActions: true,
          },
        },
        tags: true,
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
        assignedShowroom: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("[contacts/id] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
