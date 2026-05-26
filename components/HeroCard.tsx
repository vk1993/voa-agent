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
      text: "Hi Priya — I saw you enquired about our 3BHK design package. Are you still looking?",
    },
    {
      role: "USER",
      text: "Yes, we just got possession last week actually.",
    },
    {
      role: "AI",
      text: "Perfect timing! Most clients in Whitefield budget around 8-10 lakhs for a full interior. Does that range work?",
    },
  ];

  const facts = ["📍 Whitefield", "🏠 3BHK", "💰 8-10L budget"];

  return (
    <div style={{ position: "relative" }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-80px",
          background: `radial-gradient(ellipse 55% 55% at 50% 45%, ${acc}0F 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />
      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "#15151A",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.05)",
          borderTop: `2px solid ${acc}`,
          boxShadow:
            "0 40px 80px rgba(0,0,0,.65), 0 8px 16px rgba(0,0,0,.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "13px 18px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            background: "rgba(0,0,0,.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pulse />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: "var(--green)",
                letterSpacing: ".05em",
              }}
            >
              LIVE CALL · {fmt(secs)}
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--txt2)",
            }}
          >
            Aurora-7 · VOXA
          </span>
        </div>
        {/* Transcript */}
        <div
          style={{
            padding: "18px 18px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 13,
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "3px 6px",
                  borderRadius: 4,
                  marginTop: 2,
                  background: i % 2 === 0 ? `${acc}1A` : "rgba(255,255,255,.05)",
                  color: i % 2 === 0 ? acc : "var(--txt2)",
                  letterSpacing: ".04em",
                }}
              >
                {l.role}
              </span>
              <p
                style={{
                  fontSize: 12.5,
                  color: i % 2 === 0 ? "var(--txt)" : "var(--txt2)",
                  lineHeight: 1.55,
                }}
              >
                {l.text}
              </p>
            </div>
          ))}
        </div>
        {/* Waveform row */}
        <div
          style={{
            padding: "4px 18px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Waveform acc={acc} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--txt3)",
            }}
          >
            Speaking…
          </span>
        </div>
        {/* Facts extracted */}
        <div
          style={{
            padding: "12px 18px 14px",
            borderTop: "1px solid rgba(255,255,255,.05)",
            background: "rgba(0,0,0,.15)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--txt3)",
              letterSpacing: ".09em",
              marginBottom: 8,
            }}
          >
            FACTS EXTRACTED
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {facts.map((f) => (
              <span
                key={f}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: acc,
                  padding: "4px 10px",
                  background: `${acc}12`,
                  border: `0.5px solid ${acc}`,
                  borderRadius: 20,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Metric chips */}
      <div style={{ display: "flex", gap: 11, marginTop: 14, justifyContent: "center" }}>
        {[
          { v: "$0.09 / call", s: "vs human $23/call" },
          { v: "572ms", s: "avg response" },
        ].map((m) => (
          <div
            key={m.v}
            style={{
              background: "rgba(21,21,26,.85)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 10,
              padding: "10px 16px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: acc,
              }}
            >
              {m.v}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--txt3)",
                marginTop: 2,
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
