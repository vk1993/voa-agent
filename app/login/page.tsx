"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/cognito-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }
      router.push(
        data.role === "ADMIN" || data.role === "SUPER_ADMIN"
          ? "/admin/contacts"
          : "/sp/pipeline"
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back." subtitle="Sign in to your VOXA dashboard.">
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
        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@company.com"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            height: 44,
            marginTop: 4,
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Dev quick-fill */}
      {process.env.NODE_ENV !== "production" && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setEmail("admin@voxa.ai");
              setPassword("voxa-dev-2026");
            }}
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              border: "0.5px solid #E5E3DC",
              borderRadius: 6,
              background: "#F6F5F1",
              color: "#888582",
            }}
          >
            Fill Admin
          </button>
          <button
            onClick={() => {
              setEmail("agent@voxa.ai");
              setPassword("voxa-dev-2026");
            }}
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              border: "0.5px solid #E5E3DC",
              borderRadius: 6,
              background: "#F6F5F1",
              color: "#888582",
            }}
          >
            Fill Agent
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 14,
          color: "#888582",
        }}
      >
        Don't have an account?{" "}
        <Link
          href="/signup"
          style={{ color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}
        >
          Start free trial
        </Link>
      </div>
    </AuthLayout>
  );
}
