"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  FileText,
  Plus,
  Play,
  Terminal,
  BrainCircuit,
  MessageSquareCode,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle,
  Lock,
} from "lucide-react";

interface ScriptData {
  id: string;
  name: string;
  category: "OBJECTION_PIVOT" | "INBOUND_GREETING" | "APPOINTMENT_LOCK";
  objectionTrigger: string; // keyword trigger list
  systemPrompt: string;
  suggestedPivot: string;
  successRate: number; // percentage
  status: "ACTIVE" | "INACTIVE";
}

const MOCK_SCRIPTS: ScriptData[] = [
  {
    id: "scr-1",
    name: "Price Objection Pivot (Premium Modular Packages)",
    category: "OBJECTION_PIVOT",
    objectionTrigger: "expensive, cost, high-price, budget, discount, cheaper",
    systemPrompt: "You are VOXA interior expert. When client brings up price or budget constraints, pivot immediately to the durability of materials. Detail Hettich soft-close systems, solid veneer bases, and emphasize our 10-year warranty compared to local carpenters. Never say 'I can offer a discount' unless direct authorization is provided.",
    suggestedPivot: "I completely understand that interior packages are a significant investment. However, most of our Whitefield clients select us specifically because local setups degrade in 3 years, while our Hettich soft-close and structural veneers are backed by a solid 10-year replacement warranty. Over a decade, this actually saves you money. Shall we structure our modular layout to match your target budget first?",
    successRate: 86,
    status: "ACTIVE",
  },
  {
    id: "scr-2",
    name: "Timeline Objection Pivot (Possession & Delivery Delay)",
    category: "OBJECTION_PIVOT",
    objectionTrigger: "delay, late, timeline, shifting, shifting-date, urgent, 30 days",
    systemPrompt: "Address urgency with our 45-day guaranteed completion promise. Highlight that we manufacture components in our automated Bangalore factory while structural wet works are done on-site. Any delayed day gets paid back to them.",
    suggestedPivot: "It is exactly because your possession timeline is tight that we are your safest partner. Unlike standard builders who depend on unorganized labor, we manufacture components in our high-tech Bangalore factory. This is why we guarantee a firm 45-day handover in writing, backed by a daily delay penalty refund. Would a guaranteed Saturday measurement visit give you peace of mind?",
    successRate: 90,
    status: "ACTIVE",
  },
  {
    id: "scr-3",
    name: "Competitor Startup Pivot (Livspace & Homelane Comparisons)",
    category: "OBJECTION_PIVOT",
    objectionTrigger: "competitor, other vendor, quotes, local carpenter, startup",
    systemPrompt: "Focus on our curated designer attention. Unlike massive aggregators who employ freelancers, VOXA employs direct master architects who handle only 3 projects simultaneously. This is a personalized luxury experience.",
    suggestedPivot: "Aggregators operate on massive volumes and rely on freelance designers. At VOXA, our in-house master architects are restricted to 3 active projects at any time. This guarantees that your HSR villa or duplex receives dedicated detail audits. Let's schedule a walkthrough at our live experience zone to show you the difference?",
    successRate: 78,
    status: "ACTIVE",
  },
];

