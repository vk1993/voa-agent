"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

const INDUSTRIES = [
  { value: "INTERIOR_DESIGN", label: "Interior Design & Contracting" },
  { value: "REAL_ESTATE", label: "Real Estate & Housing Projects" },
  { value: "CONSTRUCTION", label: "Construction & Development" },
  { value: "PRODUCT_SALES", label: "B2B SaaS & Product Sales" },
  { value: "FINANCIAL_SERVICES", label: "Financial & Advisory Services" },
  { value: "HEALTHCARE", label: "Healthcare & Medical Products" },
  { value: "EDUCATION", label: "Education & Coaching Centers" },
  { value: "CUSTOM", label: "Custom / Something Else" },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vertical, setVertical] = useState("INTERIOR_DESIGN");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !vertical) {
      setError("Please fill in company name and select your industry.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, password, vertical }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setLoading(false);

        // Transition to onboarding wizard
        setTimeout(() => {
          router.push("/onboarding");
        }, 1500);
      } else {
        setLoading(false);
        setError(data.message || data.error || "Signup failed.");
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <AuthLayout title="Start your trial." subtitle={step === 1 ? "Step 1 of 2: Create your admin credentials." : "Step 2 of 2: Configure your workspace."}>
      {success ? (
        <div
          style={{
            background: "#F0FDF4",
            border: "0.5px solid #BBF7D0",
            borderRadius: "var(--radius)",
            padding: "16px",
            fontSize: 14,
            color: "#15803D",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          <strong>Account Created!</strong>
          <div style={{ fontSize: 13, marginTop: 8, color: "#166534" }}>
            Provisioning tenant secure resources and launching your B2B setup wizard...
          </div>
        </div>
      ) : (
        <>
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

          {step === 1 ? (
            <form
              onSubmit={handleNextStep}
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
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  disabled={loading}
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
                }}
              >
                Continue →
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label className="label">Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input"
                  placeholder="e.g. Apex Sales Corp"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">Primary Industry</label>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className="input"
                  style={{ padding: "0 10px", appearance: "auto" }}
                  disabled={loading}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: "center", height: 44 }}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{
                    flex: 1.5,
                    justifyContent: "center",
                    height: 44,
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>
            </form>
          )}

          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              fontSize: 14,
              color: "#888582",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}
            >
              Sign in
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
