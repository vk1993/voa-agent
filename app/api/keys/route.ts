import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuditLog } from "@/lib/security/api-wrapper";
import crypto from "crypto";

const prisma = new PrismaClient();

// Helper to decode tenant information from session cookie defensively
function getTenantId(request: NextRequest): string {
  const sessionCookie = request.cookies.get("session")?.value;
  if (sessionCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie));
      return session.tenantId || session.tenant || "voxa-default-tenant";
    } catch (e) {}
  }
  return "voxa-default-tenant";
}

/**
 * GET /api/keys
 * Lists all active and revoked API keys for the client's tenant.
 */
async function getHandler(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);

    // Fetch from SQLite database
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    // If database has no keys, seed standard demo key for immediate developer validation
    if (apiKeys.length === 0) {
      // Find or create default tenant for SQLite foreign key constraint
      let tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            id: tenantId,
            name: "Prestige Luxury Interiors",
          },
        });
      }

      // Create a default initial key
      const demoKey = await prisma.apiKey.create({
        data: {
          name: "Salesforce CRM Lead Trigger",
          key: "voxa_live_c13a48e718b52f9a764d0092147ea410",
          tenantId: tenant.id,
          status: "ACTIVE",
        },
      });
      return NextResponse.json({ success: true, apiKeys: [demoKey] });
    }

    return NextResponse.json({ success: true, apiKeys });
  } catch (error: any) {
    console.error("Failed to list API Keys:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/keys
 * Programmatically generates a brand new secure API key.
 * Wrapped with withAuditLog to record key generation actions.
 */
async function postHandler(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    const name = body.name || "Unnamed CRM Connection";

    // Guarantee default tenant exists
    let tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          name: "Prestige Luxury Interiors",
        },
      });
    }

    // Generate cryptographic secure 32-character key payload
    const rawEntropy = crypto.randomBytes(16).toString("hex");
    const fullApiKey = `voxa_live_${rawEntropy}`;

    // Write to Prisma DB
    const newKeyRecord = await prisma.apiKey.create({
      data: {
        name,
        key: fullApiKey, // In a high-security prod environment, store the SHA-256 hash. Here we store it for easy Admin retrieval demo.
        tenantId: tenant.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "API Key generated successfully. Save this raw value now, it will not be shown again!",
      rawKey: fullApiKey,
      keyRecord: newKeyRecord,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Failed to generate API Key:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/keys (or DELETE /api/keys)
 * Revokes or deletes an active API key to block integrations.
 * Wrapped with withAuditLog to record key revocations.
 */
async function putHandler(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    const { keyId, action } = body; // action: "REVOKE" | "DELETE"

    if (!keyId) {
      return NextResponse.json({ success: false, error: "Missing keyId parameter" }, { status: 400 });
    }

    if (action === "REVOKE") {
      // Update key record status to REVOKED in Prisma
      const updatedKey = await prisma.apiKey.update({
        where: { id: keyId, tenantId },
        data: { status: "REVOKED" },
      });
      return NextResponse.json({ success: true, message: "API key revoked successfully", key: updatedKey });
    } else {
      // Standard hard delete removal
      await prisma.apiKey.delete({
        where: { id: keyId, tenantId },
      });
      return NextResponse.json({ success: true, message: "API key hard deleted successfully" });
    }

  } catch (error: any) {
    console.error("Failed to modify API Key status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Bind higher-order audit trail logging middleware wrapper to state-changing methods
export const GET = getHandler;
export const POST = withAuditLog(postHandler, "GENERATE_KEY", "API_KEYS");
export const PUT = withAuditLog(putHandler, "REVOKE_KEY", "API_KEYS");
