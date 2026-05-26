"use client";

import React from "react";
import { NavLink } from "./Nav";

interface Column {
  t: string;
  l: string[];
}

interface FooterProps {
  acc: string;
}

export function Footer({ acc }: FooterProps) {
  const cols: Column[] = [
    { t: "Product", l: ["Features", "Pricing", "Skill Packs", "Changelog"] },
    { t: "Developers", l: ["API Docs", "SDKs", "Status page", "GitHub"] },
    { t: "Company", l: ["About", "Careers", "Blog", "Contact"] },
  ];

  return (
    <footer
      style={{
        background: "#0A0C12",
        borderTop: "1px solid rgba(255,255,255,.04)",
        padding: "64px 0 32px",
      }}
    >
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 44, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: acc,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0F0F12",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 17,
                }}
              >
                V
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: ".06em",
                }}
              >
                VOXA
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.7, maxWidth: 250, marginBottom: 20 }}>
              The AI sales agent that speaks every industry's language.
            </p>
            <div style={{ display: "flex", gap: 9 }}>
              {["tw", "li", "gh", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "var(--txt2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--txt3)",
                  letterSpacing: ".1em",
                  marginBottom: 16,
                  textTransform: "uppercase",
                }}
              >
                {c.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {c.l.map((l) => (
                  <NavLink key={l}>
                    <span style={{ fontSize: 13 }}>{l}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,.04)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt3)" }}>
            © 2026 VOXA Technologies
          </span>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {["Privacy", "Terms", "SOC 2 Type II", "GDPR", "TRAI Compliant"].map((i) => (
              <a
                key={i}
                href="#"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt3)", textDecoration: "none" }}
              >
                {i}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
