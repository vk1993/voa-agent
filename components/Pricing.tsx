"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
    name: "STARTER TIER",
    priceM: "$0.09",
    priceA: "$0.07",
    unit: "/ call min",
    sub: "Pay-as-you-go VoIP channels",
    featured: false,
    features: [
      "1 business domain skill pack",
      "500 outbound calls / month included",
      "Realtime SMS & WhatsApp follow-ups",
      "Core API access & Webhook endpoints",
      "Standard email & Discord support",
    ],
    cta: "Start free trial",
  },
  {
    name: "GROWTH AGENT",
    priceM: "$0.07",
    priceA: "$0.05",
    unit: "/ call min",
    sub: "Scaled to 10,000 calls / month",
    featured: true,
    features: [
      "3 custom domain skill packs",
      "Interactive RAG catalog uploads",
      "Realtime dashboard + VoIP caller monitors",
      "Direct HubSpot & Zoho CRM integrations",
      "Multi-lingual voices (Hindi, Spanish, Arabic)",
      "Dedicated onboarding & set-up calls",
    ],
    cta: "Scale your agency →",
  },
  {
    name: "ENTERPRISE",
    priceM: "Custom",
    priceA: "Custom",
    unit: "",
    sub: "Unlimited calls · Guaranteed SLA",
    featured: false,
    features: [
      "Unlimited custom skill packs buildouts",
      "Full white-label & custom domains",
      "Dedicated secure database instance",
      "LLM fine-tuning on custom call data",
      "Dedicated Customer Success Manager",
      "Enterprise Grade 99.9% uptime SLA",
    ],
    cta: "Contact Enterprise →",
  },
];

interface PricingProps {
  acc: string;
  annualPricing: boolean;
}

export function Pricing({ acc, annualPricing: initAnnual }: PricingProps) {
  const [annual, setAnnual] = useState(initAnnual);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => setAnnual(initAnnual), [initAnnual]);

  return (
    <section id="pricing" style={{ padding: "100px 0", position: "relative" }}>
      {/* Glow effect at background */}
      <div
        className="glow-orb"
        style={{
          top: "30%",
          left: "15%",
          width: "400px",
          height: "400px",
          background: `radial-gradient(circle, ${acc}0B 0%, transparent 70%)`,
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
              VOXA PRICING MODEL
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 3.5vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-.04em",
                lineHeight: 1.1,
                marginBottom: 16,
                color: "var(--txt)",
              }}
            >
              Transparent rates. Scaled for speed.
            </h2>
            <p
              style={{
                fontSize: 16.5,
                color: "var(--txt2)",
                lineHeight: 1.68,
                marginBottom: 36,
                maxWidth: 580,
                margin: "0 auto 36px",
                fontFamily: "var(--font-sans), sans-serif",
              }}
            >
              Only pay for productive call minutes. No setup fees, no software licenses, zero hidden surcharges.
            </p>

            {/* Toggle Billing Selector */}
            <div
              style={{
                display: "inline-flex",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: 12,
                padding: 4,
                backdropFilter: "blur(12px)",
              }}
            >
              {["Monthly Pricing", "Annual Plan (save 20%)"].map((label, index) => {
                const isActive = annual === (index === 1);
                return (
                  <button
                    key={index}
                    onClick={() => setAnnual(index === 1)}
                    style={{
                      padding: "8px 22px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans), sans-serif",
                      background: isActive ? acc : "transparent",
                      color: isActive ? "#07080B" : "var(--txt2)",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </F>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((p, i) => {
            const isCardHovered = hoveredIndex === i;
            return (
              <F key={i} delay={i * 60} style={{ display: "flex" }}>
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="glass-panel"
                  style={{
                    flex: 1,
                    background: p.featured
                      ? "linear-gradient(155deg, rgba(20,18,12,0.85) 0%, rgba(10,11,15,0.9) 100%)"
                      : "var(--surf)",
                    border: `1px solid ${
                      p.featured ? acc : isCardHovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,.05)"
                    }`,
                    borderRadius: 20,
                    padding: "36px 32px",
                    position: "relative",
                    transform: p.featured ? "scale(1.025)" : "none",
                    boxShadow: p.featured
                      ? `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${acc}15`
                      : isCardHovered
                      ? "0 15px 40px rgba(0, 0, 0, 0.45)"
                      : "0 10px 30px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
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
                        color: "#07080B",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: 20,
                        letterSpacing: ".08em",
                        whiteSpace: "nowrap",
                        boxShadow: `0 4px 12px ${acc}44`,
                      }}
                    >
                      RECOMMENDED TIER
                    </div>
                  )}

                  <div>
                    {/* Plan Header */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: ".12em",
                        color: p.featured ? acc : "var(--txt3)",
                        marginBottom: 18,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 44,
                          fontWeight: 700,
                          color: "var(--txt)",
                          lineHeight: 1,
                          letterSpacing: "-.02em",
                        }}
                      >
                        {annual ? p.priceA : p.priceM}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          color: "var(--txt2)",
                          fontWeight: 500,
                        }}
                      >
                        {p.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--txt2)",
                        marginBottom: 24,
                        fontFamily: "var(--font-sans), sans-serif",
                      }}
                    >
                      {p.sub}
                    </div>

                    <div style={{ height: 1, background: "rgba(255,255,255,.05)", marginBottom: 24 }} />

                    {/* Features checklist */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 32 }}>
                      {p.features.map((feature, featureIndex) => (
                        <div key={featureIndex} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span
                            style={{
                              color: acc,
                              flexShrink: 0,
                              marginTop: 1,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                          <span
                            style={{
                              fontSize: 13.5,
                              color: "var(--txt2)",
                              lineHeight: 1.5,
                              fontFamily: "var(--font-sans), sans-serif",
                            }}
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Action Button */}
                  <Link href="/login" transitionTypes={["nav-forward"]} style={{ textDecoration: "none" }}>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 10,
                        border: p.featured ? "none" : "1px solid rgba(255,255,255,.12)",
                        background: p.featured ? acc : "rgba(255, 255, 255, 0.02)",
                        cursor: "pointer",
                        color: p.featured ? "#07080B" : "var(--txt)",
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "var(--font-sans), sans-serif",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: p.featured && isCardHovered ? `0 10px 24px ${acc}33` : "none",
                        transform: isCardHovered ? "translateY(-1px)" : "none",
                      }}
                    >
                      {p.cta}
                    </button>
                  </Link>
                </div>
              </F>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
