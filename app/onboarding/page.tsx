"use client";

import { useState } from "react";
import Link from "next/link";
import StepIndustry from "./steps/StepIndustry";
import StepPersona from "./steps/StepPersona";
import StepServices from "./steps/StepServices";
import StepLocations from "./steps/StepLocations";
import StepContacts from "./steps/StepContacts";
import StepTestCall from "./steps/StepTestCall";
import StepCelebration from "./steps/StepCelebration";

const STEPS = [
  { id: 1, label: "Pick your industry", icon: "ti-building-store" },
  { id: 2, label: "Name your AI agent", icon: "ti-robot" },
  { id: 3, label: "Your services", icon: "ti-list-check" },
  { id: 4, label: "Add locations", icon: "ti-map-pin" },
  { id: 5, label: "Import contacts", icon: "ti-users" },
  { id: 6, label: "Make a test call", icon: "ti-phone", wow: true },
  { id: 7, label: "You're live!", icon: "ti-rocket" },
];

export interface OnboardingData {
  verticalId: string;
  agentName: string;
  companyName: string;
  language: string;
  tone: string;
  services: { name: string; rangeMin: number; rangeMax: number; leadDays: number }[];
  locations: { name: string; pincodes: string; contactName: string; contactRole: string; calendarId: string }[];
  contacts: { name: string; phone: string }[];
  testCallRating?: number | null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    verticalId: "",
    agentName: "",
    companyName: "",
    language: "hinglish",
    tone: "professional",
    services: [],
    locations: [],
    contacts: [],
  });

  const next = (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      setData((prev) => ({ ...prev, ...stepData } as OnboardingData));
    }
    setStep((s) => Math.min(s + 1, 7));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        minHeight: "100vh",
        fontFamily: "var(--font-sans)",
        background: "var(--bg)",
      }}
    >
      {/* Left: step progress */}
      <aside
        style={{
          background: "var(--bg-card)",
          borderRight: "0.5px solid var(--border)",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--gold)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--abyss)",
              fontFamily: "var(--font-display)",
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: "var(--txt)",
            }}
          >
            VOXA
          </span>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: active
                    ? "var(--gold-muted)"
                    : "transparent",
                  opacity: s.id > step && s.id !== step ? 0.4 : 1,
                  cursor: done ? "pointer" : "default",
                }}
                onClick={() => done && setStep(s.id)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done
                      ? "var(--teal)"
                      : active
                      ? "var(--gold)"
                      : "var(--bg-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: done || active ? "white" : "var(--txt3)",
                    fontWeight: 600,
                  }}
                >
                  {done ? (
                    <i
                      className="ti ti-check"
                      aria-hidden="true"
                      style={{ fontSize: 14, color: "white" }}
                    />
                  ) : (
                    s.id
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: active
                        ? "var(--gold)"
                        : done
                        ? "var(--txt)"
                        : "var(--txt2)",
                    }}
                  >
                    {s.label}
                  </div>
                  {s.wow && active && (
                    <div
                      style={{ fontSize: 11, color: "var(--gold)", fontWeight: 500 }}
                    >
                      ★ Hear your AI right now
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            borderTop: "0.5px solid var(--border)",
          }}
        >
          <Link
            href="/admin/contacts"
            style={{ fontSize: 13, color: "var(--txt3)", textDecoration: "none" }}
          >
            Skip setup → go to dashboard
          </Link>
        </div>
      </aside>

      {/* Right: step content */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          {step === 1 && <StepIndustry data={data} onNext={next} />}
          {step === 2 && (
            <StepPersona data={data} onNext={next} onBack={back} />
          )}
          {step === 3 && (
            <StepServices data={data} onNext={next} onBack={back} />
          )}
          {step === 4 && (
            <StepLocations data={data} onNext={next} onBack={back} />
          )}
          {step === 5 && (
            <StepContacts data={data} onNext={next} onBack={back} />
          )}
          {step === 6 && (
            <StepTestCall data={data} onNext={next} onBack={back} />
          )}
          {step === 7 && <StepCelebration data={data} />}
        </div>
      </main>
    </div>
  );
}
