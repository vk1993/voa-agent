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
        paddingTop: 110,
        paddingBottom: 70,
        background: "radial-gradient(circle at top right, rgba(20,24,38,0.15) 0%, transparent 60%)",
      }}
    >
      {/* Moving Ambient Glow Orbs */}
      <div
        className="glow-orb"
        style={{
          top: "15%",
          right: "10%",
          width: "450px",
          height: "450px",
          background: `radial-gradient(circle, ${acc}0B 0%, transparent 70%)`,
        }}
      />
      <div
        className="glow-orb"
        style={{
          bottom: "10%",
          left: "5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(99,140,255,0.06) 0%, transparent 70%)",
          animationDelay: "-7s",
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 45%, black 25%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 45%, black 25%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      <div className="wrap" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
          {/* Left Hero Area */}
          <div style={{ flex: "0 0 54%", maxWidth: "54%" }}>
            <F delay={0}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 40,
                  padding: "5px 14px",
                  marginBottom: 24,
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: acc,
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${acc}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--txt2)",
                    letterSpacing: ".08em",
                  }}
                >
                  {badge}
                </span>
              </div>
            </F>

            <F delay={60}>
              <h1
                style={{
                  fontSize: "clamp(38px, 4.2vw, 58px)",
                  fontWeight: 800,
                  letterSpacing: "-.04em",
                  lineHeight: 1.05,
                  marginBottom: 20,
                  color: "var(--txt)",
                }}
              >
                The AI sales agent
                <br />
                that speaks every
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${acc} 0%, rgba(255,255,255,0.7) 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 900,
                  }}
                >
                  industry's language.
                </span>
              </h1>
            </F>

            <F delay={120}>
              <p
                style={{
                  fontSize: 16.5,
                  color: "var(--txt2)",
                  maxWidth: 500,
                  lineHeight: 1.68,
                  marginBottom: 32,
                  fontFamily: "var(--font-sans), sans-serif",
                }}
              >
                VOXA makes outbound calls, qualifies leads, books appointments, and sends
                real-time SMS follow-ups — all powered by plug-and-play domain skill packs built
                explicitly for your brand.
              </p>
            </F>

            <F delay={180}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginBottom: 24,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Btn acc={acc} href="/login" transitionTypes={["nav-forward"]}>
                  {cta}
                </Btn>
                <Btn acc={acc} ghost onClick={() => {
                  const target = document.getElementById("skillpacks");
                  if (target) target.scrollIntoView({ behavior: "smooth" });
                }}>
                  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ marginRight: 2 }}>
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6 5l5 2.5L6 10V5Z" fill="currentColor" />
                  </svg>
                  Explore skill packs
                </Btn>
              </div>
              
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--txt3)",
                  letterSpacing: ".02em",
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span>✓ No credit card</span>
                <span>✓ 14-day free trial</span>
                <span>✓ 5 minute setup</span>
              </div>
            </F>
          </div>

          {/* Right Hero Card Area */}
          <div style={{ flex: "0 0 46%", maxWidth: "46%" }}>
            <F delay={240}>
              <HeroCard acc={acc} />
            </F>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
