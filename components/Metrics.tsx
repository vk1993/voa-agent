"use client";

import React from "react";
import F from "./FadeIn";

interface MetricsProps {
  acc: string;
}

export function Metrics({ acc }: MetricsProps) {
  const stats = [
    { v: "147M+", l: "Calls handled" },
    { v: "$0.09", l: "Avg cost per call" },
    { v: "572ms", l: "P95 response time" },
    { v: "23", l: "Countries live" },
    { v: "4.8×", l: "More bookings vs human team" },
  ];

  return (
    <section
      style={{
        background: "#0A0C12",
        borderTop: "1px solid var(--bdr2)",
        borderBottom: "1px solid var(--bdr2)",
        padding: "56px 0",
      }}
    >
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              <F delay={i * 60} style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
                <div style={{ display: "inline-block", position: "relative", marginBottom: 4 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 38,
                      fontWeight: 700,
                      color: acc,
                      lineHeight: 1,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: -5,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: `${acc}44`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    color: "var(--txt2)",
                    marginTop: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {s.l}
                </div>
              </F>
              {i < 4 && (
                <div
                  style={{
                    width: 1,
                    height: 52,
                    background: "rgba(255,255,255,.07)",
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Metrics;
