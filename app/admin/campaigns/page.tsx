"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  RefreshCw,
  PhoneCall,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Target,
  FileText,
  Sliders,
  Sparkles,
} from "lucide-react";

interface CampaignData {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "COMPLETED";
  scriptName: string;
  skillPack: string;
  totalContacts: number;
  completedCalls: number;
  successRate: number; // percentage
  createdAt: string;
}

const MOCK_CAMPAIGNS: CampaignData[] = [
  {
    id: "camp-1",
    name: "Bangalore Luxury 3BHK Outbound",
    status: "ACTIVE",
    scriptName: "3BHK Premium Design & Wardrobes Script",
    skillPack: "Interior Design Expert Pack v2",
    totalContacts: 147,
    completedCalls: 89,
    successRate: 88,
    createdAt: "May 20, 2026",
  },
  {
    id: "camp-2",
    name: "Electronic City Budget 2BHK Enquiries",
    status: "PAUSED",
    scriptName: "2BHK Space Saver Design Pitch",
    skillPack: "Space Optimizer Pack",
    totalContacts: 98,
    completedCalls: 45,
    successRate: 72,
    createdAt: "May 18, 2026",
  },
  {
    id: "camp-3",
    name: "Sarjapur Luxury Duplex & Villa Pipeline",
    status: "DRAFT",
    scriptName: "Premium Villa Structure Consultation Pitch",
    skillPack: "Luxury Villa Design Pack",
    totalContacts: 32,
    completedCalls: 0,
    successRate: 0,
    createdAt: "May 25, 2026",
  },
  {
    id: "camp-4",
    name: "Indiranagar Kitchen Remodel Callback",
    status: "COMPLETED",
    scriptName: "Acrylic Modular Kitchen Remodel Script",
    skillPack: "Kitchen Specialist Pack",
    totalContacts: 60,
    completedCalls: 60,
    successRate: 91,
    createdAt: "May 10, 2026",
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>(MOCK_CAMPAIGNS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampName, setNewCampName] = useState("");
  const [newCampScript, setNewCampScript] = useState("3BHK Premium Design & Wardrobes Script");
  const [newCampSkill, setNewCampSkill] = useState("Interior Design Expert Pack v2");
  const [newCampContacts, setNewCampContacts] = useState(50);
  
  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;

    const newCamp: CampaignData = {
      id: `camp-${Date.now()}`,
      name: newCampName,
      status: "DRAFT",
      scriptName: newCampScript,
      skillPack: newCampSkill,
      totalContacts: Number(newCampContacts),
      completedCalls: 0,
      successRate: 0,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setCampaigns([newCamp, ...campaigns]);
    setNewCampName("");
    setShowCreateModal(false);
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Outbound Voice Campaigns</h1>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Schedule automated cold calling queues, hook Objection RAG scripts, and audit dynamic pipeline conversions.
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
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Dynamic Aggregations Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          
          {/* Active Campaigns */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(201, 161, 74, 0.08)", color: "var(--gold)" }}>
              <Megaphone size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>ACTIVE OUTBOUND PIPELINES</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {campaigns.filter((c) => c.status === "ACTIVE").length} <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Queues Running</span>
              </div>
            </div>
          </div>

          {/* Connected Contacts */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(99, 140, 255, 0.08)", color: "var(--blue)" }}>
              <Target size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>TOTAL TARGET LEADS</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {campaigns.reduce((sum, c) => sum + c.totalContacts, 0)} <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Identified Profiles</span>
              </div>
            </div>
          </div>

          {/* Average Success Rate */}
          <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(34, 197, 94, 0.08)", color: "var(--green)" }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>AVG QUALIFICATION RATE</span>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                83.6% <span style={{ fontSize: 12, color: "var(--txt2)", fontWeight: 500 }}>Meeting Bookings</span>
              </div>
            </div>
          </div>

        </div>

        {/* Campaigns Data Table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["CAMPAIGN DETAILS", "STATUS", "INTELLIGENCE SKILL PACK", "CONNECTIVITY INDEX", "SUCCESS RATE", "ACTIONS"].map((th) => (
                  <th
                    key={th}
                    style={{
                      padding: "16px 24px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--txt3)",
                      letterSpacing: ".05em",
                    }}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                let statusColor = "var(--gold)";
                if (c.status === "ACTIVE") statusColor = "var(--green)";
                else if (c.status === "PAUSED") statusColor = "var(--gold)";
                else if (c.status === "COMPLETED") statusColor = "var(--blue)";
                else if (c.status === "DRAFT") statusColor = "var(--txt3)";

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {/* Campaign Info */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                          Created: {c.createdAt}
                        </span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: "18px 24px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 30,
                          color: statusColor,
                          background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)`,
                          letterSpacing: ".05em",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Connected Script & Skillpack */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt)" }}>{c.skillPack}</span>
                        <span style={{ fontSize: 11.5, color: "var(--txt2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText size={12} style={{ color: "var(--gold)" }} />
                          {c.scriptName}
                        </span>
                      </div>
                    </td>

                    {/* Progress Indicator */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 140 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                          <span style={{ color: "var(--txt2)" }}>{c.completedCalls} / {c.totalContacts} calls</span>
                        </div>
                        <div style={{ height: 4, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${(c.completedCalls / c.totalContacts) * 100}%`,
                              background: c.status === "ACTIVE" ? "var(--green)" : "var(--gold)",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Success Rate */}
                    <td style={{ padding: "18px 24px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: c.successRate > 80 ? "var(--green)" : c.successRate > 0 ? "var(--blue)" : "var(--txt3)",
                        }}
                      >
                        {c.successRate > 0 ? `${c.successRate}%` : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {c.status !== "COMPLETED" && c.status !== "DRAFT" && (
                          <button
                            onClick={() => handleToggleStatus(c.id)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: "1px solid rgba(255,255,255,0.06)",
                              background: "rgba(255,255,255,0.03)",
                              color: "var(--txt)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {c.status === "ACTIVE" ? (
                              <Pause size={13} style={{ color: "var(--gold)" }} />
                            ) : (
                              <Play size={13} style={{ color: "var(--green)" }} />
                            )}
                          </button>
                        )}
                        <button
                          style={{
                            height: 32,
                            padding: "0 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.03)",
                            color: "var(--txt2)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Sliders size={11} />
                          <span>Configure</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CREATE CAMPAIGN DIALOG MODAL */}
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
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)" }}>Launch New Outbound Calling Pipeline</h3>
              <p style={{ fontSize: 12.5, color: "var(--txt3)", marginTop: 4 }}>
                Configure targets, hook conversational parameters, and attach structured objection pivots.
              </p>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Campaign Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  CAMPAIGN DISPLAY NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore South HSR Enquiries"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13 }}
                />
              </div>

              {/* Connected RAG Script */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  ATTACHED OBJECTION SCRIPT
                </label>
                <select
                  value={newCampScript}
                  onChange={(e) => setNewCampScript(e.target.value)}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13, background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.06)", color: "var(--txt)" }}
                >
                  <option value="3BHK Premium Design & Wardrobes Script">3BHK Premium Design & Wardrobes Script</option>
                  <option value="2BHK Space Saver Design Pitch">2BHK Space Saver Design Pitch</option>
                  <option value="Premium Villa Structure Consultation Pitch">Premium Villa Structure Consultation Pitch</option>
                  <option value="Acrylic Modular Kitchen Remodel Script">Acrylic Modular Kitchen Remodel Script</option>
                </select>
              </div>

              {/* RAG Skillpack */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  CONNECTED INTELLIGENCE SKILL PACK
                </label>
                <select
                  value={newCampSkill}
                  onChange={(e) => setNewCampSkill(e.target.value)}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13, background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.06)", color: "var(--txt)" }}
                >
                  <option value="Interior Design Expert Pack v2">Interior Design Expert Pack v2</option>
                  <option value="Space Optimizer Pack">Space Optimizer Pack</option>
                  <option value="Luxury Villa Design Pack">Luxury Villa Design Pack</option>
                  <option value="Kitchen Specialist Pack">Kitchen Specialist Pack</option>
                </select>
              </div>

              {/* Targets Count */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                  INITIAL LEADS POOL TARGET INDEX
                </label>
                <input
                  type="number"
                  required
                  placeholder="50"
                  value={newCampContacts}
                  onChange={(e) => setNewCampContacts(Number(e.target.value))}
                  className="glass-input"
                  style={{ height: 40, fontSize: 13 }}
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
                  Provision Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
