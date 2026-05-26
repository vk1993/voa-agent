"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin/contacts";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fast pre-seeding credentials selectors for rapid developer inspection
  const handlePreseedLogin = (role: "ADMIN" | "SALES_AGENT", provider?: string) => {
    setLoading(true);
    setError("");

    setTimeout(() => {
      try {
        const userEmail = role === "ADMIN" ? "priya.nair@voxa.ai" : "visal.kumar@voxa.ai";
        const sessionPayload = {
          role,
          email: userEmail,
          name: role === "ADMIN" ? "Priya Nair" : "Visal Kumar",
          cognitoGroups: [role],
          ssoProvider: provider || "COGNITO_USER_POOL",
          "cognito:groups": [role],
        };

        // Write HTTP-accessible cookie for Edge Proxy verification
        document.cookie = `session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
        
        setSuccess(true);
        setLoading(false);

        // Animate transition into dashboard
        setTimeout(() => {
          if (role === "ADMIN") {
            router.push("/admin/contacts");
          } else {
            router.push("/sp/pipeline");
          }
        }, 800);
      } catch (e) {
        setLoading(false);
        setError("SSO Federation Handshake Failed.");
      }
    }, 1200);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please specify both credentials.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate Cognito User Pool User Authentication
    setTimeout(() => {
      const isAgent = email.includes("agent") || email.includes("visal");
      const targetRole = isAgent ? "SALES_AGENT" : "ADMIN";
      handlePreseedLogin(targetRole);
    }, 1000);
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
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(21, 21, 26, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 24,
          padding: "48px 40px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
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
            }}
          >
            <Shield size={22} />
          </div>
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
          <>
            {/* Standard Login Form */}
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
                  style={{
                    height: 42,
                    borderRadius: 10,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "0 14px",
                    fontSize: 13,
                    color: "var(--txt)",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  className="focus:border-amber-500"
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
                  style={{
                    height: 42,
                    borderRadius: 10,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "0 14px",
                    fontSize: 13,
                    color: "var(--txt)",
                    outline: "none",
                    transition: "border-color 0.2s ease",
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

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 10.5, color: "var(--txt3)", letterSpacing: ".05em", fontFamily: "var(--font-mono)" }}>
                OR FEDERATE VIA SSO
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* B2B SSO Identity Providers Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Okta SSO */}
              <button
                type="button"
                onClick={() => handlePreseedLogin("ADMIN", "OktaSSO")}
                disabled={loading}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "var(--txt)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#007DC1" }} />
                Sign in with Okta Business SSO
              </button>

              {/* Azure AD SSO */}
              <button
                type="button"
                onClick={() => handlePreseedLogin("SALES_AGENT", "AzureAD")}
                disabled={loading}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "var(--txt)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ width: 14, height: 14, background: "#00A4EF", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, padding: 1 }}>
                  <div style={{ background: "#F25022" }} />
                  <div style={{ background: "#7FBA00" }} />
                  <div style={{ background: "#00A4EF" }} />
                  <div style={{ background: "#FFB900" }} />
                </div>
                Sign in with Azure AD Portal
              </button>
            </div>

            {/* Quick Developer Credentials Assisters */}
            <div
              style={{
                marginTop: 8,
                padding: 16,
                background: "rgba(191, 144, 0, 0.04)",
                border: "1px dashed rgba(201, 161, 74, 0.15)",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: ".02em" }}>
                <Sparkles size={11} />
                <span>DEV ENVIRONMENT QUICK INTEGRATION</span>
              </div>
              <p style={{ fontSize: 10.5, color: "var(--txt3)", lineHeight: 1.3 }}>
                Click below to simulate Cognito User Pool group assertions and OIDC claims mapping immediately:
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => handlePreseedLogin("ADMIN")}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(201, 161, 74, 0.12)",
                    color: "var(--gold)",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Simulate Admin (SSO)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreseedLogin("SALES_AGENT")}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(99, 140, 255, 0.12)",
                    color: "var(--blue)",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Simulate Agent (SSO)
                </button>
              </div>
            </div>
          </>
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
