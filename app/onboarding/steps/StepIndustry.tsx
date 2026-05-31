"use client";

import React from "react";
import { OnboardingData } from "../page";
import { VERTICAL_LIST, getVerticalConfig, VerticalConfig } from "@/lib/domain-config";

interface StepIndustryProps {
  data: OnboardingData;
  onNext: (stepData: Partial<OnboardingData>) => void;
}

const LUCIDE_TO_TABLER: Record<string, string> = {
  Sofa: "ti-sofa",
  Building2: "ti-building",
  HardHat: "ti-crane",
  Package: "ti-package",
  TrendingUp: "ti-coins",
  Stethoscope: "ti-stethoscope",
  GraduationCap: "ti-school",
  Sparkles: "ti-dots",
};

export default function StepIndustry({ data, onNext }: StepIndustryProps) {
  const handleSelect = (verticalId: string) => {
    const config = VERTICAL_LIST.find((v) => v.id === verticalId);
    if (!config) return;

    // Map default services to the flat structure expected by the updated OnboardingData
    const defaultServices = (config.defaultServices || []).map((s) => ({
      name: s.name,
      rangeMin: s.rangeInr[0],
      rangeMax: s.rangeInr[1],
      leadDays: s.leadDays,
    }));

    // Pre-populate locations based on vertical requirements
    // For SaaS/Custom, locations are not strictly needed, but let's initialize a dynamic default
    const needsLocation = verticalId !== "product" && verticalId !== "custom";
    const defaultLocations = needsLocation
      ? [
          {
            name: `Main ${config.locationLabel}`,
            pincodes: "560001, 560038",
            contactName: "",
            contactRole: config.contactRoleLabel,
            calendarId: "",
          },
        ]
      : [];

    onNext({
      verticalId: verticalId,
      agentName: config.agentNameDefault,
      companyName: data.companyName || "",
      language: verticalId === "product" ? "en" : "hinglish",
      tone: "professional",
      services: defaultServices,
      locations: defaultLocations,
    });
  };

  return (
    <div style={{ textAlign: "left" }} id="step-industry">
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
        Pick your industry
      </h2>
      <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
        We'll pre-populate your AI agent with skill packs, default services, and live transcripts specific to your vertical.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {VERTICAL_LIST.map((v) => {
          const selected = data.verticalId === v.id;
          const tablerIcon = LUCIDE_TO_TABLER[v.icon] || "ti-dots";
          return (
            <div
              key={v.id}
              onClick={() => handleSelect(v.id)}
              className="card card-hover"
              style={{
                padding: "24px 20px",
                cursor: "pointer",
                border: selected
                  ? "2px solid var(--gold)"
                  : "0.5px solid var(--border)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 12,
                background: "var(--bg-card)",
              }}
            >
              {selected && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="ti ti-check"
                    style={{ fontSize: 12, color: "white", fontWeight: 700 }}
                  />
                </div>
              )}

              <i
                className={`ti ${tablerIcon}`}
                aria-hidden="true"
                style={{ fontSize: 32, color: v.color }}
              />
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--txt)",
                    marginBottom: 4,
                  }}
                >
                  {v.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--txt3)",
                    lineHeight: 1.4,
                  }}
                >
                  {v.tagline}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
