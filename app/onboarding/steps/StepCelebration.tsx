"use client";

import React, { useState, useEffect } from "react";
import { OnboardingData } from "../page";
import { VERTICALS } from "@/lib/domain-config";

interface StepCelebrationProps {
  data: OnboardingData;
}

const VERTICAL_TO_PRISMA: Record<string, string> = {
  interior: "INTERIOR_DESIGN",
  real_estate: "REAL_ESTATE",
  construction: "CONSTRUCTION",
  product: "PRODUCT_SALES",
  finance: "FINANCIAL_SERVICES",
  healthcare: "HEALTHCARE",
  education: "EDUCATION",
  custom: "CUSTOM",
};

export default function StepCelebration({ data }: StepCelebrationProps) {
  const [callsCount, setCallsCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  useEffect(() => {
    // 1. Load Confetti script dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const confetti = (window as any).confetti;
      if (confetti) {
        // Fire celebration bursts
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#C9A14A", "#1D9E75", "#FAFAF8"],
        });
      }
    };

    // 2. Animate stat counters using requestAnimationFrame
    let startTimestamp: number | null = null;
    const duration = 2000; // 2 seconds

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      setCallsCount(Math.floor(progress * 342));
      setConvCount(Math.floor(progress * 23));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (err) {}
      window.cancelAnimationFrame(animId);
    };
  }, []);

  const handleComplete = async (targetPath: string) => {
    setFinishing(true);

    const prismaVertical = VERTICAL_TO_PRISMA[data.verticalId] || "CUSTOM";

    const tenantContext = {
      persona: {
        agent_name: data.agentName,
        company_name: data.companyName,
        role_description: v?.roleDescription || "sales consultant",
        primary_goal: v?.primaryGoal || "qualify and book a meeting",
        call_to_action: v?.callToAction || "Can I schedule a call for you?",
        language: data.language,
      },
      services: (data.services || []).map((s) => ({
        name: s.name,
        range_inr: [s.rangeMin, s.rangeMax],
        lead_days: s.leadDays,
      })),
      locations: (data.locations || []).map((l) => ({
        name: l.name,
        pincodes: l.pincodes ? l.pincodes.split(",").map((p) => p.trim()) : [],
        calendar_id: l.calendarId || "",
        contact_name: l.contactName || "",
        contact_role: l.contactRole || "",
      })),
      promotions: [],
      faqs: [],
      media_map: v ? Object.fromEntries((v.defaultAssetKeys || []).map((k) => [k, ""])) : {},
      next_action_type: v?.nextActionType || "schedule_call",
      whatsapp_template: v?.whatsappTemplate || "meeting_confirmed",
      extraction_fields: [],
      quality_signals: [],
    };

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: prismaVertical,
          tenantContext,
        }),
      });

      if (res.ok) {
        window.location.href = targetPath;
      } else {
        // Fallback
        window.location.href = targetPath;
      }
    } catch (err) {
      console.error("[ONBOARDING] Failed to complete onboarding status:", err);
      window.location.href = targetPath;
    }
  };

  // Get vertical-specific projection text
  const getProjectionText = () => {
    if (!v) {
      return (
        <span>
          expect <strong style={{ color: "var(--gold)" }}>8–12 qualified leads</strong> this week.
        </span>
      );
    }
    switch (v.id) {
      case "interior":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>8–12 showroom bookings</strong> this week.
          </span>
        );
      case "real_estate":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>10–15 site visit bookings</strong> this week.
          </span>
        );
      case "construction":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>5–8 project consultation bookings</strong> this week.
          </span>
        );
      case "product":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>12–18 qualified product demos</strong> this week.
          </span>
        );
      case "finance":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>15–20 financial advisory bookings</strong> this week.
          </span>
        );
      case "healthcare":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>20–25 medical rep site visits</strong> scheduled this week.
          </span>
        );
      case "education":
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>18–24 active trial class bookings</strong> this week.
          </span>
        );
      default:
        return (
          <span>
            expect <strong style={{ color: "var(--gold)" }}>8–12 qualified leads</strong> this week.
          </span>
        );
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "32px 0" }} id="step-celebration">
      {/* Teal Circle Check Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--teal-muted)",
          border: "2px solid var(--teal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(29,158,117,0.15)",
        }}
      >
        <i className="ti ti-check" style={{ fontSize: 40, color: "var(--teal)", fontWeight: 700 }} />
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 700,
          color: "var(--txt)",
          marginBottom: 12,
          letterSpacing: -0.03,
        }}
      >
        Your AI agent is live.
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "var(--txt2)",
          maxWidth: 480,
          margin: "0 auto 40px",
          lineHeight: 1.6,
        }}
      >
        Congratulations! <strong>{data.agentName || "Your agent"}</strong> is configured with your B2B offerings
        and calendar rules. Based on similar campaigns, {getProjectionText()}
      </p>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          maxWidth: 440,
          margin: "0 auto 56px",
        }}
      >
        <button
          onClick={() => handleComplete("/admin/contacts")}
          disabled={finishing}
          className="btn btn-gold btn-lg"
          style={{ flex: 1.2, justifyContent: "center", height: 50, fontSize: 15 }}
        >
          {finishing ? "Launching..." : "Go to dashboard →"}
        </button>
        <button
          onClick={() => handleComplete("/admin/team")}
          disabled={finishing}
          className="btn btn-outline btn-lg"
          style={{ flex: 1, justifyContent: "center", height: 50, fontSize: 15 }}
        >
          Invite your team
        </button>
      </div>

      {/* Animated Stat Preview Counter */}
      <div
        style={{
          borderTop: "0.5px solid var(--border)",
          paddingTop: 40,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          maxWidth: 440,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "var(--txt)",
              fontFamily: "var(--font-display)",
              letterSpacing: -0.02,
              marginBottom: 4,
            }}
          >
            {callsCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Calls this week
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "var(--teal)",
              fontFamily: "var(--font-display)",
              letterSpacing: -0.02,
              marginBottom: 4,
            }}
          >
            {convCount}%
          </div>
          <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Conversion rate
          </div>
        </div>
      </div>
    </div>
  );
}
