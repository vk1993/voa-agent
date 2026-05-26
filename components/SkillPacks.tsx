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
    desc: "Modular kitchens, wardrobes, full-home. RAG: 12K product SKUs, 340 objection scripts.",
    foot: "4,200 calls / day across 18 tenants",
  },
  {
    icon: "🏗️",
    name: "Real Estate",
    status: "LIVE",
    sc: "var(--green)",
    desc: "Site visits, project launches, resale leads. RAG: Builder inventory, RERA compliance scripts.",
    foot: "8,100 calls / day across 31 tenants",
  },
  {
    icon: "🚗",
    name: "Automotive",
    status: "LIVE",
    sc: "var(--green)",
    desc: "Test drive bookings, EMI qualification, trade-in. RAG: Trim specs, on-road pricing, dealer inventory.",
    foot: "2,900 calls / day across 12 tenants",
  },
  {
    icon: "🏥",
    name: "Healthcare / Clinics",
    status: "BETA",
    sc: "var(--blue)",
    desc: "Appointment setting, symptom pre-screening, insurance pre-auth. HIPAA-aligned prompts.",
    foot: "Beta — 6 pilot tenants",
  },
  {
    icon: "📚",
    name: "EdTech / Admissions",
    status: "BETA",
    sc: "var(--blue)",
    desc: "Course counselling, demo class booking, scholarship qualification. Multi-language.",
    foot: "Beta — 4 pilot tenants",
  },
  {
    icon: "⚡",
    name: "Custom Skill Pack",
    status: "BUILD",
    sc: "#F59E0B",
    desc: "Upload your product catalog, pricing sheets, and objection library. Auto-indexed in 24hrs.",
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
      style={{
        background: "var(--surf)",
        borderRadius: 14,
        padding: 24,
        border: `1px solid ${h ? acc + "40" : "rgba(255,255,255,.05)"}`,
        transform: h ? "translateY(-3px)" : "none",
        boxShadow: h ? "0 16px 40px rgba(0,0,0,.35)" : "none",
        transition: "all .25s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 185,
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{p.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 600,
            padding: "3px 7px",
            borderRadius: 5,
            color: p.sc,
            background: `color-mix(in srgb, ${p.sc} 12%, transparent)`,
            border: `0.5px solid color-mix(in srgb, ${p.sc} 35%, transparent)`,
            letterSpacing: ".06em",
          }}
        >
          {p.status}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--txt2)", lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,.04)",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--txt3)",
        }}
      >
        {p.custom ? (
          <span style={{ color: acc, cursor: "pointer" }}>+ Add your domain →</span>
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
    <section style={{ padding: "100px 0" }}>
      <div className="wrap">
        <F>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: acc,
                letterSpacing: ".1em",
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              Domain Skill Packs
            </div>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-.03em",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              One platform. Every industry.
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "var(--txt2)",
                maxWidth: 560,
                margin: "0 auto",
                lineHeight: 1.72,
              }}
            >
              Switch your AI agent's domain expertise in one click. Each skill pack bundles the RAG
              catalog, objection scripts, qualification trees, and post-call actions for that vertical.
            </p>
          </div>
        </F>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PACKS.map((p, i) => (
            <F key={i} delay={i * 55}>
              <PackCard p={p} acc={acc} />
            </F>
          ))}
        </div>
        <F delay={200}>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div
              style={{
                display: "inline-block",
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: "var(--txt3)",
                padding: "10px 22px",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 40,
                letterSpacing: ".025em",
              }}
            >
              All packs share the same voice pipeline · STT · LLM · TTS · Post-call intelligence layer
            </div>
          </div>
        </F>
      </div>
    </section>
  );
}

export default SkillPacks;
