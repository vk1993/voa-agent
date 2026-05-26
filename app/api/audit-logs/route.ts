import { NextRequest, NextResponse } from "next/server";
import { getLocalSimAuditLogs } from "@/lib/security/audit-logger";

/**
 * GET /api/audit-logs
 * Retrieves all registered local audit trail event records.
 */
export async function GET(request: NextRequest) {
  try {
    const logs = getLocalSimAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
