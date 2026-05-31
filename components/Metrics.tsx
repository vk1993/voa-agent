"use client";
import React from "react";

export default function Metrics({ acc }: { acc: string }) {
  const stats = [
    { v: "147", l: "Active B2B Tenants" },
    { v: "8", l: "Industry Verticals" },
    { v: "<800ms", l: "Average AI Response" },
    { v: "23%", l: "Avg Conversion Rate" },
    { v: "23", l: "Countries Active" },
  ];

  return (
    <section
      style={{
        background: "rgba(10, 12, 18, 0.6)",
        borderTop: "0.5px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "0.5px solid rgba(255, 255, 255, 0.05)",
        padding: "60px 0",
        position: "relative",
        zIndex: 5,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "16px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  position: "relative",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(32px, 3.2vw, 44px)",
                    fontWeight: 700,
                    color: acc,
                    lineHeight: 1,
                    letterSpacing: "-.03em",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, transparent 0%, ${acc}80 50%, transparent 100%)`,
                    marginTop: 6,
                    width: "80%",
                    margin: "6px auto 0",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
