"use client";

import React, { useState } from "react";
import F from "./FadeIn";

interface Pack {
  icon: string;
  name: string;
  status: string;
  sc: string;
  desc: string;
  foot: string | null;
  custom?: boolean;
}

const PACKS: Pack[] = [
  {
    icon: "🏠",
    name: "Interior Design",
    status: "LIVE",
    sc: "var(--green)",
    desc: "Modular kitchens, wardrobes, and full-home decor. RAG: 12K product SKUs, 340 custom objection handlers.",
    foot: "4,200 calls / day across 18 tenants",
  },
  {
    icon: "🏗️",
    name: "Real Estate Brokerage",
    status: "LIVE",
    sc: "var(--green)",
    desc: "Site visits scheduling, project launches, and resale leads. RAG: Builder inventory & RERA compliance.",
    foot: "8,100 calls / day across 31 tenants",
  },
  {
    icon: "🚗",
    name: "Automotive Sales",
    status: "LIVE",
    sc: "var(--green)",
    desc: "Test drive bookings, EMI calculations, and trade-ins. RAG: Trim specs, dealer inventory & on-road pricing.",
    foot: "2,900 calls / day across 12 tenants",
  },
  {
    icon: "🏥",
    name: "Healthcare Systems",
    status: "BETA",
    sc: "var(--blue)",
    desc: "Appointment setting, symptom pre-screening, and insurance pre-auth. HIPAA-aligned prompt templates.",
    foot: "Beta — 6 active pilot tenants",
  },
  {
    icon: "📚",
    name: "EdTech Counselling",
    status: "BETA",
    sc: "var(--blue)",
    desc: "Course advising, demo class booking, and scholarship qualification. Fully multi-lingual models.",
    foot: "Beta — 4 active pilot tenants",
  },
  {
    icon: "⚡",
    name: "Custom Enterprise Pack",
    status: "BUILD",
    sc: "#F59E0B",
    desc: "Upload your product catalog, sales playbook, and objection sheets. Auto-indexed in less than 24 hours.",
    foot: null,
    custom: true,
  },
];

interface PackCardProps {
  p: Pack;
  acc: string;
}

function PackCard({ p, acc }: PackCardProps) {
  const [h, setH] = useState(false);

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="glass-panel stagger-item"
      style={{
        borderRadius: 16,
        padding: "26px 24px",
        border: `1px solid ${h ? acc + "33" : "rgba(255,255,255,.04)"}`,
        transform: h ? "translateY(-4px)" : "none",
        boxShadow: h ? `0 16px 40px rgba(0,0,0,.45), 0 0 16px ${acc}15` : "0 8px 24px rgba(0,0,0,0.2)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 200,
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>{p.icon}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-.02em",
              color: "var(--txt)",
            }}
          >
            {p.name}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            color: p.sc,
            background: `color-mix(in oklch, ${p.sc} 14%, transparent)`,
            border: `1px solid color-mix(in oklch, ${p.sc} 35%, transparent)`,
            letterSpacing: ".06em",
          }}
        >
          {p.status}
        </span>
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--txt2)",
          lineHeight: 1.62,
          flex: 1,
          fontFamily: "var(--font-sans), sans-serif",
        }}
      >
        {p.desc}
      </p>
      <div
        style={{
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,.05)",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--txt3)",
          fontWeight: 500,
        }}
      >
        {p.custom ? (
          <span
            style={{
              color: acc,
              cursor: "pointer",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            + Add your business domain →
          </span>
        ) : (
          p.foot
        )}
      </div>
    </div>
  );
}

interface SkillPacksProps {
  acc: string;
}

export function SkillPacks({ acc }: SkillPacksProps) {
  return (
    <section id="skillpacks" style={{ padding: "100px 0", position: "relative" }}>
      {/* Background glow orb */}
      <div
        className="glow-orb"
        style={{
          bottom: "10%",
          right: "5%",
          width: "350px",
          height: "350px",
          background: `radial-gradient(circle, ${acc}08 0%, transparent 70%)`,
        }}
      />
      <div className="wrap">
        <F>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: acc,
                letterSpacing: ".12em",
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              Domain Skill Packs
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 3.5vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-.04em",
                lineHeight: 1.1,
                marginBottom: 18,
                color: "var(--txt)",
              }}
            >
              One platform. Every vertical.
            </h2>
            <p
              style={{
                fontSize: 16.5,
                color: "var(--txt2)",
                maxWidth: 580,
                margin: "0 auto",
                lineHeight: 1.68,
                fontFamily: "var(--font-sans), sans-serif",
              }}
            >
              Inject specific domain expertise into your active calls instantly. Each skill pack
              bundles catalog RAG nodes, objection matrices, compliance trees, and workflow triggers.
            </p>
          </div>
        </F>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(325px, 1fr))",
            gap: 20,
          }}
        >
          {PACKS.map((p, i) => (
            <F key={i} delay={i * 50}>
              <PackCard p={p} acc={acc} />
            </F>
          ))}
        </div>

        <F delay={200}>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <div
              style={{
                display: "inline-block",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--txt3)",
                padding: "10px 24px",
                border: "1px solid rgba(255,255,255,.05)",
                borderRadius: 40,
                letterSpacing: ".03em",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              All vertical packs inherit custom STT, low-latency TTS synthesis, and our Post-Call LLM intelligence layers.
            </div>
          </div>
        </F>
      </div>
    </section>
  );
}

export default SkillPacks;
