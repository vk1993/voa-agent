// components/Hero.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { VERTICAL_LIST } from "@/lib/domain-config";
import { Waveform } from "@/components/Waveform";

export default function Hero({ acc, badge, cta }: { acc: string; badge: string; cta: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const displayed = VERTICAL_LIST.slice(0, 6); // exclude "custom" from hero

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate through verticals every 3.5s
  useEffect(() => {
    const t = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % displayed.length);
        setIsTransitioning(false);
      }, 200);
    }, 3500);
    return () => clearInterval(t);
  }, [displayed.length]);

  const active = displayed[activeIdx];

  return (
    <section style={{
      background: "#07080B",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      paddingTop: 80,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Glow orbs — increased opacity */}
      <div className="glow-orb" style={{
        width: 600, height: 600, top: -200, left: -200, position: "absolute",
        background: `radial-gradient(circle, ${acc}35 0%, transparent 70%)`,
        pointerEvents: "none"
      }} />
      <div className="glow-orb" style={{
        width: 400, height: 400, bottom: -100, right: -100, position: "absolute",
        background: `radial-gradient(circle, rgba(99,140,255,0.18) 0%, transparent 70%)`,
        animationDelay: "-7s",
        pointerEvents: "none"
      }} />

      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(40px,6vw,80px)",
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* LEFT — text */}
        <div>
          {/* Vertical cycling badge */}
          <div style={{ marginBottom: 24, height: 36, display: "flex", alignItems: "center" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 20,
              background: `${active.color}18`,
              border: `0.5px solid ${active.color}40`,
              transition: "all 0.3s ease, background 0.3s ease, color 0.3s ease",
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateY(-4px)" : "translateY(0)"
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: active.color, animation: "pulseRing 2s infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: active.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {active.label}
              </span>
            </div>
          </div>

          {/* Hero headline */}
          <h1 className="hero-text" style={{ color: "#F3F4F6", marginBottom: 24 }}>
            One AI agent.<br />
            <span style={{ color: acc }}>Every industry.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px,1.8vw,20px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 480, marginBottom: 40 }}>
            VOXA makes outbound AI calls that qualify leads, handle objections, and book meetings — in your industry's language, in English, Hindi, or Hinglish.
          </p>

          {/* CTA */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/signup" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              background: acc,
              color: "#0F0F14",
              textDecoration: "none",
              boxShadow: `0 4px 20px ${acc}40`
            }}>
              {cta}
            </Link>
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer"
            }}>
              ▶ Watch 2-min demo
            </button>
          </div>

          {/* Social proof counts */}
          <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
            {[["147+","Active tenants"],["6","Industries"],["<800ms","Response time"]].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#F3F4F6", fontFamily: "var(--font-display)", letterSpacing: -0.02 }}>{n}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — live transcript preview */}
        <div>
          {/* Vertical selector tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {displayed.map((v, i) => (
              <button key={v.id} onClick={() => setActiveIdx(i)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: i === activeIdx ? v.color : "rgba(255,255,255,0.06)",
                  color: i === activeIdx ? "#0F0F14" : "rgba(255,255,255,0.4)",
                  transition: "background 0.3s ease, color 0.3s ease"
                }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Transcript card */}
          <div className="glass-panel transcript-block"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
              background: "#13141A",
              border: `1px solid ${active.color}30`,
              borderRadius: 12,
              padding: 20,
              boxShadow: `0 0 40px ${active.color}10, 0 20px 40px rgba(0,0,0,0.4)`,
              transition: "all 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s ease, border-color 0.4s ease, background 0.25s ease"
            }}>
            {/* Header with pulse dot and waveform */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Pulse dot */}
                <div style={{ position: "relative", width: 8, height: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: active.color, position: "relative", zIndex: 1 }} />
                  <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: active.color, opacity: 0.25, animation: "pulseRing 2s ease infinite" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Live call
                </span>
                <span style={{ fontSize: 10, color: active.color, fontWeight: 600, letterSpacing: "0.04em" }}>· {active.label}</span>
              </div>
              {/* Waveform animation */}
              <div style={{ transition: "opacity 0.3s ease", opacity: isTransitioning ? 0.3 : 1 }}>
                <Waveform acc={active.color} bars={24} />
              </div>
            </div>

            {/* Transcript turns – staggered reveal */}
            {active.exampleTranscript.map((turn, i) => (
              <div
                key={`${active.id}-${i}`}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 12,
                  opacity: mounted ? 0 : 1,
                  animation: mounted ? `floatUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 130}ms both` : "none"
                }}
              >
                <span style={{
                  color: turn.role === "AI" ? active.color : "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                  marginTop: 1,
                  minWidth: 28
                }}>
                  {turn.role === "AI" ? "AI" : "Lead"}
                </span>
                <span style={{
                  color: turn.role === "AI" ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.45)",
                  lineHeight: 1.6,
                  flex: 1,
                  fontSize: 12.5,
                  fontFamily: "var(--font-mono)"
                }}>
                  {turn.text}
                </span>
              </div>
            ))}

            {/* Outcome indicator */}
            <div style={{
              marginTop: 16,
              padding: "10px 14px",
              background: `${active.color}18`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: active.color,
              fontSize: 12,
              fontWeight: 500,
              transition: "background 0.4s ease"
            }}>
              ✓ {active.outcomeLabel} — calendar invite + WhatsApp sent
            </div>
          </div>

          {/* Powered by strip */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            <span>Powered by</span>
            {["Claude AI", "Vapi", "WhatsApp", "Google Calendar"].map(s => (
              <span key={s} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 5, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
