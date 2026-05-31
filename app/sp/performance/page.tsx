"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useTenantContext } from "@/hooks/useTenantContext";
import {
  TrendingUp,
  Award,
  PhoneCall,
  Calendar,
  Lightbulb,
  Clock,
  Smile,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface PeerRow {
  rank: number;
  name: string;
  calls: number;
  convRate: number;
  isMe: boolean;
}

interface RecentCall {
  id: string;
  name: string;
  phone: string;
  duration: string;
  sentiment: number;
  timestamp: string;
  outcome: string;
}

interface UpcomingApt {
  id: string;
  name: string;
  type: string;
  timestamp: string;
  location: string;
}

const COACHING_TIPS: Record<string, string[]> = {
  interior:    ["Ask about BHK type in the first 60 seconds", "Mention the current promotion early"],
  real_estate: ["Ask about pincode early to route to the right site office", "Lead with RERA approval"],
  construction: ["Ask about plot size immediately", "Mention past projects in the area"],
  product:     ["Ask about current solution in first 30 seconds", "Offer the comparison sheet"],
  finance:     ["Lead with the customer's goal, not the product", "Mention 0% commission first"],
  healthcare:  ["Confirm specialty in first turn", "Reference the clinical study immediately"],
  education:   ["Ask about exam date to create urgency", "Mention free trial upfront"],
  custom:      ["Lead with the primary value proposition", "Ask qualifying questions early"],
};


export default function SalesAgentPerformancePage() {
  const { tenant, vertical, meetingLabel, locationLabel, kpiLabel } = useTenantContext();
  const [myStats, setMyStats] = useState({ calls: 0, convRate: 0, avgSentiment: 0, bookings: 0 });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [upcomingApts, setUpcomingApts] = useState<UpcomingApt[]>([]);
  const [leaderboard, setLeaderboard] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Resolve current agent's ID first
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        const myId = meData.userId;
        const myName = meData.name || meData.email || "";

        // Load analytics + my call logs + appointments in parallel
        const [analyticsRes, callsRes, aptsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch(`/api/call-logs?limit=5${myId ? `&agentId=${myId}` : ""}`),
          fetch("/api/appointments?limit=5"),
        ]);

        const [analyticsData, callsData, aptsData] = await Promise.all([
          analyticsRes.json(),
          callsRes.json(),
          aptsRes.json(),
        ]);

        // Build leaderboard from agents array, marking "me"
        if (analyticsData.success && Array.isArray(analyticsData.agents)) {
          const sorted = analyticsData.agents.sort((a: any, b: any) => b.calls - a.calls);
          setLeaderboard(sorted.map((a: any, idx: number) => ({
            rank: idx + 1,
            name: a.name,
            calls: a.calls,
            convRate: a.calls > 0 ? Math.round((a.booked / a.calls) * 1000) / 10 : 0,
            isMe: a.agentId === myId,
          })));

          // Find my own stats
          const me = analyticsData.agents.find((a: any) => a.agentId === myId);
          if (me) {
            setMyStats({
              calls: me.calls,
              convRate: me.calls > 0 ? Math.round((me.booked / me.calls) * 1000) / 10 : 0,
              avgSentiment: Math.round(Number(me.avgSentiment) * 100),
              bookings: me.booked,
            });
          }
        }

        // Map recent call logs
        if (callsData.success && Array.isArray(callsData.callLogs)) {
          setRecentCalls(callsData.callLogs.map((cl: any) => ({
            id: cl.id,
            name: cl.contact?.name || "Unknown",
            phone: cl.contact?.phone || "",
            duration: `${Math.floor((cl.durationSeconds || 0) / 60)}m ${((cl.durationSeconds || 0) % 60)}s`,
            sentiment: cl.sentimentScore ? Math.round(cl.sentimentScore * 100) : 0,
            timestamp: new Date(cl.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
            outcome: cl.outcomeType === "BOOKED" ? "Booked ✓"
              : cl.outcomeType === "CALLBACK_REQUESTED" ? "Follow-up"
              : cl.outcomeType === "DND" ? "DND Added"
              : cl.outcomeType === "NOT_INTERESTED" ? "Not Interested"
              : cl.outcomeType || "—",
          })));
        }

        // Map appointments
        if (aptsData.success && Array.isArray(aptsData.appointments)) {
          setUpcomingApts(aptsData.appointments.map((a: any) => ({
            id: a.id,
            name: a.contact?.name || "Unknown",
            type: meetingLabel || "Walkthrough",
            timestamp: a.contentSnapshot?.scheduledAt
              ? new Date(a.contentSnapshot.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
              : new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
            location: a.contentSnapshot?.location || "TBD",
          })));
        }
      } catch (err) {
        console.error("Failed to load performance data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>My Performance Hub</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Evaluate your personal outbound conversion quotas, track recent customer bookings, and check real-time AI coaching pointers.
          </p>
        </div>

        {/* Section 1: KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* Calls card */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(99, 140, 255, 0.08)", color: "var(--blue)" }}>
              <PhoneCall size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)", letterSpacing: ".02em" }}>
                MY CALLS THIS WEEK
              </span>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--txt)" }}>
                {loading ? "—" : myStats.calls} <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Dialed</span>
              </div>
            </div>
          </div>

          {/* Conversion card */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(16, 185, 129, 0.08)", color: "var(--green)" }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)", letterSpacing: ".02em" }}>
                MY CONVERSION RATE
              </span>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--txt)" }}>
                {loading ? "—" : `${myStats.convRate}%`} <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Bookings index</span>
              </div>
            </div>
          </div>

          {/* Sentiment card */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(201, 161, 74, 0.08)", color: "var(--gold)" }}>
              <Smile size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)", letterSpacing: ".02em" }}>
                MY AVG SENTIMENT SCORE
              </span>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--txt)" }}>
                {loading ? "—" : `${myStats.avgSentiment}%`} <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Positive Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Split Middle Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: 25, alignItems: "start" }}>
          
          {/* Left Middle: Recent Calls list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PhoneCall size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>My Recent Outbound Calls</h2>
            </div>

            <div className="glass-panel" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    {["PROSPECT", "DURATION", "SENTIMENT", "OUTCOME"].map((th) => (
                      <th
                        key={th}
                        style={{
                          padding: "12px 18px",
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
                  {recentCalls.map((rc) => {
                    let outcomeCol = "var(--green)";
                    if (rc.outcome === "WhatsApp Sent ✓") outcomeCol = "var(--teal)";
                    else if (rc.outcome === "Follow-up") outcomeCol = "#F59E0B";
                    else if (rc.outcome === "Not Interested") outcomeCol = "var(--txt3)";
                    else if (rc.outcome === "DND Added") outcomeCol = "#E85D5D";

                    return (
                      <tr
                        key={rc.id}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{rc.name}</span>
                            <span style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2 }}>{rc.phone}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                          {rc.duration}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--blue)" }}>
                          {rc.sentiment}%
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: "3px 6px",
                              borderRadius: 4,
                              color: outcomeCol,
                              background: `color-mix(in srgb, ${outcomeCol} 10%, transparent)`,
                              border: `0.5px solid color-mix(in srgb, ${outcomeCol} 20%, transparent)`,
                            }}
                          >
                            {rc.outcome}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Middle: Upcoming Appointments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Upcoming {locationLabel || 'Showroom'} Appointments</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcomingApts.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>No upcoming appointments</div>
              ) : upcomingApts.map((ua) => (
                <div
                  key={ua.id}
                  className="glass-panel"
                  style={{
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--gold)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                      {ua.type}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--green)" }}>Confirmed ✓</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)" }}>{ua.name}</h3>
                  <div style={{ fontSize: 11.5, color: "var(--txt2)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>📅 {ua.timestamp}</span>
                    <span>📍 {ua.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Section 3: Bottom Row - Leaderboard and AI Tips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 25, marginTop: 10 }}>
          
          {/* Left: Peer Leaderboard Table */}
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Outbound Team Rankings</h2>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  {["RANK", "AGENT NAME", "TOTAL CALLS", "CONVERSION INDEX"].map((th) => (
                    <th
                      key={th}
                      style={{
                        padding: "12px 18px",
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
                {leaderboard.map((peer) => {
                  const highlightStyle = peer.isMe
                    ? { background: "rgba(201, 161, 74, 0.06)", border: "1px solid rgba(201,161,74,0.2)" }
                    : {};
                  return (
                    <tr
                      key={peer.rank}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        ...highlightStyle,
                      }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: peer.isMe ? "var(--gold)" : "rgba(255,255,255,0.03)",
                            color: peer.isMe ? "#0F0F12" : "var(--txt2)",
                            fontWeight: 700,
                            fontSize: 11.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {peer.rank}
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: 13.5 }}>
                        {peer.name} {peer.isMe && <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 500 }}>(You)</span>}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                        {peer.calls}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: peer.isMe ? "var(--gold)" : "var(--green)", fontFamily: "var(--font-mono)" }}>
                          {peer.convRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: AI Coaching Recommendations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lightbulb size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>AI Real-time Coaching Tips</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(COACHING_TIPS[vertical?.id || "custom"] || COACHING_TIPS.custom).map((tip, idx) => (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: 20,
                    borderLeft: "4px solid #F59E0B",
                    background: "rgba(245, 158, 11, 0.02)",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ padding: 8, borderRadius: 8, background: "rgba(245, 158, 11, 0.08)", color: "#F59E0B", flexShrink: 0 }}>
                    <Lightbulb size={18} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)" }}>Recommendation {idx + 1}</h4>
                    <p style={{ fontSize: 12, color: "var(--txt2)", lineHeight: 1.5 }}>
                      {tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
