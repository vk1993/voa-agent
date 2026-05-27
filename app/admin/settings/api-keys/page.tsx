"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Key,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  BarChart3,
  ShieldAlert,
  Terminal,
  Activity,
  History,
} from "lucide-react";

interface ApiKeyData {
  id: string;
  name: string;
  key: string;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

interface AuditLogData {
  tenant_id: string;
  timestamp: string;
  user_id: string;
  action: string;
  resource: string;
  previous_state: string;
  new_state: string;
}

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingAudits, setLoadingAudits] = useState(true);
  
  // Generating modal form state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Copy feedback state
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Action status message
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.apiKeys || []);
      }
    } catch (e) {
      console.error("Failed to load keys:", e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoadingAudits(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchAudits();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setGenerating(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewlyGeneratedKey(data.rawKey);
        setNewKeyName("");
        fetchKeys();
        fetchAudits(); // reload audits for post event
      } else {
        setErrorMessage(data.error || "Failed to generate key");
      }
    } catch (e) {
      setErrorMessage("Network connection timed out.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? CRM integrations using this token will fail immediately.")) return;

    try {
      const res = await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, action: "REVOKE" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("API key successfully revoked.");
        setTimeout(() => setStatusMessage(""), 3000);
        fetchKeys();
        fetchAudits();
      }
    } catch (e) {
      console.error("Failed to revoke key:", e);
    }
  };

  const handleHardDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently delete this API Key from history?")) return;

    try {
      const res = await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, action: "DELETE" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("API key deleted successfully.");
        setTimeout(() => setStatusMessage(""), 3000);
        fetchKeys();
        fetchAudits();
      }
    } catch (e) {
      console.error("Failed to delete key:", e);
    }
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Developer Integrations</h1>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Provision secure CRM access tokens, throttle external triggers, and inspect the immutable security audit trail.
            </p>
          </div>
          
          <button
            onClick={() => {
              setNewlyGeneratedKey(null);
              setShowGenerateModal(true);
            }}
            style={{
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              background: "var(--gold)",
              color: "#0F0F12",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(201,161,74,0.15)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Plus size={16} />
            <span>Generate New Key</span>
          </button>
        </div>

        {/* System Settings & Usage Plan Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          
          {/* Card A: Rate Limits */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(201, 161, 74, 0.08)", color: "var(--gold)" }}>
              <Cpu size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>AWS USAGE PLAN RATE</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span>10 RPS</span>
                <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>/ 20 Burst Limit</span>
              </div>
            </div>
          </div>

          {/* Card B: Monthly Quota */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(99, 140, 255, 0.08)", color: "var(--blue)" }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>MONTHLY API QUOTA</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span>10,000</span>
                <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>calls per tenant</span>
              </div>
            </div>
          </div>

          {/* Card C: Identity Security */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(34, 197, 94, 0.08)", color: "#22C55E" }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>COGNITO SECURITY MAPPING</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ color: "#22C55E" }}>SSO active</span>
                <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 500 }}>(Okta Sync)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Action Messages */}
        {statusMessage && (
          <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 10, padding: "12px 20px", fontSize: 13.5, color: "#22C55E" }}>
            {statusMessage}
          </div>
        )}

        {/* Main Grid: Left column (Keys Datatable) & Right column (Immutable Auditing logs) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr", gap: 30, alignItems: "start" }}>
          
          {/* API KEYS MANAGEMENT BOX */}
          <div
            className="glass-panel"
            style={{
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Key size={18} style={{ color: "var(--gold)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Client API Access Keys</h2>
              </div>
              <button
                onClick={fetchKeys}
                style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={12} className={loadingKeys ? "animate-spin" : ""} />
                <span style={{ fontSize: 11 }}>Reload</span>
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {loadingKeys ? (
                <div style={{ color: "var(--txt3)", textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>Fetching active keys from SQLite database...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {keys.map((k) => {
                    const maskedKey = `${k.key.slice(0, 14)}...${"•".repeat(8)}`;
                    const isRevoked = k.status === "REVOKED";

                    return (
                      <div
                        key={k.id}
                        style={{
                          background: "rgba(0,0,0,0.18)",
                          border: `1px solid ${isRevoked ? "rgba(232, 93, 93, 0.08)" : "rgba(255, 255, 255, 0.04)"}`,
                          borderRadius: 12,
                          padding: 16,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          opacity: isRevoked ? 0.6 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--txt)" }}>{k.name}</span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 4,
                                color: isRevoked ? "#E85D5D" : "var(--green)",
                                background: isRevoked ? "rgba(232, 93, 93, 0.08)" : "rgba(34, 197, 94, 0.08)",
                              }}
                            >
                              {k.status}
                            </span>
                          </div>
                          
                          {/* Masked Key Display with Copy Icon */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>{maskedKey}</code>
                            {!isRevoked && (
                              <button
                                onClick={() => handleCopy(k.key, k.id)}
                                style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", display: "flex", padding: 2 }}
                              >
                                {copiedKeyId === k.id ? <Check size={12} style={{ color: "var(--green)" }} /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                          
                          <span style={{ fontSize: 10, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                            Generated: {new Date(k.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                          {!isRevoked ? (
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: "1px solid rgba(232, 93, 93, 0.2)",
                                background: "rgba(232, 93, 93, 0.04)",
                                color: "#E85D5D",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHardDeleteKey(k.id)}
                              style={{
                                padding: "5px 6px",
                                borderRadius: 6,
                                border: "none",
                                background: "rgba(255,255,255,0.03)",
                                color: "var(--txt3)",
                                display: "flex",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* IMMUTABLE AUDIT LOGS DISPLAY */}
          <div
            className="glass-panel"
            style={{
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <History size={18} style={{ color: "var(--gold)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Immutable Security Audit Logs</h2>
              </div>
              <button
                onClick={fetchAudits}
                style={{ background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={12} className={loadingAudits ? "animate-spin" : ""} />
                <span style={{ fontSize: 11 }}>Sync</span>
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {loadingAudits ? (
                <div style={{ color: "var(--txt3)", textAlign: "center", padding: "40px 0", fontSize: 13.5 }}>Synchronizing DynamoDB Audit trail...</div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 480,
                    overflowY: "auto",
                    paddingRight: 6,
                  }}
                >
                  {auditLogs.length === 0 ? (
                    <div style={{ color: "var(--txt3)", textAlign: "center", padding: "40px 0", fontSize: 13 }}>No database mutations registered in the audit trail yet.</div>
                  ) : (
                    auditLogs.map((l, index) => {
                      const dateText = new Date(l.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
                      
                      let actionColor = "var(--gold)";
                      if (l.action.includes("POST")) actionColor = "#22C55E";
                      else if (l.action.includes("PUT")) actionColor = "var(--blue)";
                      else if (l.action.includes("DELETE")) actionColor = "#E85D5D";

                      return (
                        <div
                          key={index}
                          style={{
                            background: "rgba(0,0,0,0.22)",
                            border: "1px solid rgba(255,255,255,0.03)",
                            borderRadius: 10,
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {/* Log Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                fontFamily: "var(--font-mono)",
                                color: actionColor,
                                background: `color-mix(in srgb, ${actionColor} 10%, transparent)`,
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              {l.action}
                            </span>
                            <span style={{ fontSize: 10.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                              ⏱️ {dateText}
                            </span>
                          </div>

                          {/* Event info */}
                          <p style={{ fontSize: 12, color: "var(--txt2)", lineHeight: 1.4 }}>
                            Modified <strong>{l.resource}</strong> resource profiles.
                          </p>

                          <div
                            style={{
                              background: "rgba(0,0,0,0.3)",
                              padding: "6px 10px",
                              borderRadius: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                              color: "var(--txt3)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Actor: {l.user_id}</span>
                            <span>Tenant: {l.tenant_id.slice(0, 10)}...</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* GENERATE API KEY MODAL DIALOG */}
      {showGenerateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Backdrop overlay */}
          <div
            onClick={() => setShowGenerateModal(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              background: "#15151A",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 20,
              padding: 30,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              zIndex: 1001,
            }}
          >
            {/* Modal Header */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)" }}>Generate Client API Access Token</h3>
              <p style={{ fontSize: 12.5, color: "var(--txt3)", marginTop: 4 }}>
                External CRMs (like Salesforce or HubSpot) can call `/webhook/trigger-campaign` directly using this key.
              </p>
            </div>

            {errorMessage && (
              <div style={{ background: "rgba(232, 93, 93, 0.08)", border: "1px solid rgba(232, 93, 93, 0.2)", borderRadius: 10, padding: 10, fontSize: 12.5, color: "#E85D5D" }}>
                {errorMessage}
              </div>
            )}

            {newlyGeneratedKey ? (
              /* KEY CREATED STATE - DISPLAY KEY ONCE ONLY */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                <div
                  style={{
                    background: "rgba(191, 144, 0, 0.04)",
                    border: "1px solid rgba(201, 161, 74, 0.2)",
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                    <AlertCircle size={14} />
                    <span>SAVE THIS API KEY NOW</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--txt2)", lineHeight: 1.4 }}>
                    For security standards, this token is shown **only once**. We physically cannot recover it for you if you close this dialog!
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--gold)", overflowX: "auto", whiteSpace: "nowrap", flex: 1 }}>
                    {newlyGeneratedKey}
                  </code>
                  <button
                    onClick={() => handleCopy(newlyGeneratedKey, "NEWLY_CREATED")}
                    style={{
                      height: 32,
                      width: 32,
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(255,255,255,0.04)",
                      color: "var(--txt2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {copiedKeyId === "NEWLY_CREATED" ? <Check size={14} style={{ color: "var(--green)" }} /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setNewlyGeneratedKey(null);
                  }}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: "none",
                    background: "var(--gold)",
                    color: "#0F0F12",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 10,
                  }}
                >
                  I Have Safely Stored This Key
                </button>
              </div>
            ) : (
              /* NOMINAL STATE - INPUT FORM */
              <form onSubmit={handleGenerateKey} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                    INTEGRATION CONNECTION NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HubSpot Production Leads System"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    disabled={generating}
                    className="glass-input"
                    style={{
                      height: 40,
                      fontSize: 13,
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    disabled={generating}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "var(--txt2)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      border: "none",
                      background: "var(--gold)",
                      color: "#0F0F12",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {generating ? "Encrypting key..." : "Confirm & Generate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
