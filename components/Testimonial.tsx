"use client";

import React from "react";
import F from "./FadeIn";

interface FunnelItem {
  l: string;
  w: number;
  col: string;
}

interface TestimonialProps {
  acc: string;
}

export function Testimonial({ acc }: TestimonialProps) {
  const funnel: FunnelItem[] = [
    { l: "5,200 calls", w: 100, col: acc },
    { l: "3,120 answered", w: 60, col: "var(--blue)" },
    { l: "250 booked", w: 25, col: "var(--teal)" },
    { l: "187 showroom visits", w: 18, col: "var(--green)" },
  ];

  return (
    <section style={{ padding: "100px 0" }}>
      <div className="wrap">
        <F>
          <div style={{ display: "flex", gap: 32, alignItems: "stretch" }}>
            {/* Quote card */}
            <div
              style={{
                flex: "0 0 56%",
                background: "#15151A",
                borderLeft: `3px solid ${acc}`,
                borderRadius: "0 14px 14px 0",
                padding: "36px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
                <path
                  d="M0 14C0 6 4.5 1.5 11 0L13 4C8.5 5.5 7 8.5 7 12H12V22H0V14ZM17 14C17 6 21.5 1.5 28 0L30 4C25.5 5.5 24 8.5 24 12H29V22H17V14Z"
                  fill={acc}
                  fillOpacity=".35"
                />
              </svg>
              <blockquote
                style={{
                  fontSize: 19,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: "var(--txt)",
                  letterSpacing: "-.01em",
                  flex: 1,
                }}
              >
                "We replaced our 4-person telecalling team with VOXA in one weekend. Cost dropped
                61%. Appointments up 40%."
              </blockquote>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--txt2)", marginBottom: 16 }}>
                  — Priya Nair, Operations Lead · Prestige Interiors, Bangalore
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {[
                    "41% more bookings",
                    "61% cost reduction",
                    "Interior Design skill pack",
                    "India · Hindi + English",
                  ].map((c) => (
                    <span
                      key={c}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--txt2)",
                        padding: "4px 10px",
                        background: "rgba(255,255,255,.04)",
                        border: "1px solid rgba(255,255,255,.08)",
                        borderRadius: 20,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Funnel */}
            <div
              style={{
                flex: 1,
                background: "#15151A",
                border: "1px solid rgba(255,255,255,.06)",
                borderTop: `2px solid ${acc}`,
                borderRadius: 14,
                padding: "26px 30px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  color: "var(--txt3)",
                  letterSpacing: ".09em",
                  marginBottom: 22,
                }}
              >
                CONVERSION FUNNEL · LAST 30 DAYS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {funnel.map((r, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 13, color: "var(--txt2)" }}>{r.l}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: r.col }}>
                        {r.w}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "rgba(255,255,255,.06)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${r.w}%`,
                          background: r.col,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 22,
                  padding: "13px 15px",
                  background: `${acc}0D`,
                  borderRadius: 10,
                  border: `1px solid ${acc}22`,
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: acc }}>
                  3.6% end-to-end conversion
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--txt3)", marginTop: 3 }}>
                  Industry avg: 0.8% · 4.5× above benchmark
                </div>
              </div>
            </div>
          </div>
        </F>
      </div>
    </section>
  );
}

export default Testimonial;
