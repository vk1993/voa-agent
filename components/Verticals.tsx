"use client";
import { useState } from "react";
import { VERTICAL_LIST } from "@/lib/domain-config";

const DOMAIN_STATS: Record<string, string> = {
  interior:    "2.4× more design consultations",
  real_estate: "31% site visit conversion rate",
  construction:"4× faster project lead qualification",
  product:     "60% lower cost-per-demo than SDRs",
  finance:     "18% meeting-to-close rate",
  healthcare:  "5× more doctor visits per rep",
  education:   "3× higher trial class bookings",
  custom:      "Configure for any sales use case",
};

export default function Verticals({ acc }: { acc: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="verticals" style={{ background: "var(--bg)",
      padding: "var(--space-section) 0" }}>
      <div className="container">
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: acc, marginBottom: 14 }}>
            Works across every industry
          </p>
          <h2 className="land-h2" style={{ color: "#F3F4F6" }}>
            One platform.<br />Every vertical.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)",
            marginTop: 14, maxWidth: 520, margin: "14px auto 0" }}>
            Plug in a domain skill pack and your AI agent instantly knows
            your industry's terminology, objections, and booking flows.
          </p>
        </div>

        {/* Domain grid */}
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {VERTICAL_LIST.map(v => (
            <div key={v.id} className="domain-card"
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ borderColor: hovered === v.id ? v.color : undefined,
                background: hovered === v.id ? `${v.color}08` : undefined }}>
              {/* Icon */}
              <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: `${v.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: v.color }}>
                {/* Use appropriate emoji */}
                {{"interior":"🛋","real_estate":"🏢","construction":"⚒","product":"📦",
                  "finance":"📈","healthcare":"⚕","education":"🎓","custom":"✨"}[v.id as string] || "✨"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#F3F4F6",
                marginBottom: 4, letterSpacing: -0.01 }}>{v.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)",
                marginBottom: 14, lineHeight: 1.5 }}>{v.tagline}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: v.color,
                display: "flex", alignItems: "center", gap: 5 }}>
                <span>↑</span> {DOMAIN_STATS[v.id]}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
            Don't see your industry? Use Custom mode — configure any sales flow.
          </p>
          <a href="/signup" style={{ fontSize: 14, fontWeight: 600,
            color: acc, textDecoration: "none" }}>
            Start free with your industry →
          </a>
        </div>
      </div>
    </section>
  );
}
