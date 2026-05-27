"use client";

import React from "react";
import F from "./FadeIn";

interface MetricsProps {
  acc: string;
}

export function Metrics({ acc }: MetricsProps) {
  const stats = [
    { v: "147M+", l: "Outbound Calls Handled" },
    { v: "$0.09", l: "Average Cost Per Call" },
    { v: "520ms", l: "P95 Audio VoIP Latency" },
    { v: "23", l: "Countries Live & Active" },
    { v: "4.8×", l: "More Bookings vs Human Team" },
  ];

  return (
    <section
      style={{
        background: "rgba(10, 12, 18, 0.6)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "60px 0",
        position: "relative",
        zIndex: 5,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          {stats.map((s, i) => (
            <F
              key={i}
              delay={i * 60}
              style={{
                textAlign: "center",
                padding: "16px",
                position: "relative",
              }}
            >
              {/* Internal card-like feel */}
              <div
                style={{
                  display: "inline-block",
                  position: "relative",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(30px, 3vw, 42px)",
                    fontWeight: 700,
                    color: acc,
                    lineHeight: 1,
                    letterSpacing: "-.02em",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, transparent 0%, ${acc}88 50%, transparent 100%)`,
                    marginTop: 6,
                    width: "80%",
                    margin: "6px auto 0",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--txt2)",
                  marginTop: 10,
                  lineHeight: 1.4,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}
              >
                {s.l}
              </div>
            </F>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Metrics;
