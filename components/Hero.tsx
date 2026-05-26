"use client";

import React from "react";
import F from "./FadeIn";
import { Btn } from "./Nav";
import HeroCard from "./HeroCard";

interface HeroProps {
  acc: string;
  badge: string;
  cta: string;
}

export function Hero({ acc, badge, cta }: HeroProps) {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.024) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.024) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 75% 90% at 50% 40%,black 25%,transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 90% at 50% 40%,black 25%,transparent 78%)",
          pointerEvents: "none",
        }}
      />
      <div className="wrap" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
          {/* Left */}
          <div style={{ flex: "0 0 55%", maxWidth: "55%" }}>
            <F delay={0}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 40,
                  padding: "6px 14px",
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: acc,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--txt2)",
                    letterSpacing: ".06em",
                  }}
                >
                  {badge}
                </span>
              </div>
            </F>
            <F delay={70}>
              <h1
                style={{
                  fontSize: "clamp(38px, 3.8vw, 56px)",
                  fontWeight: 700,
                  letterSpacing: "-.032em",
                  lineHeight: 1.08,
                  marginBottom: 22,
                  color: "var(--txt)",
                }}
              >
                The AI sales agent
                <br />
                that speaks every
                <br />
                <span style={{ color: acc }}>industry's language.</span>
              </h1>
            </F>
            <F delay={140}>
              <p
                style={{
                  fontSize: 16,
                  color: "var(--txt2)",
                  maxWidth: 480,
                  lineHeight: 1.72,
                  marginBottom: 34,
                }}
              >
                VOXA makes outbound calls, qualifies leads, books appointments, and sends
                follow-up messages — all powered by plug-and-play domain skill packs built
                for your industry.
              </p>
            </F>
            <F delay={210}>
              <div
                style={{
                  display: "flex",
                  gap: 13,
                  marginBottom: 22,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Btn acc={acc}>{cta}</Btn>
                <Btn acc={acc} ghost>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6 5l5 2.5L6 10V5Z" fill="currentColor" />
                  </svg>
                  Watch a live call
                </Btn>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt3)" }}>
                No credit card · 14-day trial · 5 min setup · Cancel anytime
              </div>
            </F>
          </div>
          {/* Right */}
          <div style={{ flex: "0 0 45%", maxWidth: "45%" }}>
            <F delay={280}>
              <HeroCard acc={acc} />
            </F>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
