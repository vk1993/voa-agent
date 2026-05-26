"use client";

import React from "react";
import F from "./FadeIn";

interface Step {
  n: string;
  lbl: string;
  col: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    lbl: "TRIGGER",
    col: "#C9A14A",
    desc: "Upload a CSV or sync your CRM. VOXA queues contacts, checks DND compliance, and schedules the campaign.",
  },
  {
    n: "02",
    lbl: "CALL",
    col: "#638CFF",
    desc: "AI dials the lead. Deepgram STT + Claude LLM + ElevenLabs TTS run in parallel. Sub-800ms response time.",
  },
  {
    n: "03",
    lbl: "QUALIFY",
    col: "#14B8A6",
    desc: "Agent asks the right questions for your domain. RAG skill pack retrieves real product data mid-conversation.",
  },
  {
    n: "04",
    lbl: "BOOK",
    col: "#22C55E",
    desc: "Appointment booked live on the call. Calendly integration. Salesperson assigned by nearest location.",
  },
  {
    n: "05",
    lbl: "FOLLOW UP",
    col: "#C9A14A",
    desc: "WhatsApp sent in <60 seconds: portfolio images, showroom link, personalized voucher code.",
  },
];

interface HowItWorksProps {
  acc: string;
}

export function HowItWorks({ acc }: HowItWorksProps) {
  return (
    <section style={{ padding: "100px 0", background: "rgba(0,0,0,.12)" }}>
      <div className="wrap">
        <F>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-.03em",
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              From contact list to booked appointment.
            </h2>
            <p style={{ fontSize: 16, color: "var(--txt2)", lineHeight: 1.72 }}>
              Five steps. Fully automated. Under 800ms per response.
            </p>
          </div>
        </F>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: "absolute",
              top: 35,
              left: "10%",
              right: "10%",
              height: 1,
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,.08) 20%,rgba(255,255,255,.08) 80%,transparent)",
              pointerEvents: "none",
            }}
          />
          {STEPS.map((s, i) => (
            <F key={i} delay={i * 70} style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "0 8px",
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginBottom: 18,
                    background: `color-mix(in srgb, ${s.col} 10%, transparent)`,
                    border: `1.5px solid color-mix(in srgb, ${s.col} 32%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: s.col,
                    }}
                  >
                    {s.n}
                  </span>
                  {i < 4 && (
                    <div
                      style={{
                        position: "absolute",
                        right: -20,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(255,255,255,.18)",
                        fontSize: 13,
                        pointerEvents: "none",
                      }}
                    >
                      →
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: s.col,
                    letterSpacing: ".1em",
                    marginBottom: 10,
                  }}
                >
                  {s.lbl}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--txt2)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </F>
          ))}
        </div>
        <F delay={350}>
          <div
            style={{
              textAlign: "center",
              marginTop: 50,
              padding: "18px 28px",
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.05)",
              borderRadius: 12,
              maxWidth: 640,
              margin: "50px auto 0",
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "var(--txt2)",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              Then it scores the call, tags the lead, and updates your CRM — all before you hang up.
            </p>
          </div>
        </F>
      </div>
    </section>
  );
}

export default HowItWorks;
