"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import {
  Settings,
  Phone,
  Shield,
  Key,
  Database,
  Sliders,
  Cpu,
  ChevronRight,
  Save,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Server,
  Play,
  Check,
  Lock,
  ArrowRight,
  Fingerprint,
  Info,
} from "lucide-react";

export default function SystemSettingsPage() {
  // Master Tenant Form State
  const [tenantName, setTenantName] = useState("Bangalore Luxury Interiors");
  const [twilioSid, setTwilioSid] = useState("AC7829ac83fb904128f993d0a7f130acfe");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [oktaDomain, setOktaDomain] = useState("voxa-prod.okta.com");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Onboarding Simulator State
  const [simOrgName, setSimOrgName] = useState("Veneer Masters LLC");
  const [simTier, setSimTier] = useState<"STARTER" | "GROWTH" | "ENTERPRISE">("GROWTH");
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Genesis, 2: JWT, 3: Scaffolding, 4: Isolation, 5: Complete
  const [simProgress, setSimProgress] = useState(0);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simTenantId, setSimTenantId] = useState("");
  const [simJwt, setSimJwt] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Run Onboarding Pipeline Simulation
  const handleRunSimulation = () => {
    setSimStep(1);
    setSimProgress(10);
    const generatedId = `org_${Math.random().toString(36).substring(2, 10)}`;
    setSimTenantId(generatedId);
    setSimLog([`🚀 Initiating Onboarding Pipeline for organization: "${simOrgName}" [Tier: ${simTier}]`]);

    // Stage 1: Tenant Genesis
    setTimeout(() => {
      setSimStep(1);
      setSimProgress(30);
      setSimLog((prev) => [
        ...prev,
        `✓ [TENANT GENESIS] Created immutable tenant_id partition: "${generatedId}"`,
        `✓ [ADMIN PROVISIONING] Bound creator email: "admin@${simOrgName.toLowerCase().replace(/\s+/g, "")}.com" to AWS Cognito Pool`,
      ]);
    }, 1000);

    // Stage 2: JWT Auth Mapping
    setTimeout(() => {
      setSimStep(2);
      setSimProgress(50);
      const mockJwt = {
        iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_VoxaPool",
        sub: "user_a1b2c3d4",
        "custom:tenant_id": generatedId,
        "custom:role": "ADMIN",
        email: `admin@${simOrgName.toLowerCase().replace(/\s+/g, "")}.com`,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      setSimJwt(JSON.stringify(mockJwt, null, 2));
      setSimLog((prev) => [
        ...prev,
        `✓ [JWT CLAIM INJECTION] Appended claims: "custom:tenant_id" = "${generatedId}" & "custom:role" = "ADMIN"`,
        `✓ [API GATEWAY ABAC] Configured cryptographically signed bouncer validation`,
      ]);
    }, 2200);

    // Stage 3: Infrastructure Scaffolding
    setTimeout(() => {
      setSimStep(3);
      setSimProgress(75);
      const pineconeNamespace = `tenant_${generatedId}`;
      const s3BucketPath = `s3://voxa-recordings/tenant_${generatedId}/`;
      setSimLog((prev) => [
        ...prev,
        `✓ [PINECONE SCAFFOLDING] Provisioned dedicated index namespace: "${pineconeNamespace}"`,
        `✓ [S3 COLD STORAGE] Established call recording archive folder: "${s3BucketPath}"`,
        `✓ [VOIP Carrier Trunk] Leased outbound trunk line tagged with partition ID`,
      ]);
    }, 3500);

    // Stage 4: Logical Isolation
    setTimeout(() => {
      setSimStep(4);
      setSimProgress(90);
      setSimLog((prev) => [
        ...prev,
        simTier === "ENTERPRISE"
          ? `✓ [DATA BOUNDARY Silo] Provisioned physically isolated DynamoDB table & RDS dedicated instance`
          : `✓ [DATA BOUNDARY Logical] Mapped tenant_id "${generatedId}" as Hash Partition Key in logical tables`,
        `✓ [TEAM EXPANSION] Generated invite links matching custom:tenant_id with custom:role = "SALES_AGENT"`,
      ]);
    }, 4800);

    // Stage 5: Finished
    setTimeout(() => {
      setSimStep(5);
      setSimProgress(100);
      setSimLog((prev) => [
        ...prev,
        `🎉 Onboarding successful! Sandbox active & tenant boundaries successfully locked.`,
      ]);
    }, 5500);
  };

  const handleResetSimulation = () => {
    setSimStep(0);
    setSimProgress(0);
    setSimLog([]);
    setSimTenantId("");
    setSimJwt("");
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>System Settings</h1>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Manage carrier trunk connections, align OIDC single-sign-on credentials, and configure global LLM parameters.
            </p>
          </div>

          {saveSuccess && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 13,
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={14} />
              <span>Configurations saved successfully!</span>
            </div>
          )}
        </div>

        {/* Top level jump cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Card A: Link to developer keys */}
          <Link
            href="/admin/settings/api-keys"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
            }}
          >
            <div
              className="glass-panel"
              style={{
                flex: 1,
                padding: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ padding: 12, borderRadius: 10, background: "rgba(201, 161, 74, 0.08)", color: "var(--gold)" }}>
                  <Key size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>Developer API Keys</h3>
                  <p style={{ fontSize: 12.5, color: "var(--txt2)", marginTop: 3 }}>
                    Provision HubSpot/Salesforce hooks & view immutable DynamoDB audits.
                  </p>
                </div>
              </div>
              <ChevronRight size={20} style={{ color: "var(--txt3)" }} />
            </div>
          </Link>

          {/* Card B: Pinecone Vector Database index status */}
          <div
            className="glass-panel"
            style={{
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(99, 140, 255, 0.08)", color: "var(--blue)" }}>
                <Database size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>Pinecone Hybrid RAG Index</h3>
                <p style={{ fontSize: 12.5, color: "var(--txt2)", marginTop: 3 }}>
                  Active Index: <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--blue)" }}>voxa-objections-db-prod</span>
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 4,
                color: "var(--green)",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              SYNCHRONIZED
            </span>
          </div>
        </div>

        {/* Configurations split form */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: 30, alignItems: "start" }}>
          
          {/* Left panel: Tenant & Carrier settings */}
          <form onSubmit={handleSaveSettings} className="glass-panel animate-float" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Sliders size={16} style={{ color: "var(--gold)" }} />
              <span>Tenant & Telecom Configurations</span>
            </h2>

            {/* Tenant details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                ENTERPRISE TENANT DISPLAY NAME
              </label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="glass-input"
                style={{ height: 40, fontSize: 13 }}
              />
            </div>

            {/* Twilio Carrier SID */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  TWILIO SIP OUTBOUND CARRIER SID
                </label>
                <HelpCircle size={13} style={{ color: "var(--txt3)", cursor: "pointer" }} />
              </div>
              <input
                type="text"
                required
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                className="glass-input"
                style={{ height: 40, fontSize: 12.5, fontFamily: "var(--font-mono)" }}
              />
            </div>

            {/* TWILIO AUTHENTICATION TRUNK KEYS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                SIP TELEPHONY TRUNK SECRET
              </label>
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••••••••••"
                className="glass-input"
                style={{ height: 40, fontSize: 12.5, fontFamily: "var(--font-mono)", opacity: 0.6 }}
              />
            </div>

            {/* Phone numbers sync */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                VERIFIED VOIP OUTBOUND PHONE IDENTIFIERS
              </span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.18)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 12.5, fontFamily: "var(--font-mono)" }}>+91 80 4709 1100</span>
                  <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>ACTIVE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.18)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 12.5, fontFamily: "var(--font-mono)" }}>+91 80 4709 2200</span>
                  <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </form>

          {/* Right panel: AI Model & Single-Sign-On */}
          <form onSubmit={handleSaveSettings} className="glass-panel animate-float" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Cpu size={16} style={{ color: "var(--gold)" }} />
              <span>Intelligence & Single Sign-On</span>
            </h2>

            {/* Model mapping */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                conversational Core LLM Provider
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="glass-input"
                style={{ height: 40, fontSize: 13, background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.06)", color: "var(--txt)" }}
              >
                <option value="gpt-4o">GPT-4o (OpenAI Premium, High-Latency Outbound)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic Edge)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Cost-Optimized, Fast Routing)</option>
              </select>
            </div>

            {/* OpenAI API Key with proxy */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                OPENAI HELICONE API PROXY KEY
              </label>
              <input
                type="password"
                disabled
                value="sk-helicone-••••••••••••••••••••••••••••••••"
                className="glass-input"
                style={{ height: 40, fontSize: 12.5, fontFamily: "var(--font-mono)", opacity: 0.6 }}
              />
            </div>

            {/* Okta Domain Single Sign-On */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                OKTA Federated SINGLE SIGN-ON DOMAIN
              </label>
              <input
                type="text"
                required
                value={oktaDomain}
                onChange={(e) => setOktaDomain(e.target.value)}
                className="glass-input"
                style={{ height: 40, fontSize: 13 }}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
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
                marginTop: 20,
                boxShadow: "0 4px 14px rgba(201,161,74,0.15)",
                transition: "all 0.2s ease",
              }}
            >
              <Save size={14} />
              <span>Save Settings Config</span>
            </button>
          </form>

        </div>

        {/* ==================== INTERACTIVE ONBOARDING & PROVISIONING SIMULATOR ==================== */}
        <div className="glass-panel stagger-item" style={{ padding: 40, display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 20 }}>
            <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--gold)", letterSpacing: ".12em" }}>
              ENTERPRISE MULTI-TENANCY CONTROL CENTER
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--txt)", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Server size={20} style={{ color: "var(--gold)" }} />
              <span>Interactive Onboarding & Provisioning Simulator</span>
            </h2>
            <p style={{ fontSize: 13, color: "var(--txt2)", marginTop: 4, lineHeight: 1.5 }}>
              Visualize the exact sequence how the backend provisions new organizations, maps AWS Cognito JWT single-sign-on scopes, establishes S3/Pinecone scaffolding, and locks logical partition keys.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 30, alignItems: "start" }}>
            
            {/* Input parameters panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Simulator Config Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--txt)" }}>
                <Sparkles size={14} style={{ color: "var(--gold)" }} />
                <span>Configure New Organization</span>
              </div>

              {/* Organization name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10.5, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  ORGANIZATION DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={simOrgName}
                  onChange={(e) => setSimOrgName(e.target.value)}
                  disabled={simStep > 0 && simStep < 5}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13 }}
                />
              </div>

              {/* Pricing Tier */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  CONTRACT PRICING LEVEL
                </span>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {(["STARTER", "GROWTH", "ENTERPRISE"] as const).map((tier) => {
                    const isSelected = simTier === tier;
                    let activeColor = "var(--blue)";
                    if (tier === "STARTER") activeColor = "var(--blue)";
                    else if (tier === "GROWTH") activeColor = "var(--gold)";
                    else if (tier === "ENTERPRISE") activeColor = "var(--green)";

                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSimTier(tier)}
                        disabled={simStep > 0 && simStep < 5}
                        style={{
                          height: 38,
                          borderRadius: 8,
                          border: isSelected ? `1px solid ${activeColor}` : "1px solid rgba(255,255,255,0.05)",
                          background: isSelected ? `color-mix(in srgb, ${activeColor} 10%, transparent)` : "rgba(255,255,255,0.02)",
                          color: isSelected ? activeColor : "var(--txt2)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {simStep === 0 ? (
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      border: "none",
                      background: "var(--gold)",
                      color: "#0F0F12",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Play size={14} />
                    <span>Run Onboarding Pipeline</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    disabled={simStep > 0 && simStep < 5}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      color: "var(--txt2)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reset Simulator
                  </button>
                )}
              </div>

              {/* Static Pragmatic Guidelines */}
              <div style={{
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 20,
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>
                  <Info size={13} />
                  <span>Pragmatic Architectural Boundaries</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, color: "var(--txt2)", lineHeight: 1.4 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--green)" }}>✔</span>
                    <span><strong>No Client-Derivations:</strong> Never accept `tenant_id` in request payloads. Always derive it securely from the cryptographically signed JWT claim.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--green)" }}>✔</span>
                    <span><strong>Logical Boundary:</strong> SMB Starter/Growth are hosted cost-effectively in shared DB tables, partitioned securely by partition key indexes.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--green)" }}>✔</span>
                    <span><strong>Soft-Delete Handlers:</strong> Blocks subscription cancellations instantly by updating status to `SUSPENDED`, preserving data for 30 days.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Animated Output Console */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Progress bar */}
              {simStep > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: "var(--gold)" }}>SIMULATING PIPELINE SCAFFOLDING</span>
                    <span>{simProgress}%</span>
                  </div>
                  <div style={{ height: 4, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${simProgress}%`, background: "var(--gold)", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              )}

              {/* Scaffolding log outputs */}
              <div
                style={{
                  height: 200,
                  background: "#0c0d14",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: 20,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "inset 0 4px 20px rgba(0,0,0,0.8)",
                }}
              >
                {simLog.length === 0 ? (
                  <span style={{ color: "var(--txt3)" }}>System idle. Configure parameters on the left and trigger onboarding to visualize scaffolding logs.</span>
                ) : (
                  simLog.map((log, idx) => {
                    let logColor = "var(--txt2)";
                    if (log.startsWith("✓")) logColor = "var(--green)";
                    else if (log.startsWith("🎉")) logColor = "var(--gold)";
                    else if (log.startsWith("🚀")) logColor = "var(--blue)";

                    return (
                      <div key={idx} style={{ color: logColor, lineHeight: 1.4 }}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>

              {/* JWT Claims and isolation details */}
              {simStep >= 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 20 }}>
                  
                  {/* Signed JWT token */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Fingerprint size={12} style={{ color: "var(--gold)" }} />
                      <span>SECURE COGNITO JWT</span>
                    </span>
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: "rgba(0,0,0,0.22)",
                        border: "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 8,
                        fontSize: 9.5,
                        fontFamily: "var(--font-mono)",
                        color: "var(--blue)",
                        overflowX: "auto",
                      }}
                    >
                      {simJwt}
                    </pre>
                  </div>

                  {/* Architecture boundary map */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Server size={12} style={{ color: "var(--green)" }} />
                      <span>RESOURCE SEGREGATION MAP ({simTier})</span>
                    </span>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.22)",
                        border: "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 8,
                        padding: 16,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        justifyContent: "center",
                      }}
                    >
                      {/* Diagram representation */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>Cognito OIDC</span>
                          <div style={{ padding: "6px 10px", borderRadius: 4, background: "rgba(201,161,74,0.08)", border: "0.5px solid var(--gold)", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--gold)" }}>
                            claims: {simTenantId}
                          </div>
                        </div>

                        <ArrowRight size={14} style={{ color: "var(--txt3)" }} />

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--txt2)" }}>Vector DB (RAG)</span>
                          <div style={{ padding: "6px 10px", borderRadius: 4, background: "rgba(99,140,255,0.08)", border: "0.5px solid var(--blue)", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--blue)" }}>
                            namespace: tenant_{simTenantId}
                          </div>
                        </div>
                      </div>

                      {/* DB model text */}
                      <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                      
                      <div style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.4 }}>
                        {simTier === "ENTERPRISE" ? (
                          <span>🔒 <strong>Silo Model Active:</strong> Client receives physical database isolation (dedicated RDS postgres / DynamoDB custom instance). Maximum safety index.</span>
                        ) : (
                          <span>🔒 <strong>Logical Pool Active:</strong> Multi-tenant shared DynamoDB index, partitioned safely via Partition Key (`PK` = `{simTenantId}`). Fully secure & cost-efficient.</span>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
