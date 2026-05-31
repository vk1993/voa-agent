"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Nav({ acc = "#C9A14A" }: { acc?: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "all 0.3s ease",
      backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
      background: scrolled ? "rgba(7,8,11,0.85)" : "transparent",
      borderBottom: scrolled ? "0.5px solid rgba(255,255,255,0.06)" : "none",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64 }}>
        {/* Logo mark */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: acc, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#0F0F14",
            fontFamily: "var(--font-display)" }}>V</div>
          <span style={{ fontSize: 17, fontWeight: 700,
            fontFamily: "var(--font-display)", color: "#F3F4F6",
            letterSpacing: -0.02 }}>VOXA</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 36, fontSize: 14, fontWeight: 500 }}>
          {[["#verticals","Industries"],["#how-it-works","How it works"],
            ["#pricing","Pricing"]].map(([href, label]) => (
            <a key={label} href={href} style={{ color: "rgba(255,255,255,0.6)",
              textDecoration: "none", transition: "color 0.15s" }}
              onMouseOver={e => (e.currentTarget.style.color = "#F3F4F6")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>{label}</a>
          ))}
        </div>

        {/* CTA group */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 500,
            color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "8px 14px" }}>
            Sign in
          </Link>
          <Link href="/signup" style={{ fontSize: 13, fontWeight: 600,
            background: acc, color: "#0F0F14",
            padding: "9px 20px", borderRadius: 8, textDecoration: "none",
            transition: "opacity 0.15s" }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}>
            Start free trial
          </Link>
        </div>
      </div>
    </nav>
  );
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

export function Btn({ acc, children, ghost = false, size = "md", onClick, href }: any) {
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
      <Link href={href} style={{ textDecoration: "none" }}>
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
