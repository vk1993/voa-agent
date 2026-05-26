"use client";

import React, { useState, useEffect } from "react";
import F from "./FadeIn";

interface Plan {
  name: string;
  priceM: string;
  priceA: string;
  unit: string;
  sub: string;
  featured: boolean;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: "STARTER",
    priceM: "$0.09",
    priceA: "$0.07",
    unit: "/ call",
    sub: "Pay as you go",
    featured: false,
    features: [
      "1 domain skill pack",
      "500 calls / month included",
      "WhatsApp post-call messages",
      "Basic analytics dashboard",
      "Email support",
    ],
    cta: "Start free trial",
  },
  {
    name: "GROWTH",
    priceM: "$0.07",
    priceA: "$0.05",
    unit: "/ call",
    sub: "Up to 10,000 calls/month",
    featured: true,
    features: [
      "3 domain skill packs",
      "Custom RAG catalog upload",
      "Real-time dashboard + call monitor",
      "HubSpot / Zoho CRM sync",
      "Multi-language (Hindi, Arabic, Spanish)",
      "Priority support + onboarding call",
    ],
    cta: "Get started →",
  },
  {
    name: "ENTERPRISE",
    priceM: "Custom",
    priceA: "Custom",
    unit: "",
    sub: "Unlimited calls · SLA guaranteed",
    featured: false,
    features: [
      "Unlimited skill packs + custom build",
      "White-label + custom domain",
      "On-premise deployment option",
      "Fine-tuned LLM on your call data",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
    cta: "Talk to sales →",
  },
];

interface PricingProps {
  acc: string;
  annualPricing: boolean;
}

export function Pricing({ acc, annualPricing: initAnnual }: PricingProps) {
  const [annual, setAnnual] = useState(initAnnual);

  useEffect(() => setAnnual(initAnnual), [initAnnual]);

  return (
    <section style={{ padding: "100px 0" }}>
      <div className="wrap">
        <F>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-.03em",
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              Transparent pricing. No surprises.
            </h2>
            <p style={{ fontSize: 16, color: "var(--txt2)", lineHeight: 1.72, marginBottom: 28 }}>
              You pay for calls made. We handle the infrastructure.
            </p>
            <div
              style={{
                display: "inline-flex",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 11,
                padding: 4,
                gap: 0,
              }}
            >
              {["Monthly", "Annual (save 20%)"].map((l, i) => (
                <button
                  key={i}
                  onClick={() => setAnnual(i === 1)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans), sans-serif",
                    background: annual === (i === 1) ? acc : "transparent",
                    color: annual === (i === 1) ? "#0F0F12" : "var(--txt2)",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all .2s",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </F>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "center" }}>
          {PLANS.map((p, i) => (
            <F key={i} delay={i * 70}>
              <div
                style={{
                  background: p.featured ? "linear-gradient(155deg,#1C1A13 0%,#16151A 100%)" : "var(--surf)",
                  border: `1px solid ${p.featured ? acc : "rgba(255,255,255,.06)"}`,
                  borderRadius: 16,
                  padding: "28px",
                  position: "relative",
                  transform: p.featured ? "scale(1.035)" : "none",
                  boxShadow: p.featured ? `0 0 70px ${acc}18` : "none",
                }}
              >
                {p.featured && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: acc,
                      color: "#0F0F12",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: 20,
                      letterSpacing: ".08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: ".1em",
                    color: p.featured ? acc : "var(--txt3)",
                    marginBottom: 16,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 36,
                      fontWeight: 700,
                      color: "var(--txt)",
                      lineHeight: 1,
                    }}
                  >
                    {annual ? p.priceA : p.priceM}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--txt2)" }}>
                    {p.unit}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 22 }}>{p.sub}</div>
                <div style={{ height: 1, background: "rgba(255,255,255,.06)", marginBottom: 20 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ color: acc, flexShrink: 0, marginTop: 1, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 10,
                    border: p.featured ? "none" : "1px solid rgba(255,255,255,.14)",
                    background: p.featured ? acc : "transparent",
                    cursor: "pointer",
                    color: p.featured ? "#0F0F12" : "var(--txt)",
                    fontSize: 14,
                    fontWeight: p.featured ? 600 : 400,
                    fontFamily: "var(--font-sans), sans-serif",
                    transition: "all .2s",
                  }}
                >
                  {p.cta}
                </button>
              </div>
            </F>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
