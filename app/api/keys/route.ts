import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuditLog } from "@/lib/security/api-wrapper";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import crypto from "crypto";

/**
 * Helper: Securely resolves and cryptographically verifies the tenant context.
 * Only administrative accounts (role === ADMIN) are authorized to access and manage API keys.
 */
async function getVerifiedTenantId(
  request: NextRequest
): Promise<string | null> {
  const session = await verifySessionFromRequest(request);
  if (!session || !session.tenantId) return null;
  if (session.role !== "ADMIN") return null; // only admins manage keys
  return session.tenantId;
}

/**
 * GET /api/keys
 * Lists all active and revoked API keys for the client's tenant.
 */
async function getHandler(request: NextRequest) {
  try {
    const tenantId = await getVerifiedTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify tenant exists in PostgreSQL
    const dbTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!dbTenant) {
      return NextResponse.json(
        { success: false, error: "Tenant Not Found" },
        { status: 404 }
      );
    }

    // Fetch from PostgreSQL database
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const responseKeys = apiKeys.map(k => ({
      id: k.id,
      name: k.name,
      key: `${k.keyPrefix}******************`,
      status: k.status,
      createdAt: k.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, apiKeys: responseKeys });
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
    const tenantId = await getVerifiedTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    let name = body.name;

    if (!name || typeof name !== 'string') {
      name = "Unnamed CRM Connection";
    } else {
      name = name.trim();
      if (name.length === 0 || name.length > 64) {
        return NextResponse.json(
          { success: false, error: "Name must be between 1 and 64 characters long" },
          { status: 400 }
        );
      }
      if (!/^[a-zA-Z0-9\s_\-.]+$/.test(name)) {
        return NextResponse.json(
          { success: false, error: "Name contains invalid characters" },
          { status: 400 }
        );
      }
    }

    // Verify tenant exists in PostgreSQL
    const dbTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!dbTenant) {
      return NextResponse.json(
        { success: false, error: "Tenant Not Found" },
        { status: 404 }
      );
    }

    // Generate cryptographic secure 32-character key payload
    const rawEntropy = crypto.randomBytes(16).toString("hex");
    const fullApiKey = `voxa_live_${rawEntropy}`;
    const keyPrefix = fullApiKey.slice(0, 12); // "voxa_live_..."
    const keyHash = crypto.createHash("sha256").update(fullApiKey).digest("hex");

    // Write to Prisma DB
    const newKeyRecord = await prisma.apiKey.create({
      data: {
        name,
        keyPrefix,
        keyHash,
        tenantId,
        status: "ACTIVE",
      },
    });

    const responseKey = {
      id: newKeyRecord.id,
      name: newKeyRecord.name,
      key: `${newKeyRecord.keyPrefix}******************`,
      status: newKeyRecord.status,
      createdAt: newKeyRecord.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "API Key generated successfully. Save this raw value now, it will not be shown again!",
      rawKey: fullApiKey,
      keyRecord: responseKey,
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
    const tenantId = await getVerifiedTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      
      const responseKey = {
        id: updatedKey.id,
        name: updatedKey.name,
        key: `${updatedKey.keyPrefix}******************`,
        status: updatedKey.status,
        createdAt: updatedKey.createdAt.toISOString(),
      };
      
      return NextResponse.json({ success: true, message: "API key revoked successfully", key: responseKey });
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
