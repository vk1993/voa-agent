import { NextRequest, NextResponse } from "next/server";
import { getLocalSimAuditLogs } from "@/lib/security/audit-logger";
import { verifySessionFromRequest } from "@/lib/security/security-service";

/**
 * GET /api/audit-logs
 * Retrieves all registered local audit trail event records for the user's tenant.
 * Access is restricted to authenticated ADMIN and SUPER_ADMIN users.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Missing or invalid session token." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "Insufficient administrative privileges." },
        { status: 403 }
      );
    }

    const allLogs = getLocalSimAuditLogs();
    
    // Strict tenant isolation filter
    const tenantLogs = allLogs.filter((log) => log.tenant_id === session.tenantId);

    return NextResponse.json({ success: true, logs: tenantLogs });
  } catch (error: any) {
    console.error("GET /api/audit-logs failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

