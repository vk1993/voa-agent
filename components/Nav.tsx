"use client";

import React, { useState, useEffect } from "react";

interface NavProps {
  acc: string;
}

export function NavLink({ children }: { children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <span
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 14,
        color: h ? "var(--txt)" : "var(--txt2)",
        cursor: "pointer",
        transition: "color .2s",
      }}
    >
      {children}
    </span>
  );
}

interface BtnProps {
  acc: string;
  children: React.ReactNode;
  ghost?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
}

export function Btn({ acc, children, ghost = false, size = "md", onClick }: BtnProps) {
  const [h, setH] = useState(false);
  const p = size === "sm" ? "0 18px" : "0 24px";
  const height = size === "sm" ? 38 : 48;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        height,
        padding: p,
        borderRadius: 10,
        border: ghost ? "1px solid rgba(255,255,255,.15)" : "none",
        background: ghost ? "transparent" : acc,
        color: ghost ? "var(--txt)" : "#0F0F12",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-sans), sans-serif",
        transition: "all .2s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        opacity: h && !ghost ? 0.85 : 1,
        transform: h && !ghost ? "translateY(-1px)" : "none",
        boxShadow: h && !ghost ? `0 8px 24px ${acc}44` : "none",
        borderColor: h && ghost ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.15)",
      }}
    >
      {children}
    </button>
  );
}

export function Nav({ acc }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: scrolled ? "rgba(9,11,16,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.05)" : "none",
        transition: "all .3s ease",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
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
              flexShrink: 0,
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
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {["Skill Packs", "How It Works", "Pricing", "API Docs"].map((l) => (
            <NavLink key={l}>{l}</NavLink>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <NavLink>Sign in</NavLink>
          <Btn acc={acc} size="sm">
            Get started
          </Btn>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
