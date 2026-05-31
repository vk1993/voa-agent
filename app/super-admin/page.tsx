"use client";
import { useState, useEffect } from "react";

interface Org {
  id: string;
  name: string;
  slug: string;
  status: string;
  vertical: string;
  onboardingComplete: boolean;
  plan: string;
  createdAt: string;
  _count: { users: number };
}

const VERTICALS = [
  "INTERIOR_DESIGN",
  "REAL_ESTATE",
  "CONSTRUCTION",
  "PRODUCT_SALES",
  "FINANCIAL_SERVICES",
  "HEALTHCARE",
  "EDUCATION",
  "CUSTOM",
  "GENERIC",
];

function StatusBadge({ value, trueLabel = "Active", falseLabel = "Inactive", trueColor = "teal", falseColor = "red" }: {
  value: boolean | string;
  trueLabel?: string;
  falseLabel?: string;
  trueColor?: string;
  falseColor?: string;
}) {
  const isPositive = value === true || value === "ACTIVE" || value === "Complete";
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: isPositive ? "rgba(20,184,166,0.12)" : "rgba(239,68,68,0.1)",
      color: isPositive ? "#14B8A6" : "#EF4444",
      border: `0.5px solid ${isPositive ? "rgba(20,184,166,0.25)" : "rgba(239,68,68,0.2)"}`,
    }}>
      {isPositive ? trueLabel : falseLabel}
    </span>
  );
}

function OnboardBadge({ complete }: { complete: boolean }) {
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: complete ? "rgba(20,184,166,0.12)" : "rgba(245,158,11,0.1)",
      color: complete ? "#14B8A6" : "#F59E0B",
      border: `0.5px solid ${complete ? "rgba(20,184,166,0.25)" : "rgba(245,158,11,0.25)"}`,
    }}>
      {complete ? "Complete" : "Pending"}
    </span>
  );
}

export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ companyName: "", adminEmail: "", vertical: "CUSTOM" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrgs = () =>
    fetch("/api/super-admin/orgs")
      .then((r) => r.json())
      .then((d) => setOrgs(d.tenants || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchOrgs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/super-admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to provision organization.");
        return;
      }
      setSuccess(`✓ ${data.message}`);
      setForm({ companyName: "", adminEmail: "", vertical: "CUSTOM" });
      fetchOrgs();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Top nav bar */}
      <header style={{
        height: 56,
        borderBottom: "0.5px solid var(--bdr)",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 12,
        background: "rgba(15,15,20,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          width: 28,
          height: 28,
          background: "var(--gold)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#0F0F14",
        }}>V</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>VOXA</span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--gold)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginLeft: 4,
          padding: "2px 8px",
          background: "rgba(201,161,74,0.1)",
          borderRadius: 20,
          border: "0.5px solid rgba(201,161,74,0.25)",
        }}>Super Admin</span>
      </header>

      <main style={{ padding: "40px 48px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--txt)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>Organization Management</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 6, margin: "6px 0 0" }}>
            Provision new organizations and oversee all tenants across the VOXA platform.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 28, alignItems: "start" }}>
          {/* ── Provision form ── */}
          <div className="glass-panel" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", margin: "0 0 20px" }}>
              Provision New Organization
            </h2>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "0.5px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#EF4444",
                lineHeight: 1.5,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                background: "rgba(20,184,166,0.08)",
                border: "0.5px solid rgba(20,184,166,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#14B8A6",
                lineHeight: 1.5,
              }}>{success}</div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--txt2)",
                  display: "block",
                  marginBottom: 7,
                  letterSpacing: "0.02em",
                }}>Company name</label>
                <input
                  id="sa-company-name"
                  className="glass-input"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Prestige Interiors"
                  required
                  style={{ width: "100%", height: 42, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--txt2)",
                  display: "block",
                  marginBottom: 7,
                }}>Admin email</label>
                <input
                  id="sa-admin-email"
                  className="glass-input"
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@company.com"
                  required
                  style={{ width: "100%", height: 42, boxSizing: "border-box" }}
                />
                <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 5, lineHeight: 1.5 }}>
                  Magic link + 6-digit backup code will be sent to this address.
                </p>
              </div>

              <div>
                <label style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--txt2)",
                  display: "block",
                  marginBottom: 7,
                }}>Industry vertical</label>
                <select
                  id="sa-vertical"
                  className="glass-input"
                  value={form.vertical}
                  onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))}
                  style={{ width: "100%", height: 42, boxSizing: "border-box" }}
                >
                  {VERTICALS.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="sa-provision-btn"
                type="submit"
                disabled={creating}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  background: creating ? "rgba(201,161,74,0.5)" : "var(--gold)",
                  color: "#0F0F14",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: creating ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {creating ? (
                  <>
                    <span style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(15,15,20,0.3)",
                      borderTopColor: "#0F0F14",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    Provisioning…
                  </>
                ) : (
                  "Provision organization →"
                )}
              </button>
            </form>
          </div>

          {/* ── Org list ── */}
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{
              padding: "18px 24px",
              borderBottom: "0.5px solid var(--bdr)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)", margin: 0 }}>
                All Organizations
              </h2>
              <span style={{
                fontSize: 12,
                color: "var(--txt3)",
                background: "var(--surface)",
                padding: "2px 10px",
                borderRadius: 20,
                border: "0.5px solid var(--bdr)",
              }}>{orgs.length} total</span>
            </div>

            {loading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>
                Loading organizations…
              </div>
            ) : orgs.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>
                No organizations provisioned yet. Use the form to create the first one.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Organization", "Slug", "Vertical", "Plan", "Status", "Onboarded", "Users", "Created"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left",
                          padding: "10px 16px",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--txt3)",
                          borderBottom: "0.5px solid var(--bdr)",
                          whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((org, i) => (
                      <tr key={org.id} style={{
                        transition: "background 0.1s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{
                          padding: "13px 16px",
                          color: "var(--txt)",
                          fontWeight: 500,
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                          whiteSpace: "nowrap",
                        }}>{org.name}</td>
                        <td style={{
                          padding: "13px 16px",
                          color: "var(--txt3)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                        }}>{org.slug}</td>
                        <td style={{
                          padding: "13px 16px",
                          color: "var(--txt2)",
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                          whiteSpace: "nowrap",
                        }}>{org.vertical.replace(/_/g, " ")}</td>
                        <td style={{
                          padding: "13px 16px",
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                        }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--txt2)",
                            fontFamily: "var(--font-mono)",
                          }}>{org.plan}</span>
                        </td>
                        <td style={{
                          padding: "13px 16px",
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                        }}>
                          <StatusBadge
                            value={org.status === "ACTIVE"}
                            trueLabel="Active"
                            falseLabel={org.status}
                          />
                        </td>
                        <td style={{
                          padding: "13px 16px",
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                        }}>
                          <OnboardBadge complete={org.onboardingComplete} />
                        </td>
                        <td style={{
                          padding: "13px 16px",
                          color: "var(--txt2)",
                          textAlign: "center",
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                        }}>{org._count.users}</td>
                        <td style={{
                          padding: "13px 16px",
                          color: "var(--txt3)",
                          fontSize: 12,
                          borderBottom: i < orgs.length - 1 ? "0.5px solid var(--bdr)" : "none",
                          whiteSpace: "nowrap",
                        }}>
                          {new Date(org.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
