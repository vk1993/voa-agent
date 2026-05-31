"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";

function AcceptInviteForm() {
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams ? searchParams.get("token") : "";
    if (t) setToken(t);
    // Mobile deeplink detection
    const mobile = /iPhone|Android|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          otpCode: otp || undefined,
          password,
          confirmPassword: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Invalid or expired link.");
        return;
      }
      router.push(data.redirectTo || "/sp/pipeline");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="You're invited."
      subtitle="Set your password to join your team on VOXA."
    >
      {/* Mobile deeplink notice */}
      {isMobile && !token && (
        <div
          style={{
            background: "#FFF7ED",
            border: "0.5px solid #FED7AA",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#C2410C",
          }}
        >
          <strong>On mobile?</strong> If the invite link opened in the wrong browser,
          enter the 6-digit code from your email below instead.
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "0.5px solid #FECACA",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Show OTP input on mobile or if no token */}
        {(!token || isMobile) && (
          <div>
            <label className="label">
              {isMobile ? "6-digit code from your email" : "Invite code (optional)"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="input"
              placeholder="6-digit code"
              style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
            />
          </div>
        )}
        {token && !isMobile && (
          <div
            style={{
              background: "#F0FDF4",
              border: "0.5px solid #BBF7D0",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              fontSize: 13,
              color: "#15803D",
            }}
          >
            ✓ Invite link verified. Set your password below.
          </div>
        )}
        <div>
          <label className="label">Set password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Repeat password"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-gold"
          style={{
            width: "100%",
            justifyContent: "center",
            height: 44,
            marginTop: 4,
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading || (!token && otp.length < 6)}
        >
          {loading ? "Setting up your account…" : "Create account"}
        </button>
      </form>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 13,
          color: "#888582",
        }}
      >
        Already have an account?{" "}
        <a
          href="/login"
          style={{ color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}
        >
          Sign in
        </a>
      </div>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0F0F12",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--txt2)",
          }}
        >
          Validating platform invitation stage...
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
