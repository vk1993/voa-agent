"use client";

import React, { useState, useEffect } from "react";
import { OnboardingData } from "../page";
import { VERTICALS } from "@/lib/domain-config";

interface StepTestCallProps {
  data: OnboardingData;
  onNext: (stepData?: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepTestCall({ data, onNext, onBack }: StepTestCallProps) {
  const [phone, setPhone] = useState("");
  const [callState, setCallState] = useState<"idle" | "calling" | "done">("idle");
  const [rating, setRating] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  useEffect(() => {
    let interval: any;
    if (callState === "calling") {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const triggerCall = async () => {
    if (!phone) return;
    setCallState("calling");

    const payload = {
      phone,
      persona: {
        agentName: data.agentName,
        companyName: data.companyName,
        vertical: v?.label || "General",
        language: data.language,
        tone: data.tone,
      },
    };

    try {
      await fetch("/api/onboarding/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Test call trigger failed:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }} id="step-test-call">
      {callState === "idle" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 16 }}>☎</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--txt)",
              marginBottom: 12,
              letterSpacing: -0.02,
            }}
          >
            Hear {data.agentName || "your agent"} — right now.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--txt2)",
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            Enter your mobile number. We'll call you in 10 seconds.
            <br />
            {v ? (
              <span>
                We'll call you as <strong>{data.agentName}</strong> to schedule a <strong>{v.meetingLabel.toLowerCase()}</strong>.
              </span>
            ) : (
              <span>This is exactly what your customers will hear on the line.</span>
            )}
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              maxWidth: 420,
              margin: "0 auto 24px",
            }}
          >
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+91 98765 43210"
              style={{ flex: 1, textAlign: "center", fontSize: 16 }}
              required
            />
            <button
              onClick={triggerCall}
              disabled={!phone || phone.length < 10}
              className="btn btn-gold"
              style={{
                padding: "0 24px",
                fontSize: 16,
                flexShrink: 0,
                opacity: !phone || phone.length < 10 ? 0.6 : 1,
              }}
            >
              Call me
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <button
              onClick={() => onNext()}
              style={{
                background: "none",
                border: "none",
                color: "var(--txt3)",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Skip this step →
            </button>
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                color: "var(--txt3)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ← Back to contacts
            </button>
          </div>
        </>
      )}

      {callState === "calling" && (
        <>
          <div
            style={{
              fontSize: 56,
              marginBottom: 16,
              animation: "pulse-dot 1.5s infinite",
            }}
          >
            📱
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--txt)",
              marginBottom: 12,
            }}
          >
            Calling {phone}…
          </h2>
          <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 8 }}>
            Pick up and have a conversation. Your AI agent is fully live.
          </p>
          <span className="badge badge-green" style={{ display: "inline-flex", marginBottom: 20 }}>
            ● Connected to VOXA Core Voice Engine
          </span>

          {/* Dynamic duration counter */}
          <div
            style={{
              fontSize: 48,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--gold)",
              margin: "24px 0",
            }}
            id="call-timer"
          >
            {formatTime(seconds)}
          </div>

          <button
            onClick={() => setCallState("done")}
            className="btn btn-outline"
            style={{
              border: "1px solid var(--red)",
              color: "var(--red)",
              background: "var(--red-bg)",
              margin: "0 auto",
            }}
          >
            Call ended — rate it
          </button>
        </>
      )}

      {callState === "done" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--txt)",
              marginBottom: 12,
            }}
          >
            How did it sound?
          </h2>
          <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
            Your feedback helps calibrate speech prosody and latencies.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginBottom: 40,
              flexWrap: "wrap",
            }}
          >
            {["🤩 Amazing", "👍 Good", "😐 Okay", "👎 Needs work"].map((r, i) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(i)}
                className="btn btn-outline"
                style={{
                  border: rating === i ? "2.5px solid var(--gold)" : "1px solid var(--border-strong)",
                  color: rating === i ? "var(--gold)" : "var(--txt2)",
                  fontWeight: rating === i ? 600 : 500,
                  transform: rating === i ? "scale(1.05)" : "none",
                  transition: "all 0.15s ease",
                  background: rating === i ? "var(--gold-muted)" : "var(--bg-card)",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, maxWidth: 300, margin: "0 auto" }}>
            <button
              onClick={() => setCallState("idle")}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Retry Call
            </button>
            <button
              onClick={() => onNext({ testCallRating: rating })}
              className="btn btn-gold"
              style={{ flex: 1, justifyContent: "center" }}
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
