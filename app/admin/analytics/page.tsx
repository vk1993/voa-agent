"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useTenantContext } from "@/hooks/useTenantContext";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PhoneCall,
  Percent,
  Clock,
  Calendar,
  Award,
} from "lucide-react";

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

interface CampaignBar {
  name: string;
  rate: number;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "COMPLETED";
}

interface AgentRow {
  rank: number;
  name: string;
  calls: number;
  convRate: number;
  sentiment: number;
}

// Helper to build SVG sparkline points from daily call count array
function buildSparklinePoints(data: number[]): string {
  if (data.length < 2) return "";
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  return data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 280 + 10;
      const y = 60 - ((val - minVal) / range) * 40;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function AnalyticsPage() {
  const { kpiLabel } = useTenantContext();
  const [kpis, setKpis] = useState<KpiCard[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignBar[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [sparklinePoints, setSparklinePoints] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();

        if (!data.success) return;

        const { kpis: k, dailyCalls, campaigns: c, agents: a } = data;

        setKpis([
          {
            label: "Calls This Week",
            value: String(k.callsThisWeek),
            trend: k.callsLastWeek > 0
              ? `${k.callsThisWeek > k.callsLastWeek ? "+" : ""}${Math.round(((k.callsThisWeek - k.callsLastWeek) / k.callsLastWeek) * 100)}%`
              : "+0%",
            up: k.callsThisWeek >= k.callsLastWeek,
            icon: PhoneCall,
            color: "var(--blue)",
          },
          {
            label: "Conversion Rate",
            value: `${k.conversionRate}%`,
            trend: `${k.conversionRateDelta >= 0 ? "+" : ""}${k.conversionRateDelta}pp`,
            up: k.conversionRateDelta >= 0,
            icon: Percent,
            color: "var(--green)",
          },
          {
            label: "Avg Call Duration",
            value: "Live",
            trend: "—",
            up: true,
            icon: Clock,
            color: "var(--gold)",
          },
          {
            label: "Showroom Bookings",
            value: String(k.bookingsThisWeek),
            trend: `${k.bookingsThisWeek >= k.bookingsLastWeek ? "+" : ""}${k.bookingsThisWeek - k.bookingsLastWeek}`,
            up: k.bookingsThisWeek >= k.bookingsLastWeek,
            icon: Calendar,
            color: "var(--teal)",
          },
        ]);

        // Build sparkline from daily counts
        const counts = (dailyCalls as { count: number }[]).map((d) => d.count);
        setSparklinePoints(buildSparklinePoints(counts.length > 0 ? counts : [0, 0]));

        setCampaigns(
          (c as { name: string; total: number; convRate: number }[]).map((camp) => ({
            name: camp.name,
            rate: camp.convRate,
            status: "ACTIVE" as const,
          }))
        );

        setAgents(
          (a as { name: string; calls: number; booked: number; avgSentiment: number }[]).map((ag, idx) => ({
            rank: idx + 1,
            name: ag.name,
            calls: ag.calls,
            convRate: ag.calls > 0 ? Math.round((ag.booked / ag.calls) * 1000) / 10 : 0,
            sentiment: Math.round(Number(ag.avgSentiment) * 100),
          }))
        );
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Platform Analytics</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Audit deep outbound conversational conversion metrics, evaluate voice agent performance, and trace sales trends.
          </p>
        </div>

        {/* Section 1: KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="glass-panel" style={{ padding: 24, height: 90, opacity: 0.4, background: "rgba(255,255,255,0.03)" }} />
              ))
            : kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--txt3)", fontFamily: "var(--font-mono)", letterSpacing: ".02em" }}>
                    {idx === 3 ? kpiLabel.toUpperCase() : kpi.label.toUpperCase()}
                  </span>
                  <div style={{ padding: 8, borderRadius: 8, background: `color-mix(in srgb, ${kpi.color} 8%, transparent)`, color: kpi.color }}>
                    <Icon size={18} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "var(--txt)" }}>{kpi.value}</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: kpi.up ? "var(--green)" : "#E85D5D",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 25 }}>
          
          {/* Left Chart: Sparkline Line Graph */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Outbound Call Velocity (14-Day Sparkline)</h2>
            </div>

            <div style={{ position: "relative", width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 300 80" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                {/* Grid Lines */}
                <line x1="10" y1="20" x2="290" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="10" y1="40" x2="290" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1="10" y1="60" x2="290" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                {/* Polyline spark line */}
                <polyline
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePoints || "10,60 290,60"}
                  style={{ filter: "drop-shadow(0px 4px 10px rgba(201,161,74,0.15))" }}
                />

                {/* Pulsing endpoint indicator */}
                {(() => {
                  const endCoords = (sparklinePoints || "10,60 290,60").split(" ").pop() || "290,60";
                  const [endX, endY] = endCoords.split(",");
                  return (
                    <g>
                      <circle cx={endX} cy={endY} r="4" fill="var(--gold)" />
                      <circle cx={endX} cy={endY} r="7" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.6">
                        <animate attributeName="r" values="3;9" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom Timeline Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--txt3)", fontFamily: "var(--font-mono)", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
              <span>MON (WEEK 1)</span>
              <span>SUN</span>
              <span>MON (WEEK 2)</span>
              <span>TODAY</span>
            </div>
          </div>

          {/* Right Chart: Horizontal Campaign Success Progress Bars */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Campaign Conversion Performance</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
              {campaigns.map((c, idx) => {
                let barColor = "var(--green)";
                if (c.status === "PAUSED") barColor = "#F59E0B";
                else if (c.status === "DRAFT") barColor = "var(--txt3)";

                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--txt3)" }}>
                          {c.status}
                        </span>
                        <span style={{ fontWeight: 700, color: c.rate > 0 ? barColor : "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                          {c.rate > 0 ? `${c.rate}%` : "DRAFT"}
                        </span>
                      </div>
                    </div>

                    <div style={{ height: 8, width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${c.rate}%`,
                          background: barColor,
                          borderRadius: 4,
                          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Section 3: Leaderboard Directory Table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={18} style={{ color: "var(--gold)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sales Agent Performance Leaderboard</h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["RANK", "AGENT NAME", "TOTAL OUTBOUND CALLS", "CONVERSION INDEX", "AVG SENTIMENT RATING"].map((th) => (
                  <th
                    key={th}
                    style={{
                      padding: "16px 24px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--txt3)",
                      letterSpacing: ".05em",
                    }}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.rank}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Rank circle matching table layout */}
                  <td style={{ padding: "18px 24px" }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: agent.rank === 1 ? "rgba(201, 161, 74, 0.08)" : "rgba(255,255,255,0.03)",
                        border: agent.rank === 1 ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.06)",
                        color: agent.rank === 1 ? "var(--gold)" : "var(--txt2)",
                        fontWeight: 700,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {agent.rank}
                    </div>
                  </td>

                  {/* Agent Details */}
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{agent.name}</span>
                  </td>

                  {/* Calls Count */}
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{ fontSize: 13.5, color: "var(--txt2)", fontFamily: "var(--font-mono)" }}>
                      {agent.calls} calls Dialed
                    </span>
                  </td>

                  {/* Conv Rate */}
                  <td style={{ padding: "18px 24px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: "var(--green)",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "0.5px solid rgba(16, 185, 129, 0.2)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {agent.convRate}%
                    </span>
                  </td>

                  {/* Sentiment rating */}
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ height: 6, width: 80, background: "rgba(255,255,255,0.03)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${agent.sentiment}%`, background: "var(--blue)" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
                        {agent.sentiment}% Positive
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardShell>
  );
}
