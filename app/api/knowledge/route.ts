import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { withAuditLog } from "@/lib/security/api-wrapper";

/**
 * GET /api/knowledge
 * Returns the full TenantContext JSON config for the current tenant.
 */
async function getHandler(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        vertical: true,
        config: true,
        vapiAssistantId: true,
        vapiPhoneNumber: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, knowledge: tenant.config, tenant });
  } catch (error: any) {
    console.error("[knowledge] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/knowledge
 * Validates and persists the full TenantContext JSON config.
 * Only ADMINs can update the knowledge base.
 */
async function putHandler(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden — Admin role required" }, { status: 403 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid knowledge base — must be a JSON object" },
        { status: 400 }
      );
    }

    const updated = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { config: body },
      select: { id: true, config: true },
    });

    return NextResponse.json({ success: true, knowledge: updated.config });
  } catch (error: any) {
    console.error("[knowledge] PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = getHandler;
export const PUT = withAuditLog(putHandler, "TENANT_SETTINGS_CHANGED", "KNOWLEDGE_BASE");
