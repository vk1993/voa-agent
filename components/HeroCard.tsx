"use client";

import React, { useState, useEffect } from "react";
import Pulse from "./Pulse";
import Waveform from "./Waveform";

interface HeroCardProps {
  acc: string;
}

export function HeroCard({ acc }: HeroCardProps) {
  const [secs, setSecs] = useState(167);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  const lines = [
    {
      role: "AI",
      text: "Hi Priya — I saw you enquired about our premium 3BHK interior design package. Are you still looking to start?",
    },
    {
      role: "USER",
      text: "Yes, we just got possession of our flat last week actually. We are keen but have some specific timeline requirements.",
    },
    {
      role: "AI",
      text: "Perfect timing! Most clients in Whitefield budget around 8-12 lakhs for custom modular interiors. Does that align with what you had in mind?",
    },
  ];

  const facts = ["📍 Whitefield Area", "🏠 Custom 3BHK Flat", "💰 8-12L modular budget"];

  return (
    <div style={{ position: "relative" }}>
      {/* Intense Ambient Glow behind card */}
      <div
        style={{
          position: "absolute",
          inset: "-60px",
          background: `radial-gradient(ellipse 55% 55% at 50% 45%, ${acc}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {/* High-Fidelity Glassmorphic Card Container */}
      <div
        className="glass-panel"
        style={{
          position: "relative",
          overflow: "hidden",
          borderTop: `2px solid ${acc}`,
          boxShadow:
            "0 40px 80px rgba(0,0,0,.75), 0 8px 24px rgba(0,0,0,.5), 0 0 1px 1px rgba(255,255,255,0.03) inset",
          borderRadius: 20,
        }}
      >
        {/* Call Status Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 20px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            background: "rgba(0,0,0,.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Pulse />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--green)",
                letterSpacing: ".06em",
              }}
            >
              VOIP CONVERSATION · {fmt(secs)}
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--txt2)",
              fontWeight: 500,
            }}
          >
            Aurora-v9 · VOXA
          </span>
        </div>

        {/* Live Conversation Transcript */}
        <div
          style={{
            padding: "20px 20px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 5,
                  marginTop: 2,
                  background: i % 2 === 0 ? `${acc}1F` : "rgba(255,255,255,.06)",
                  color: i % 2 === 0 ? acc : "var(--txt2)",
                  letterSpacing: ".05em",
                  border: i % 2 === 0 ? `0.5px solid ${acc}44` : "0.5px solid rgba(255,255,255,.04)",
                }}
              >
                {l.role}
              </span>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: i % 2 === 0 ? "var(--txt)" : "var(--txt2)",
                  lineHeight: 1.6,
                }}
              >
                {l.text}
              </p>
            </div>
          ))}
        </div>

        {/* Live Waveform VoIP Simulator Component */}
        <div
          style={{
            padding: "6px 20px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Waveform acc={acc} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--txt3)",
              fontWeight: 500,
              letterSpacing: ".04em",
              animation: "pulse 2s infinite ease-in-out",
            }}
          >
            VOXA AI speaking…
          </span>
        </div>

        {/* Facts Extraction Console Panel */}
        <div
          style={{
            padding: "14px 20px 16px",
            borderTop: "1px solid rgba(255,255,255,.05)",
            background: "rgba(0,0,0,.2)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--txt3)",
              letterSpacing: ".1em",
              marginBottom: 10,
            }}
          >
            SEMANTIC ENTITIES EXTRACTED
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {facts.map((f) => (
              <span
                key={f}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: acc,
                  padding: "5px 12px",
                  background: `${acc}0D`,
                  border: `1px solid ${acc}33`,
                  borderRadius: 20,
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${acc}1E`;
                  e.currentTarget.style.borderColor = acc;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${acc}0D`;
                  e.currentTarget.style.borderColor = `${acc}33`;
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Call Metrics Chips at the bottom */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
        {[
          { v: "$0.09 / minute", s: "vs human agent $24.00" },
          { v: "520ms response", s: "ultra low VoIP latency" },
        ].map((m) => (
          <div
            key={m.v}
            className="glass-panel"
            style={{
              borderRadius: 12,
              padding: "10px 18px",
              boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
              background: "rgba(14, 17, 27, 0.8)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14.5,
                fontWeight: 700,
                color: acc,
              }}
            >
              {m.v}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--txt3)",
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              {m.s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroCard;
