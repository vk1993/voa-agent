"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useTenantContext } from "@/hooks/useTenantContext";
import {
  Flame,
  PhoneCall,
  Calendar,
  Search,
  CheckCircle,
  ExternalLink,
  Phone,
  MessageSquare,
  Clock,
  UserCheck,
  X,
} from "lucide-react";

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "Hot" | "Warm" | "Booked" | "DND";
  requirements: string;
  location: string;
  budget: string;
  assignedAgent: string;
  lastCallDate: string;
  callLog: {
    duration: string;
    sentimentScore: number;
    intentExtracted: string;
    transcript: { role: "AI" | "USER"; text: string }[];
  };
}


export default function SalesPipeline() {
  const { meetingLabel } = useTenantContext();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        // Fetch Fastify contacts via the Next.js proxy path
        const res = await fetch("/api/contacts?limit=50");
        const data = await res.json();
        if (data.success && Array.isArray(data.contacts)) {
          const mapped: LeadData[] = data.contacts.map((c: any) => {
            const lastLog = c.callLogs?.[0];
            const statusMap: Record<string, LeadData["status"]> = {
              NEW: "Warm", CALLED: "Warm", BOOKED: "Booked", DND: "DND", CONVERTED: "Booked",
            };
            return {
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email || "",
              status: statusMap[c.status] || "Warm",
              requirements: c.domainQualifier || c.notes || "—",
              location: c.location || "—",
              budget: c.budgetMin && c.budgetMax
                ? `${Math.round(c.budgetMin / 100000)}–${Math.round(c.budgetMax / 100000)}L`
                : "—",
              assignedAgent: c.assignedAgent?.name || "Unassigned",
              lastCallDate: lastLog
                ? new Date(lastLog.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                : "Never called",
              callLog: {
                duration: lastLog ? `${Math.floor((lastLog.durationSeconds || 0) / 60).toString().padStart(2, "0")}:${((lastLog.durationSeconds || 0) % 60).toString().padStart(2, "0")}` : "—",
                sentimentScore: lastLog?.sentimentScore || 0,
                intentExtracted: lastLog?.transcriptSummary || "No AI summary yet.",
                transcript: [],
              },
            };
          });
          setLeads(mapped);
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const filteredLeads = leads.filter((l) => {
    return (
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.requirements.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const hotLeadsCount = leads.filter((l) => l.status === "Booked").length;

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>My Pipeline</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Welcome back. Focus on high-converting prospects and trigger outbound conversational sequences.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          
          {/* Card 1: My Hot Leads */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                MY HOT LEADS
              </span>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)", marginTop: 6 }}>
                {hotLeadsCount}
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginTop: 6 }}>
                🔥 Whitefield & Duplex inquiries
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: "rgba(201,161,74,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={20} style={{ color: "var(--gold)" }} />
            </div>
          </div>

          {/* Card 2: Today's Calls */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                TODAY'S CALLS
              </span>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--blue)", marginTop: 6 }}>
                12 / <span style={{ fontSize: 20, color: "var(--txt3)" }}>25</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginTop: 6 }}>
                📞 48% target achieved
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: "rgba(99,140,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PhoneCall size={20} style={{ color: "var(--blue)" }} />
            </div>
          </div>

          {/* Card 3: Showroom Appointments */}
          <div
            className="glass-panel stagger-item"
            style={{
              padding: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {meetingLabel ? `${meetingLabel.toUpperCase()}S BOOKED` : "APPOINTMENTS BOOKED"}
              </span>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--green)", marginTop: 6 }}>
                2
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginTop: 6 }}>
                📅 Recent {meetingLabel ? meetingLabel.toLowerCase() : "meeting"} bookings
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: "rgba(34,197,94,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={20} style={{ color: "var(--green)" }} />
            </div>
          </div>
        </div>

        {/* Toolbar & Leads Filter */}
        <div
          style={{
            background: "var(--surf)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)" }}>
              My Active Prospect List
            </span>
            <span style={{ fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
              PRE-FILTERED BY AGENT: VISAL KUMAR
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--txt3)" }}
            />
            <input
              type="text"
              placeholder="Search my leads by name, requirements, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{
                width: "100%",
                height: 40,
                padding: "0 16px 0 44px",
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {/* Filtered Active Data Table */}
        <div
          className="glass-panel stagger-item"
          style={{
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["PROSPECT NAME", "PIPELINE STAGE", "REQUIREMENTS", "SECTOR AREA", "EST. BUDGET", "LAST CONTACT", ""].map(
                  (th) => (
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
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((l) => {
                  let statusCol = "var(--gold)";
                  if (l.status === "Warm") statusCol = "var(--blue)";
                  else if (l.status === "Booked") statusCol = "var(--green)";
                  else if (l.status === "DND") statusCol = "#E85D5D";

                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Name */}
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{l.name}</span>
                          <span style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2 }}>{l.phone}</span>
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td style={{ padding: "18px 24px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            color: statusCol,
                            background: `color-mix(in srgb, ${statusCol} 12%, transparent)`,
                            border: `0.5px solid color-mix(in srgb, ${statusCol} 30%, transparent)`,
                            letterSpacing: ".04em",
                          }}
                        >
                          {l.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Requirements */}
                      <td style={{ padding: "18px 24px", fontSize: 13, color: "var(--txt2)" }}>{l.requirements}</td>

                      {/* Location */}
                      <td style={{ padding: "18px 24px", fontSize: 13 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt2)" }}>
                          {l.location}
                        </span>
                      </td>

                      {/* Est. Budget */}
                      <td style={{ padding: "18px 24px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--gold)",
                            background: "rgba(201, 161, 74, 0.08)",
                            padding: "3px 8px",
                            borderRadius: 4,
                          }}
                        >
                          {l.budget}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td style={{ padding: "18px 24px", fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                        {l.lastCallDate}
                      </td>

                      {/* Action Icon */}
                      <td style={{ padding: "18px 24px", textAlign: "right" }}>
                        <ExternalLink size={14} style={{ color: "var(--txt3)" }} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 24px", textAlign: "center", color: "var(--txt3)", fontSize: 14 }}>
                    No matching leads found assigned to your profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out detail drawer */}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedLead(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer Body */}
          <div
            className="glass-panel"
            style={{
              position: "relative",
              width: 500,
              height: "100%",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-15px 0 50px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1001,
              animation: "slide-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px 30px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: "var(--blue)",
                    letterSpacing: ".1em",
                  }}
                >
                  LEAD PROFILE DETAIL
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{selectedLead.name}</h2>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  color: "var(--txt2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scroll Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 30, display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Contact Card Details */}
              <div
                style={{
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>PHONE NUMBER</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{selectedLead.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EMAIL ADDRESS</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedLead.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>SECTOR AREA</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>📍 {selectedLead.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EST. BUDGET</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3, color: "var(--gold)" }}>💰 {selectedLead.budget}</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>REQUIREMENTS</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{selectedLead.requirements}</div>
                </div>
              </div>

              {/* Call Intelligence */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 12 }}>
                  VOXA Call Analytics
                </h3>
                <div
                  style={{
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>CALL DURATION</span>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} style={{ color: "var(--gold)" }} />
                        {selectedLead.callLog.duration} secs
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>SENTIMENT RATING</span>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: selectedLead.callLog.sentimentScore > 0.8 ? "var(--green)" : "var(--blue)" }}>
                          {(selectedLead.callLog.sentimentScore * 100).toFixed(0)}% Positive
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EXTRACTED INTENT</span>
                    <p style={{ fontSize: 12.5, color: "var(--txt2)", marginTop: 4, lineHeight: 1.5 }}>
                      {selectedLead.callLog.intentExtracted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Call Transcript dialog */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 12 }}>
                  Voice Call Transcript
                </h3>
                <div
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {selectedLead.callLog.transcript.map((line, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: line.role === "AI" ? "var(--gold)" : "var(--blue)",
                          letterSpacing: ".04em",
                        }}
                      >
                        {line.role === "AI" ? "VOXA VOICE AGENT" : "PROSPECT"}
                      </span>
                      <p style={{ fontSize: 12, color: line.role === "AI" ? "var(--txt)" : "var(--txt2)", lineHeight: 1.5 }}>
                        {line.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons actions */}
            <div
              style={{
                padding: "20px 30px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,0,0,0.18)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--txt)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Phone size={14} style={{ color: "var(--gold)" }} />
                <span>Trigger Outbound Call</span>
              </button>
              <button
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--gold)",
                  color: "#0F0F12",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <UserCheck size={14} />
                <span>Mark Re-assigned</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
