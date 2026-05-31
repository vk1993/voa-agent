import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/security/security-service";
import { getTenantClient } from "@/lib/prisma-tenant";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session;
    const db = getTenantClient(tenantId);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      callsThisWeek,
      callsLastWeek,
      bookedThisWeek,
      bookedLastWeek,
      recentCalls,
      campaignStats,
      agentStats,
    ] = await Promise.all([
      db.callLog.count({ where: { tenantId, createdAt: { gte: weekAgo } } }),
      db.callLog.count({ where: { tenantId, createdAt: { gte: prevWeekAgo, lt: weekAgo } } }),
      db.callLog.count({ where: { tenantId, outcomeType: "BOOKED", createdAt: { gte: weekAgo } } }),
      db.callLog.count({ where: { tenantId, outcomeType: "BOOKED", createdAt: { gte: prevWeekAgo, lt: weekAgo } } }),
      // Last 7 days daily counts
      db.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE(created_at AT TIME ZONE 'Asia/Kolkata') as date,
               COUNT(*)::int as count
        FROM call_logs
        WHERE tenant_id = ${tenantId}::uuid
          AND created_at >= ${weekAgo}
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Kolkata')
        ORDER BY date ASC
      `,
      // Per-campaign conversion
      db.$queryRaw<{ campaignId: string; name: string; total: number; booked: number }[]>`
        SELECT c.id as "campaignId", c.name,
               COUNT(cl.id)::int as total,
               COUNT(CASE WHEN cl.outcome_type = 'BOOKED' THEN 1 END)::int as booked
        FROM campaigns c
        LEFT JOIN call_logs cl ON cl.campaign_id = c.id
        WHERE c.tenant_id = ${tenantId}::uuid
        GROUP BY c.id, c.name
        ORDER BY total DESC LIMIT 6
      `,
      // Per-agent performance
      db.$queryRaw<{ agentId: string; name: string; calls: number; booked: number; avgSentiment: number }[]>`
        SELECT u.id as "agentId", COALESCE(u.name, u.email) as name,
               COUNT(cl.id)::int as calls,
               COUNT(CASE WHEN cl.outcome_type = 'BOOKED' THEN 1 END)::int as booked,
               COALESCE(ROUND(AVG(cl.sentiment_score)::numeric, 2), 0) as "avgSentiment"
        FROM users u
        LEFT JOIN call_logs cl ON cl.assigned_agent_id = u.id
          AND cl.created_at >= ${weekAgo}
        WHERE u.tenant_id = ${tenantId}::uuid
          AND u.role = 'SALES_AGENT'
        GROUP BY u.id, u.name, u.email
        ORDER BY calls DESC LIMIT 5
      `,
    ]);

    const convRate =
      callsThisWeek > 0 ? Math.round((bookedThisWeek / callsThisWeek) * 1000) / 10 : 0;
    const prevRate =
      callsLastWeek > 0 ? Math.round((bookedLastWeek / callsLastWeek) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      kpis: {
        callsThisWeek,
        callsLastWeek,
        conversionRate: convRate,
        conversionRateDelta: Math.round((convRate - prevRate) * 10) / 10,
        bookingsThisWeek: bookedThisWeek,
        bookingsLastWeek: bookedLastWeek,
      },
      dailyCalls: recentCalls,
      campaigns: campaignStats.map((c) => ({
        ...c,
        convRate: c.total > 0 ? Math.round((c.booked / c.total) * 100) : 0,
      })),
      agents: agentStats,
    });
  } catch (error: any) {
    console.error("[analytics] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
