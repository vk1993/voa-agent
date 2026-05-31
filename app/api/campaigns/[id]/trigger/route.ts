import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await context.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { tenant: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "RUNNING") {
      return NextResponse.json({ error: "Campaign is not running" }, { status: 400 });
    }

    // Fetch next available contact, EXCLUDING DND, DELETION_REQUESTED, ARCHIVED
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId: campaign.tenantId,
        status: {
          notIn: ["DND", "DELETION_REQUESTED", "ARCHIVED", "BOOKED", "CONVERTED", "CALLED"]
        }
      },
      orderBy: { createdAt: "asc" }
    });

    if (!contact) {
      return NextResponse.json({ message: "No contacts available to trigger" });
    }

    // Mark as queued
    await prisma.contact.update({
      where: { id: contact.id },
      data: { status: "QUEUED" }
    });

    // In a real implementation, this would make an API call to Vapi to trigger the outbound call
    // For now we just return the contact that was selected.

    return NextResponse.json({ success: true, contactId: contact.id, phone: contact.phone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