export default function ObjectionScriptsPage() {
  const [scripts, setScripts] = useState<ScriptData[]>(MOCK_SCRIPTS);
  const [selectedScript, setSelectedScript] = useState<ScriptData | null>(null);
  
  // Prompt sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState(MOCK_SCRIPTS[0].systemPrompt);
  const [sandboxInput, setSandboxInput] = useState("Your packages are too expensive, I got a cheaper quote.");
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptTriggers, setNewScriptTriggers] = useState("");
  const [newScriptPrompt, setNewScriptPrompt] = useState("");
  const [newScriptPivot, setNewScriptPivot] = useState("");

  const handleCreateScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim()) return;

    const newScript: ScriptData = {
      id: `scr-${Date.now()}`,
      name: newScriptName,
      category: "OBJECTION_PIVOT",
      objectionTrigger: newScriptTriggers,
      systemPrompt: newScriptPrompt,
      suggestedPivot: newScriptPivot,
      successRate: 0,
      status: "ACTIVE",
    };

    setScripts([newScript, ...scripts]);
    setNewScriptName("");
    setShowCreateModal(false);
  };

  const handleRunSandbox = () => {
    setTesting(true);
    setSandboxResponse(null);

    // Mock an AI prompt evaluation response based on RAG parameters
    setTimeout(() => {
      let mockRes = "";
      if (sandboxInput.toLowerCase().includes("expensive") || sandboxInput.toLowerCase().includes("cheap")) {
        mockRes = "[VOXA AI Pivot Action] \"I appreciate you sharing that. While local suppliers can provide low cost, VOXA utilizes factory-finished structural veneers and German Hettich fittings backed by an explicit 10-year warranty. Shall we see how we can optimize modular layouts to align with your budget?\"";
      } else {
        mockRes = "[VOXA AI Standard Response] \"I understand. Our teams utilize strict project schedules and modular component manufacturing to complete projects within a reliable timeline. Can we schedule a showroom walkthrough?\"";
      }
      setSandboxResponse(mockRes);
      setTesting(false);
    }, 1200);
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Conversational RAG Objection Scripts</h1>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Define automated conversational pivots, prime Pinecone context libraries, and test prompt structures in real-time.
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
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
          >
            <Plus size={16} />
            <span>Create Objection Node</span>
          </button>
        </div>

        {/* Main Grid split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", gap: 30, alignItems: "start" }}>
          
          {/* Left panel: List of scripts and trigger parameters */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <BrainCircuit size={18} style={{ color: "var(--gold)" }} />
              <span>Active Objection Intercepts</span>
            </h2>

            {scripts.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedScript(s);
                  setSandboxPrompt(s.systemPrompt);
                }}
                className="glass-panel"
                style={{
                  padding: 24,
                  cursor: "pointer",
                  border: selectedScript?.id === s.id ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.05)",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>{s.name}</h3>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--txt3)", textTransform: "uppercase" }}>
                      Category: {s.category}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: "var(--green)",
                      background: "rgba(34,197,94,0.08)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {s.successRate > 0 ? `${s.successRate}% Success` : "NEW"}
                  </span>
                </div>

                {/* Objection Trigger Keywords */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {s.objectionTrigger.split(",").map((trig, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 10.5,
                        fontFamily: "var(--font-mono)",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: "var(--gold)",
                      }}
                    >
                      #{trig.trim()}
                    </span>
                  ))}
                </div>

                {/* Suggested Pivot Readout */}
                <div
                  style={{
                    background: "rgba(0,0,0,0.15)",
                    border: "1px solid rgba(255,255,255,0.03)",
                    padding: 16,
                    borderRadius: 10,
                    fontSize: 12.5,
                    color: "var(--txt2)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--txt)", fontSize: 11.5, display: "block", marginBottom: 4 }}>
                    PRE-FORMULATED SYSTEM RESPONSE:
                  </strong>
                  {s.suggestedPivot}
                </div>
              </div>
            ))}
          </div>

          {/* Right panel: RAG Sandbox Playground Terminal */}
          <div className="glass-panel" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
              <Terminal size={18} style={{ color: "var(--gold)" }} />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>AI RAG Sandbox Console</h2>
                <p style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}>
                  Verify prompt guidelines and inspect real-time chatbot re-routing evaluations.
                </p>
              </div>
            </div>

            {/* Sandbox form input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  SYSTEM INSTRUCTION PROMPT PIVOT
                </label>
                <textarea
                  value={sandboxPrompt}
                  onChange={(e) => setSandboxPrompt(e.target.value)}
                  className="glass-input"
                  rows={6}
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    resize: "none",
                    padding: 12,
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  SIMULATED PROSPECT OBJECTION
                </label>
                <input
                  type="text"
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  className="glass-input"
                  style={{
                    fontSize: 13,
                    height: 40,
                  }}
                />
              </div>

              <button
                onClick={handleRunSandbox}
                disabled={testing}
                style={{
                  height: 40,
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
                <MessageSquareCode size={14} />
                <span>{testing ? "Evaluating with LLM RAG..." : "Execute Test Query"}</span>
              </button>

            </div>

            {/* Response Console */}
            {sandboxResponse && (
              <div
                style={{
                  background: "#0c0d14",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={10} />
                  RESPONSE PARSED SUCCESSFULLY
                </span>
                <p style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--txt2)", lineHeight: 1.6 }}>
                  {sandboxResponse}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* CREATE SCRIPT NODAL DIALOG */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Backdrop overlay */}
          <div
            onClick={() => setShowCreateModal(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
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
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)" }}>Add objection pivot node</h3>
              <p style={{ fontSize: 12.5, color: "var(--txt3)", marginTop: 4 }}>
                Create matching rules that trigger conversational re-routing when target keywords are asserted.
              </p>
            </div>

            <form onSubmit={handleCreateScript} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Script name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  SCRIPT RULE NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warranty Objections"
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13 }}
                />
              </div>

              {/* Trigger triggers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  KEYWORD TRIGGERS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. warranty, guarantee, break, fix, damage"
                  value={newScriptTriggers}
                  onChange={(e) => setNewScriptTriggers(e.target.value)}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13 }}
                />
              </div>

              {/* System Prompt instruction */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  SYSTEM INSTRUCTION PROMPT RULES
                </label>
                <textarea
                  required
                  placeholder="Tell the model how to handle this objection..."
                  value={newScriptPrompt}
                  onChange={(e) => setNewScriptPrompt(e.target.value)}
                  className="glass-input"
                  rows={3}
                  style={{ fontSize: 12, resize: "none" }}
                />
              </div>

              {/* Suggested Pivot */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  PRE-FORMULATED SYSTEM RESPONSE
                </label>
                <textarea
                  required
                  placeholder="Write the exact pivot statement..."
                  value={newScriptPivot}
                  onChange={(e) => setNewScriptPivot(e.target.value)}
                  className="glass-input"
                  rows={3}
                  style={{ fontSize: 12, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  Inject Objection Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
