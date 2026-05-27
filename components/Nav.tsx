"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface NavProps {
  acc: string;
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 14.5,
        fontWeight: 500,
        color: h ? "var(--txt)" : "var(--txt2)",
        cursor: "pointer",
        transition: "color .25s ease",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {children}
    </Link>
  );
}

interface BtnProps {
  acc: string;
  children: React.ReactNode;
  ghost?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  href?: string;
  transitionTypes?: string[];
}

export function Btn({ acc, children, ghost = false, size = "md", onClick, href, transitionTypes }: BtnProps) {
  const [h, setH] = useState(false);
  const p = size === "sm" ? "0 18px" : "0 24px";
  const height = size === "sm" ? 38 : 46;

  const btnStyle: React.CSSProperties = {
    height,
    padding: p,
    borderRadius: 10,
    border: ghost ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
    background: ghost ? "rgba(255, 255, 255, 0.02)" : acc,
    color: ghost ? "var(--txt)" : "#090A0F",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans), sans-serif",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: h && !ghost ? 0.9 : 1,
    transform: h ? "translateY(-1px)" : "none",
    boxShadow: h && !ghost ? `0 10px 24px ${acc}33` : "none",
    borderColor: h && ghost ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.12)",
    backdropFilter: ghost ? "blur(8px)" : "none",
  };

  if (href) {
    return (
      <Link href={href} transitionTypes={transitionTypes} style={{ textDecoration: "none" }}>
        <button
          type="button"
          onMouseEnter={() => setH(true)}
          onMouseLeave={() => setH(false)}
          style={btnStyle}
        >
          {children}
        </button>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={btnStyle}
    >
      {children}
    </button>
  );
}

export function Nav({ acc }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: scrolled ? "rgba(7, 8, 11, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid transparent",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        viewTransitionName: "site-header", // Anchored static site header across transitions
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 70,
        }}
      >
        {/* Brand Logo with home link */}
        <Link
          href="/"
          transitionTypes={["nav-back"]}
          style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}
        >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${acc} 0%, rgba(255,255,255,0.1) 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#07080B",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: 16,
                flexShrink: 0,
                boxShadow: scrolled ? `0 4px 12px ${acc}22` : "none",
              }}
            >
              V
            </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-.02em",
              color: "var(--txt)",
            }}
          >
            VOXA
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <NavLink href="/#skillpacks">Skill Packs</NavLink>
          <NavLink href="/#howitworks">How It Works</NavLink>
          <NavLink href="/#pricing">Pricing</NavLink>
          <NavLink href="/admin/contacts">Admin Contacts</NavLink>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <NavLink href="/login">Sign in</NavLink>
          <Btn acc={acc} size="sm" href="/login" transitionTypes={["nav-forward"]}>
            Get started
          </Btn>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
