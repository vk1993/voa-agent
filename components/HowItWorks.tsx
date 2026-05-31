"use client";
import React from "react";

export default function HowItWorks({ acc }: { acc: string }) {
  const steps = [
    {
      num: "01",
      title: "Upload your contacts",
      desc: "Import a CSV of leads or synchronize directly from your CRM. VOXA automatically formats, qualifies, and schedules the outbound queue while checking active DND registries.",
    },
    {
      num: "02",
      title: "Your AI agent calls",
      desc: "VOXA's hyper-realistic voice agent dials, qualifies interest, handles objections in real-time, and sends custom WhatsApp summaries mid-call, in English, Hindi, or Hinglish.",
    },
    {
      num: "03",
      title: "Meetings land in your calendar",
      desc: "Interested leads get a demo, site tour, or consultation booked dynamically into your CRM or Google Calendar. Your human salespeople just show up to close.",
    },
  ];

  const stack = [
    { name: "Claude AI", role: "Intelligence" },
    { name: "Vapi", role: "Telephony" },
    { name: "WhatsApp", role: "Follow-up" },
    { name: "Google Calendar", role: "Booking" },
  ];

  return (
    <section id="how-it-works" style={{ background: "var(--abyss)", padding: "var(--space-section) 0", position: "relative" }}>
      {/* Background Grid Pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.01) 1px, transparent 1px)",
        backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse at center, black, transparent)",
        pointerEvents: "none"
      }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: acc, marginBottom: 12 }}>
            Fully Automated Pipeline
          </p>
          <h2 className="land-h2" style={{ color: "var(--warm-white)" }}>
            From lead list to booked meeting.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 14 }}>
            Three simple steps. Under 800ms voice response times. 24/7 autonomous scheduling.
          </p>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 40, alignItems: "start" }}>
          {/* Left panel: Numbered steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {steps.map(s => (
              <div key={s.num} style={{ display: "flex", gap: 24, alignItems: "start" }}>
                {/* Large step number indicator */}
                <div style={{
                  fontSize: 20, fontWeight: 700, color: acc,
                  fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)", width: 48, height: 48,
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--warm-white)",
                    marginBottom: 8, letterSpacing: -0.01 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right panel: Premium tech stack modules */}
          <div className="glass-panel" style={{
            background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: 32
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600,
              marginBottom: 20, letterSpacing: "0.02em", textTransform: "uppercase",
              fontFamily: "var(--font-mono)", color: acc }}>
              Integrated Tech Stack
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 24 }}>
              VOXA seamlessly orchestrates high-end infrastructure nodes to keep latencies exceptionally low and compliance 100% auditable.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stack.map(item => (
                <div key={item.name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                  border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 8
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warm-white)" }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, color: acc,
                    fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {item.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
