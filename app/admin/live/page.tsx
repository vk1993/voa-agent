"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useTenantContext } from "@/hooks/useTenantContext";
import {
  Radio,
  Phone,
  Clock,
  HeartHandshake,
  Activity,
  X,
  Slash,
  Eye,
} from "lucide-react";

interface ActiveCall {
  id: string;
  contactName: string;
  contactPhone: string;
  campaignName: string;
  startedAt: Date;
  lastAiTurn: string;
  sentiment: number; // 0-100
  transcript: string[];
}

interface CompletedCall {
  id: string;
  name: string;
  phone: string;
  campaign: string;
  duration: string;
  outcome: "Booked ✓" | "WhatsApp Sent ✓" | "Follow-up" | "Not Interested" | "DND Added";
  timeAgo: string;
}

const COMPLETED_CALLS: CompletedCall[] = [
  { id: "c-1", name: "Sneha Rao", phone: "+91 98450 12345", campaign: "Bangalore Luxury 3BHK Outbound", duration: "2m 14s", outcome: "Booked ✓", timeAgo: "4 mins ago" },
  { id: "c-2", name: "Rahul Mehta", phone: "+91 99001 87654", campaign: "Indiranagar Kitchen Remodel Callback", duration: "1m 45s", outcome: "WhatsApp Sent ✓", timeAgo: "12 mins ago" },
  { id: "c-3", name: "Priya Nair", phone: "+91 97422 55667", campaign: "Sarjapur Luxury Duplex & Villa Pipeline", duration: "3m 05s", outcome: "Follow-up", timeAgo: "28 mins ago" },
  { id: "c-4", name: "Kavya Singh", phone: "+91 96118 44332", campaign: "Electronic City Budget 2BHK Enquiries", duration: "48s", outcome: "Not Interested", timeAgo: "1 hour ago" },
  { id: "c-5", name: "Arjun Reddy", phone: "+91 95350 99887", campaign: "Bangalore Luxury 3BHK Outbound", duration: "32s", outcome: "DND Added", timeAgo: "3 hours ago" },
];

