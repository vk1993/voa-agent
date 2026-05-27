"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin/contacts";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please specify both credentials.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/cognito-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setLoading(false);

        // Animate transition into dashboard based on role
        setTimeout(() => {
          if (data.role === "ADMIN") {
            router.push(callbackUrl || "/admin/contacts");
          } else {
            router.push(callbackUrl || "/sp/pipeline");
          }
        }, 800);
      } else {
        setLoading(false);
        setError(data.message || data.error || "Authentication handshake failed.");
      }
    } catch (e) {
      setLoading(false);
      setError("Network connection timed out.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0F12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Decorative Blur Background Orbs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,161,74,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,140,255,0.05) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Main Login Frame */}
      <div
        className="glass-panel stagger-item"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--gold) 0%, #a87e2f 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F0F12",
                marginBottom: 16,
                boxShadow: "0 8px 24px rgba(201,161,74,0.25)",
                cursor: "pointer",
              }}
            >
              <Shield size={22} />
            </div>
          </Link>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-.03em",
              fontFamily: "var(--font-sans)",
              color: "var(--txt)",
            }}
          >
            VOXA Enterprise SSO
          </h1>
          <p style={{ fontSize: 13, color: "var(--txt2)", marginTop: 6, lineHeight: 1.4 }}>
            Multi-Tenant portal gateway protected by AWS Cognito & Okta SAML Federation.
          </p>
        </div>

        {/* Success Handshake State */}
        {success ? (
          <div
            style={{
              padding: "40px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div style={{ color: "var(--gold)", animation: "pulse 1.5s infinite" }}>
              <CheckCircle2 size={48} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)" }}>OIDC Handshake Completed</span>
              <span style={{ fontSize: 12, color: "var(--txt3)" }}>Redirecting to dashboard...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStandardSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && (
              <div
                style={{
                  background: "rgba(232, 93, 93, 0.08)",
                  border: "1px solid rgba(232, 93, 93, 0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12.5,
                  color: "#E85D5D",
                }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                BUSINESS EMAIL
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="glass-input"
                style={{
                  height: 42,
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  PASSWORD
                </label>
                <a href="#forgot" style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="glass-input"
                style={{
                  height: 42,
                  fontSize: 13,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 10,
                background: "var(--gold)",
                color: "#0F0F12",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
                boxShadow: "0 4px 14px rgba(201,161,74,0.15)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Authenticating Cognito pool..." : "Sign In with Cognito"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0F0F12", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--txt2)" }}>
        Loading SSO Portals...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
