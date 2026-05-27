"use client";

import React from "react";
import Link from "next/link";
import { NavLink } from "./Nav";

interface Column {
  t: string;
  l: { name: string; href: string }[];
}

interface FooterProps {
  acc: string;
}

export function Footer({ acc }: FooterProps) {
  const cols: Column[] = [
    {
      t: "Product Options",
      l: [
        { name: "SaaS Features", href: "/#howitworks" },
        { name: "Plan Pricing", href: "/#pricing" },
        { name: "Skill Packs Catalog", href: "/#skillpacks" },
        { name: "Changelog v9", href: "#" },
      ],
    },
    {
      t: "Developer Tools",
      l: [
        { name: "Simulate SSO", href: "/login" },
        { name: "Admin Dashboard", href: "/admin/contacts" },
        { name: "Audit Logs Endpoint", href: "/admin/settings/api-keys" },
        { name: "Sales Pipeline", href: "/sp/pipeline" },
      ],
    },
    {
      t: "Company Hub",
      l: [
        { name: "About VOXA", href: "#" },
        { name: "Objection RAGs", href: "#" },
        { name: "Outbound Compliance", href: "#" },
        { name: "Contact Hub", href: "#" },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: "rgba(7, 8, 11, 0.95)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "70px 0 36px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 48 }}>
          <div style={{ minWidth: 240 }}>
            {/* Branding Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: acc,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#07080B",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                V
              </div>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: "-.02em",
                  color: "var(--txt)",
                }}
              >
                VOXA AI
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.65, maxWidth: 280, marginBottom: 20 }}>
              The enterprise-grade AI outbound voice pipeline tailored for high-ticket industries.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["𝕏", "in", "gh", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "var(--txt2)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = acc;
                    e.currentTarget.style.color = "var(--txt)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
                    e.currentTarget.style.color = "var(--txt2)";
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
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--txt3)",
                  letterSpacing: ".12em",
                  marginBottom: 18,
                  textTransform: "uppercase",
                }}
              >
                {c.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {c.l.map((link) => (
                  <NavLink key={link.name} href={link.href}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{link.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Sub-row */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,.05)",
            paddingTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt3)" }}>
            © 2026 VOXA Technologies Corp. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Use", "SOC 2 Compliance", "GDPR Guard", "TRAI Registered"].map((i) => (
              <a
                key={i}
                href="#"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--txt3)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = acc)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txt3)")}
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
