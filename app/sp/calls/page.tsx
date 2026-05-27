"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  PhoneCall,
  Phone,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Volume2,
  Delete,
  X,
} from "lucide-react";

interface CallRecord {
  id: string;
  name: string;
  phone: string;
  status: "Completed" | "Failed" | "Ongoing";
  duration: number; // in seconds
  sentiment: number; // percentage
  timestamp: string;
  intent: string;
  transcript: { role: "AI" | "USER"; text: string }[];
}

const MOCK_CALLS: CallRecord[] = [
  {
    id: "call-1",
    name: "Priya Nair",
    phone: "+91 98450 12345",
    status: "Completed",
    duration: 167,
    sentiment: 85,
    timestamp: "Today, 11:30 AM",
    intent: "Modular kitchen walk-through booked. Whitefield 3BHK package.",
    transcript: [
      { role: "AI", text: "Hi Priya — I saw you enquired about our 3BHK design package. Are you still looking?" },
      { role: "USER", text: "Yes, we just got possession last week actually in Whitefield." },
      { role: "AI", text: "Perfect timing! Most clients in Whitefield budget around 8-10 lakhs for a full interior. Does that range work?" },
      { role: "USER", text: "Yes, that is in our budget. I am particularly concerned about modular kitchen layouts though." }
    ]
  },
  {
    id: "call-2",
    name: "Arjun Reddy",
    phone: "+91 99000 87654",
    status: "Completed",
    duration: 110,
    sentiment: 68,
    timestamp: "Yesterday, 4:15 PM",
    intent: "Triggered WhatsApp catalog with modular kitchen samples.",
    transcript: [
      { role: "AI", text: "Hello Arjun, this is VOXA calling. You requested info about Modular Kitchen designs." },
      { role: "USER", text: "Hi, yes. I need to remodel my kitchen in Indiranagar. High-gloss acrylic finishes." }
    ]
  },
  {
    id: "call-3",
    name: "Rahul Hegde",
    phone: "+91 97410 44321",
    status: "Completed",
    duration: 135,
    sentiment: 60,
    timestamp: "May 24, 10:00 AM",
    intent: "Tight budget 6-8L. Wants space-saving multi-functional beds.",
    transcript: [
      { role: "AI", text: "Hi Rahul, VOXA calling. You enquired about our E-City 2BHK space-saving packages." },
      { role: "USER", text: "Yes, I am comparing a few interior startups right now." }
    ]
  }
];

