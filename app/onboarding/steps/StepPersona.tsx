"use client";

import React, { useState, useEffect } from "react";
import { OnboardingData } from "../page";
import { VERTICALS, getVerticalConfig } from "@/lib/domain-config";

interface StepPersonaProps {
  data: OnboardingData;
  onNext: (stepData: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepPersona({ data, onNext, onBack }: StepPersonaProps) {
  const [agentName, setAgentName] = useState(data.agentName || "");
  const [companyName, setCompanyName] = useState(data.companyName || "");
  const [language, setLanguage] = useState(data.language || "hinglish");
  const [tone, setTone] = useState(data.tone || "professional");

  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  // Dynamically set defaults based on Vertical selected if empty
  useEffect(() => {
    if (v) {
      if (!agentName) {
        setAgentName(v.agentNameDefault);
      }
      if (data.verticalId === "product" && !data.language) {
        setLanguage("en");
      }
    }
  }, [v, data.verticalId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      agentName,
      companyName,
      language,
      tone,
    });
  };

  // Generate dynamic live speech preview from vertical configs
  const previewTranscript = v
    ? `Hello, this is ${agentName || "Priya"} calling from ${
        companyName || "Prestige Interiors"
      }. I saw you're interested in ${v.tagline.toLowerCase()}. As our ${v.roleDescription}, ${
        v.callToAction
      }`
    : `Hello, this is ${agentName || "Alex"} calling from ${
        companyName || "our company"
      }. Is this a good time to talk?`;

  return (
    <div style={{ textAlign: "left" }} id="step-persona">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--txt)",
          marginBottom: 8,
          letterSpacing: -0.02,
        }}
      >
        Name your AI agent
      </h2>
      <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
        This is the personality your customers will speak to during outbound calls.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Left Side: Form inputs */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label className="label">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="input"
              placeholder={v ? `e.g. ${v.agentNameDefault}` : "e.g. Priya or Rahul"}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              placeholder="e.g. Prestige Interiors"
              required
            />
          </div>
          <div>
            <label className="label">Primary Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
              style={{ padding: "0 10px", appearance: "auto" }}
            >
              <option value="hinglish">Hinglish (English + Hindi)</option>
              <option value="en">English (India)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
          <div>
            <label className="label">Call Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="input"
              style={{ padding: "0 10px", appearance: "auto" }}
            >
              <option value="professional">Professional & Direct</option>
              <option value="helpful">Helpful & Polite</option>
              <option value="energetic">Energetic & Enthusiastic</option>
            </select>
          </div>

          {/* Localized Hinglish/English helper notice */}
          <div
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 12,
              fontSize: 12,
              color: "var(--txt2)",
              lineHeight: 1.5,
            }}
          >
            {language === "hinglish" ? (
              <span>
                💡 <strong>Hinglish Voice Active:</strong> Mixes Hindi and English naturally, resulting in a <strong>42% higher answer rate</strong> and better lead retention for outbound sales in Indian urban centers.
              </span>
            ) : language === "en" ? (
              <span>
                💡 <strong>English Voice Active:</strong> Clean, professional Indian-accented English tailored for enterprise software, SaaS, or high-income demographic outreach.
              </span>
            ) : (
              <span>
                💡 <strong>Hindi Voice Active:</strong> Pure Hindi conversation system suitable for Tier-2 / Tier-3 outreach campaigns and vernacular sales campaigns.
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onBack}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: "center" }}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="btn btn-gold"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Continue
            </button>
          </div>
        </form>

        {/* Right Side: Live preview card */}
        <div style={{ position: "sticky", top: 20 }}>
          <div
            style={{
              background: "var(--abyss)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-md)",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Live speech preview
            </div>
            <div style={{ color: "var(--gold)", marginBottom: 8, fontSize: 11 }}>
              AI AGENT ({v?.label || "General"})
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.6,
              }}
            >
              "{previewTranscript}"
            </div>

            <div
              style={{
                marginTop: 20,
                fontSize: 11,
                color: "var(--txt3)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ti ti-activity" style={{ color: "var(--gold)" }} />
              <span>
                Tone: {tone} • Lang: {language}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
