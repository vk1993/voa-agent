import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";
import { withAuditLog } from "@/lib/security/api-wrapper";

async function getVerifiedSession(request: NextRequest) {
  const session = await verifySessionFromRequest(request);
  if (!session) return null;
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") return null;
  return session;
}

/**
 * GET /api/scripts
 * Lists all scripts for the current tenant.
 */
async function getHandler(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getTenantClient(session.tenantId);
    const scripts = await db.script.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, scripts });
  } catch (error: any) {
    console.error("[scripts] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/scripts
 * Creates a new script for the current tenant.
 */
async function postHandler(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, systemPrompt, sections, guardrails, isActive } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Script name is required" }, { status: 400 });
    }
    if (!sections || typeof sections !== "object") {
      return NextResponse.json({ success: false, error: "Script sections are required" }, { status: 400 });
    }

    const db = getTenantClient(session.tenantId);

    // Determine next version number for this name
    const existing = await db.script.findFirst({
      where: { tenantId: session.tenantId, name: name.trim() },
      orderBy: { version: "desc" },
    });
    const version = existing ? existing.version + 1 : 1;

    const script = await db.script.create({
      data: {
        tenantId: session.tenantId,
        name: name.trim(),
        version,
        systemPrompt: systemPrompt || null,
        sections,
        guardrails: guardrails || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, script }, { status: 201 });
  } catch (error: any) {
    console.error("[scripts] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/scripts
 * Updates an existing script (name, systemPrompt, sections, guardrails, isActive).
 */
async function putHandler(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, systemPrompt, sections, guardrails, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Script ID is required" }, { status: 400 });
    }

    const db = getTenantClient(session.tenantId);

    // Verify ownership
    const existing = await db.script.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Script not found" }, { status: 404 });
    }

    const updated = await db.script.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(sections !== undefined && { sections }),
        ...(guardrails !== undefined && { guardrails }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, script: updated });
  } catch (error: any) {
    console.error("[scripts] PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/scripts
 * Soft-deletes a script by setting isActive = false.
 */
async function deleteHandler(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Script ID is required" }, { status: 400 });
    }

    const db = getTenantClient(session.tenantId);

    const existing = await db.script.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Script not found" }, { status: 404 });
    }

    await db.script.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Script deactivated successfully" });
  } catch (error: any) {
    console.error("[scripts] DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = getHandler;
export const POST = withAuditLog(postHandler, "TENANT_SETTINGS_CHANGED", "SCRIPTS");
export const PUT = withAuditLog(putHandler, "TENANT_SETTINGS_CHANGED", "SCRIPTS");
export const DELETE = withAuditLog(deleteHandler, "TENANT_SETTINGS_CHANGED", "SCRIPTS");
