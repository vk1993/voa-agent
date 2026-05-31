"use client";

import React from "react";

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Left panel — brand */}
      <div
        style={{
          background: "var(--abyss)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--gold)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--abyss)",
              fontFamily: "var(--font-display)",
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: "#F5F4F0",
            }}
          >
            VOXA
          </span>
        </div>

        {/* Waveform visual */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <svg
            viewBox="0 0 320 120"
            width="100%"
            style={{ maxWidth: 320, opacity: 0.6 }}
          >
            {Array.from({ length: 40 }, (_, i) => {
              const h =
                10 +
                Math.abs(Math.sin(i * 0.6)) * 80 +
                Math.abs(Math.sin(i * 1.3)) * 30;
              return (
                <rect
                  key={i}
                  x={i * 8}
                  y={(120 - h) / 2}
                  width={4}
                  height={h}
                  rx={2}
                  fill={i % 3 === 0 ? "#C9A14A" : "rgba(255,255,255,0.15)"}
                />
              );
            })}
          </svg>
        </div>

        {/* Bottom quote */}
        <div>
          <blockquote
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 18,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            "VOXA qualifies outbound leads and schedules high-value sales handshakes automatically, at scale."
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--gold-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--gold)",
              }}
            >
              SJ
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Sarah Jenkins
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Growth Director, TechCorp
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          {title && (
            <div style={{ marginBottom: 32 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--abyss)",
                  letterSpacing: -0.02,
                  marginBottom: 8,
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p style={{ fontSize: 15, color: "#6B6968" }}>{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
