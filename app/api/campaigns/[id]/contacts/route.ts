import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";

/**
 * GET /api/campaigns/:id/contacts
 * Returns contacts eligible for a campaign (status NEW or CALLED),
 * ordered by leadScore descending. Used by the live monitor.
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

    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const db = getTenantClient(session.tenantId);

    // Verify the campaign belongs to this tenant
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, tenantId: session.tenantId },
    });
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const contacts = await db.contact.findMany({
      where: {
        tenantId: session.tenantId,
        status: { in: ["NEW", "CALLED"] },
      },
      orderBy: { leadScore: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        leadScore: true,
        location: true,
        domainQualifier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, contacts, campaign: { id: campaign.id, name: campaign.name } });
  } catch (error: any) {
    console.error("[campaigns/id/contacts] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