export default function SalesAgentCalls() {
  const [calls, setCalls] = useState<CallRecord[]>(MOCK_CALLS);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  
  // Interactive Dialer State
  const [dialNumber, setDialNumber] = useState("");
  const [dialing, setDialing] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    setDialNumber((prev) => prev + num);
  };

  const handleClearPress = () => {
    setDialNumber("");
  };

  const handleTriggerCall = () => {
    if (!dialNumber.trim()) return;
    setDialing(true);
    
    // Simulate Outbound Call Trigger
    setTimeout(() => {
      const newCall: CallRecord = {
        id: `call-${Date.now()}`,
        name: `Prospect (${dialNumber})`,
        phone: dialNumber,
        status: "Ongoing",
        duration: 0,
        sentiment: 0,
        timestamp: "Just Now",
        intent: "Ongoing active voice dialer conversation...",
        transcript: [
          { role: "AI", text: "Hello, this is the VOXA AI sales agent. How can we assist with your home design project today?" }
        ]
      };
      setCalls([newCall, ...calls]);
      setActiveCallId(newCall.id);
      setDialing(false);
      setDialNumber("");
    }, 1500);
  };

  const handleEndCall = () => {
    if (!activeCallId) return;
    setCalls((prev) =>
      prev.map((c) => {
        if (c.id === activeCallId) {
          return { ...c, status: "Completed", duration: 42, sentiment: 75, intent: "Qualified modular project callback." };
        }
        return c;
      })
    );
    setActiveCallId(null);
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>My Outbound Call Logs</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Review outbound conversational recordings, track automated sentiment audits, and launch real-time test dialing pipelines.
          </p>
        </div>

        {/* Dynamic content split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: 30, alignItems: "start" }}>
          
          {/* Left panel: Call Logs lists */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Volume2 size={18} style={{ color: "var(--blue)" }} />
              <span>Recent Voice Dialogues</span>
            </h2>

            <div className="glass-panel" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    {["PROSPECT DETAILS", "STATUS", "DURATION", "SENTIMENT INDEX", "TIMESTAMP", "ACTION"].map((th) => (
                      <th
                        key={th}
                        style={{
                          padding: "16px 20px",
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
                  {calls.map((c) => {
                    let statusColor = "var(--gold)";
                    if (c.status === "Completed") statusColor = "var(--green)";
                    else if (c.status === "Ongoing") statusColor = "var(--blue)";
                    else if (c.status === "Failed") statusColor = "#E85D5D";

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCall(c)}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                          cursor: "pointer",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.01)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Prospect */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>
                            <span style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2 }}>{c.phone}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              color: statusColor,
                              background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)`,
                              letterSpacing: ".04em",
                            }}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Duration */}
                        <td style={{ padding: "16px 20px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>
                          {c.duration > 0 ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : c.status === "Ongoing" ? "LIVE" : "—"}
                        </td>

                        {/* Sentiment Index */}
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              fontWeight: 700,
                              color: c.sentiment >= 80 ? "var(--green)" : c.sentiment >= 60 ? "var(--blue)" : "var(--txt3)",
                            }}
                          >
                            {c.sentiment > 0 ? `${c.sentiment}%` : "—"}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: "16px 20px", fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                          {c.timestamp}
                        </td>

                        {/* Action link */}
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <ExternalLink size={13} style={{ color: "var(--txt3)" }} />
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Dialer keypad sandbox */}
          <div className="glass-panel" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
              <PhoneCall size={18} style={{ color: "var(--blue)" }} />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>VOXA Outbound Softphone</h2>
                <p style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}>
                  Trigger live simulated outbound calls to prospects in your pipeline.
                </p>
              </div>
            </div>

            {/* Display screen */}
            <div
              style={{
                background: "#0c0d14",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: 52,
                boxShadow: "inset 0 4px 14px rgba(0,0,0,0.8)",
              }}
            >
              <code style={{ fontSize: 18, fontFamily: "var(--font-mono)", color: "var(--blue)", letterSpacing: ".02em" }}>
                {dialing ? "Connecting..." : activeCallId ? "IN PROGRESS" : dialNumber || "Dial Number..."}
              </code>
              
              {dialNumber && !activeCallId && (
                <button
                  onClick={handleClearPress}
                  style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", display: "flex" }}
                >
                  <Delete size={16} />
                </button>
              )}
            </div>

            {/* Dialer grid */}
            {!activeCallId ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  justifyItems: "center",
                }}
              >
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    disabled={dialing}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.04)",
                      background: "rgba(255,255,255,0.02)",
                      color: "var(--txt)",
                      fontSize: 18,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(99,140,255,0.04)",
                  border: "1px dashed rgba(99,140,255,0.15)",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "var(--blue)", animation: "pulse 1.5s infinite" }}>
                  <Phone size={36} />
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)" }}>AI Sales Agent dialing...</span>
                  <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 4 }}>Call is being processed asynchronously via SQS Ingestion.</p>
                </div>
              </div>
            )}

            {/* Dial Button */}
            {!activeCallId ? (
              <button
                onClick={handleTriggerCall}
                disabled={dialing || !dialNumber}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--blue)",
                  color: "#0F0F12",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Phone size={14} />
                <span>{dialing ? "Dialing..." : "Launch Outbound Call"}</span>
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  background: "#E85D5D",
                  color: "#0F0F12",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>Terminate Outbound Call</span>
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Slide-out detail transcript drawer */}
      {selectedCall && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div
            onClick={() => setSelectedCall(null)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />

          <div
            className="glass-panel"
            style={{
              position: "relative",
              width: 480,
              height: "100%",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-15px 0 50px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1001,
              animation: "slide-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--blue)", letterSpacing: ".1em" }}>
                  CALL CONVERSATION DIALOGUE
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{selectedCall.name}</h2>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "var(--txt2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={16} style={{ margin: "auto" }} />
              </button>
            </div>

            {/* Body transcript */}
            <div style={{ flex: 1, overflowY: "auto", padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Call Analytics */}
              <div style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>CALL DURATION</span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={13} style={{ color: "var(--blue)" }} />
                    {selectedCall.duration} seconds
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>SENTIMENT INDEX</span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3, color: "var(--green)" }}>
                    {selectedCall.sentiment}% Positive
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EXTRACTED GOAL INTENT</span>
                  <p style={{ fontSize: 12, color: "var(--txt2)", marginTop: 4, lineHeight: 1.4 }}>{selectedCall.intent}</p>
                </div>
              </div>

              {/* Transcript dialogues */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--txt)" }}>Voice Audio Transcript</span>
                <div style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14, maxHeight: 300, overflowY: "auto" }}>
                  {selectedCall.transcript.map((line, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: line.role === "AI" ? "var(--gold)" : "var(--blue)", letterSpacing: ".04em" }}>
                        {line.role === "AI" ? "VOXA VOICE AGENT" : "PROSPECT"}
                      </span>
                      <p style={{ fontSize: 12, color: line.role === "AI" ? "var(--txt)" : "var(--txt2)", lineHeight: 1.4 }}>
                        {line.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