export default function LiveMonitorPage() {
  const { meetingLabel } = useTenantContext();
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Initialize and seed calls on mount in useEffect (avoiding impure Date.now() during render)
  useEffect(() => {
    const now = Date.now();
    setCurrentTime(now);

    const seeded: ActiveCall[] = [
      {
        id: "active-1",
        contactName: "Sneha Rao",
        contactPhone: "+91 98450 XXXXX",
        campaignName: "Bangalore Luxury 3BHK Outbound",
        startedAt: new Date(now - 48000), // 48s ago
        lastAiTurn: "Excellent. I can book that private showroom walkthrough for you next Sunday at 11 AM in HSR Layout. Shall I confirm?",
        sentiment: 88,
        transcript: [
          "AI: Hello, this is VOXA calling from Prestige Interiors. Am I speaking with Sneha?",
          "USER: Yes, Sneha here.",
          "AI: Wonderful. I understand you're looking for premium 3BHK modular interiors in Sarjapur. Is that correct?",
          "USER: Yes, we just bought a flat there. We are exploring high-gloss acrylic kitchens.",
          "AI: Excellent choice. Acrylic finishes are incredibly durable and highly elegant. Our design expert RAG catalog has several luxury layouts in Bangalore. Would you be open to a walkthrough?",
          "USER: Sure, that sounds useful. Do you have a showroom near HSR?",
          "AI: Excellent. I can book that private showroom walkthrough for you next Sunday at 11 AM in HSR Layout. Shall I confirm?"
        ],
      },
      {
        id: "active-2",
        contactName: "Rahul Mehta",
        contactPhone: "+91 99001 XXXXX",
        campaignName: "Indiranagar Kitchen Remodel Callback",
        startedAt: new Date(now - 115000), // 1m 55s ago
        lastAiTurn: "We have specific German soft-close fittings and standard acrylic shutters. I will WhatsApp our portfolio right away.",
        sentiment: 75,
        transcript: [
          "AI: Hi Rahul, I'm calling from VOXA Kitchen Design Hub. I saw you requested a callback about modular fittings.",
          "USER: Oh yes, I need to remodel my kitchen in Indiranagar. What materials do you guys use?",
          "AI: We work with pre-lam BWR plywood and premium laminates, or top-tier acrylic coatings. What style fits your current vibe?",
          "USER: Mostly clean modern look, with integrated appliances. Do you have portfolios?",
          "AI: We have specific German soft-close fittings and standard acrylic shutters. I will WhatsApp our portfolio right away."
        ],
      },
      {
        id: "active-3",
        contactName: "Kavya Singh",
        contactPhone: "+91 96118 XXXXX",
        campaignName: "Sarjapur Luxury Duplex & Villa Pipeline",
        startedAt: new Date(now - 24000), // 24s ago
        lastAiTurn: "Hello, this is VOXA on behalf of Prestige Designs. Is this Kavya?",
        sentiment: 52,
        transcript: [
          "AI: Hello, this is VOXA on behalf of Prestige Designs. Is this Kavya?",
          "USER: Yes, who is this?"
        ],
      },
    ];

    setActiveCalls(seeded);

    const t = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(t);
  }, []);

  // Keyboard close listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCall(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const elapsedStr = (call: ActiveCall) => {
    if (currentTime === 0) return "0:00";
    const secs = Math.floor((currentTime - call.startedAt.getTime()) / 1000);
    if (secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif", position: "relative" }}>
        
        {/* Style sheet animations */}
        <style>{`
          @keyframes live-glow {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.4); }
          }
          .pulse-dot-green {
            animation: live-glow 1.5s infinite ease-in-out;
          }
          @keyframes modal-scale {
            from { transform: scale(0.96); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-modal {
            animation: modal-scale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Live Outbound Monitor</h1>
              
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: 30,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                <span
                  className="pulse-dot-green"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "inline-block",
                  }}
                />
                <span>3 ACTIVE QUEUES</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Listen in on synthesized outbound lead validations, audit active dialogs, and monitor instant post-call metrics.
            </p>
          </div>
        </div>

        {/* Grid Container for Active Calls */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Activity size={18} style={{ color: "var(--gold)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Synthesizer Pipelines in Progress</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {activeCalls.map((call) => {
              let sentimentColor = "var(--green)";
              if (call.sentiment > 70) sentimentColor = "var(--green)";
              else if (call.sentiment > 40) sentimentColor = "#F59E0B";
              else sentimentColor = "#E85D5D";

              return (
                <div
                  key={call.id}
                  className="glass-panel"
                  style={{
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    border: `1px solid rgba(255, 255, 255, 0.04)`,
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>{call.contactName}</h3>
                      <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                        {call.contactPhone}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700 }}>
                      <Clock size={13} className="pulse-dot-green" />
                      <span>{elapsedStr(call)}</span>
                    </div>
                  </div>

                  {/* Campaign */}
                  <div style={{ fontSize: 11, color: "var(--txt2)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Slash size={10} style={{ color: "var(--gold)" }} />
                    <span style={{ fontWeight: 600 }}>{call.campaignName}</span>
                  </div>

                  {/* Last AI speech turn */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.18)",
                      border: "1px solid rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 12,
                      color: "var(--txt2)",
                      lineHeight: 1.5,
                      minHeight: 54,
                    }}
                  >
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--gold)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                      LAST AI RESPONSE:
                    </span>
                    {call.lastAiTurn.length > 80 ? `${call.lastAiTurn.substring(0, 80)}...` : call.lastAiTurn}
                  </div>

                  {/* Sentiment Bar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                      <span style={{ color: "var(--txt3)" }}>INTERACTION SENTIMENT</span>
                      <span style={{ color: sentimentColor, fontWeight: 700 }}>{call.sentiment}% Positive</span>
                    </div>
                    <div style={{ height: 4, width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${call.sentiment}%`,
                          background: sentimentColor,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Transcript Action Button */}
                  <button
                    onClick={() => setSelectedCall(call)}
                    style={{
                      width: "100%",
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                      color: "var(--txt)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 4,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--gold)";
                      e.currentTarget.style.background = "rgba(201, 161, 74, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }}
                  >
                    <Eye size={13} />
                    <span>View Live Transcript</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Recent Completions */}
        <div className="glass-panel" style={{ overflow: "hidden", marginTop: 10 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: 8 }}>
            <HeartHandshake size={18} style={{ color: "var(--gold)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recently Completed Handshakes</h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["NAME", "PIPELINE CAMPAIGN", "DURATION", "OUTCOME STATUS", "TIME"].map((th) => (
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
              {COMPLETED_CALLS.map((c) => {
                let badgeColor = "var(--green)";
                if (c.outcome === "WhatsApp Sent ✓") badgeColor = "var(--teal)";
                else if (c.outcome === "Follow-up") badgeColor = "#F59E0B";
                else if (c.outcome === "Not Interested") badgeColor = "var(--txt3)";
                else if (c.outcome === "DND Added") badgeColor = "#E85D5D";

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
                        <span style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                          {c.phone}
                        </span>
                      </div>
                    </td>

                    {/* Campaign */}
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--txt2)" }}>{c.campaign}</td>

                    {/* Duration */}
                    <td style={{ padding: "16px 24px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                      {c.duration}
                    </td>

                    {/* Outcome Badges matching criteria */}
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: badgeColor,
                          background: `color-mix(in srgb, ${badgeColor} 10%, transparent)`,
                          border: `0.5px solid color-mix(in srgb, ${badgeColor} 20%, transparent)`,
                          letterSpacing: ".04em",
                        }}
                      >
                        {c.outcome === "Booked ✓" ? `${meetingLabel} ✓` : c.outcome}
                      </span>
                    </td>

                    {/* Time Completed */}
                    <td style={{ padding: "16px 24px", fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                      {c.timeAgo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic Transcript Modal - Overlay flex framework based, z-index 1000 */}
        {selectedCall && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {/* Backdrop */}
            <div
              onClick={() => setSelectedCall(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(5px)",
              }}
            />

            {/* Modal Body */}
            <div
              className="glass-panel animate-modal"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 550,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                zIndex: 1001,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.75)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--gold)", letterSpacing: ".1em" }}>
                    SYNTHESIZER WEBHOOK SIGNAL
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedCall.contactName}</h3>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--txt2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable Transcript Turns */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  background: "rgba(0,0,0,0.12)",
                }}
              >
                {selectedCall.transcript.map((line, idx) => {
                  const isAi = line.startsWith("AI:");
                  const cleanLine = line.substring(3);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: isAi ? "rgba(201, 161, 74, 0.04)" : "rgba(255,255,255,0.02)",
                        border: isAi ? "1px solid rgba(201, 161, 74, 0.08)" : "1px solid rgba(255,255,255,0.04)",
                        alignSelf: isAi ? "flex-start" : "flex-end",
                        maxWidth: "85%",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: isAi ? "var(--gold)" : "var(--blue)",
                          display: "block",
                          marginBottom: 4,
                          letterSpacing: ".04em",
                        }}
                      >
                        {isAi ? "VOXA OUTBOUND SALES" : "LEAD RESPONSE"}
                      </span>
                      <p style={{ fontSize: 12.5, color: isAi ? "var(--txt)" : "var(--txt2)", lineHeight: 1.5 }}>
                        {cleanLine}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(0,0,0,0.18)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Phone size={11} />
                  Outbound Call SID: vapi-call-session-{selectedCall.id}
                </span>

                <button
                  onClick={() => setSelectedCall(null)}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--txt)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close Monitor
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
