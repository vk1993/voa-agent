"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
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

const MOCK_LEADS: LeadData[] = [
  {
    id: "c1",
    name: "Priya Nair",
    phone: "+91 98450 12345",
    email: "priya.nair@gmail.com",
    status: "Hot",
    requirements: "3BHK Premium Design & Wardrobes",
    location: "Whitefield",
    budget: "8-10L",
    assignedAgent: "Visal Kumar",
    lastCallDate: "Today, 11:30 AM",
    callLog: {
      duration: "02:47",
      sentimentScore: 0.85,
      intentExtracted: "Ready for site visit next Sunday. Needs modular kitchen customization.",
      transcript: [
        { role: "AI", text: "Hi Priya — I saw you enquired about our 3BHK design package. Are you still looking?" },
        { role: "USER", text: "Yes, we just got possession last week actually in Whitefield." },
        { role: "AI", text: "Perfect timing! Most clients in Whitefield budget around 8-10 lakhs for a full interior. Does that range work?" },
        { role: "USER", text: "Yes, that is in our budget. I am particularly concerned about modular kitchen layouts though." },
        { role: "AI", text: "We have a dedicated modular kitchen expert who can draw custom layouts. Can we schedule a showroom walk-through next Sunday?" },
        { role: "USER", text: "Sunday works. 11:00 AM works best." }
      ]
    }
  },
  {
    id: "c2",
    name: "Arjun Reddy",
    phone: "+91 99000 87654",
    email: "arjun.reddy@yahoo.com",
    status: "Warm",
    requirements: "Modular Kitchen Overhaul & Living Room",
    location: "Indiranagar",
    budget: "3-5L",
    assignedAgent: "Visal Kumar",
    lastCallDate: "Yesterday, 4:15 PM",
    callLog: {
      duration: "01:50",
      sentimentScore: 0.68,
      intentExtracted: "Evaluating modular kitchen materials. Will visit the showroom once quotes are shared.",
      transcript: [
        { role: "AI", text: "Hello Arjun, this is VOXA calling from Prestige Interiors. You requested info about Modular Kitchen designs." },
        { role: "USER", text: "Hi, yes. I need to remodel my kitchen in Indiranagar. I need high-gloss acrylic finishes." },
        { role: "AI", text: "Excellent choice! Acrylic is extremely durable. For an Indiranagar kitchen and living room setup, our packages usually range from 3 to 5 lakhs. How does that sound?" },
        { role: "USER", text: "The range is fine. Can you send me some material samples and pricing on WhatsApp?" },
        { role: "AI", text: "Absolutely, I am triggering an automated WhatsApp with our catalog right away." }
      ]
    }
  },
  {
    id: "c4",
    name: "Rahul Hegde",
    phone: "+91 97410 44321",
    email: "rahul.hegde@hotmail.com",
    status: "Warm",
    requirements: "2BHK Compact Interior Package",
    location: "Electronic City",
    budget: "6-8L",
    assignedAgent: "Visal Kumar",
    lastCallDate: "May 24, 10:00 AM",
    callLog: {
      duration: "02:15",
      sentimentScore: 0.6,
      intentExtracted: "Comparing quotes with competitors. Needs space-saving multi-functional beds.",
      transcript: [
        { role: "AI", text: "Hi Rahul, VOXA calling. You enquired about our E-City 2BHK space-saving packages." },
        { role: "USER", text: "Yes, I am comparing a few interior startups right now. Budget is tight around 6 to 8 lakhs." },
        { role: "AI", text: "We specialize in space-optimization! We bundle multi-functional wall beds and study units that fit perfectly in this range." },
        { role: "USER", text: "Okay, send me the E-City catalog. If I like the designs, I will book a designer consult." }
      ]
    }
  }
];

export default function SalesPipeline() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

  // Pre-filter leads showing only those assigned to the logged-in agent (Visal Kumar)
  const filteredLeads = MOCK_LEADS.filter((l) => {
    const matchesAgent = l.assignedAgent === "Visal Kumar";
    const matchesQuery =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesQuery;
  });

  // Calculate quick metrics based on Visal's leads
  const hotLeadsCount = MOCK_LEADS.filter((l) => l.status === "Hot" && l.assignedAgent === "Visal Kumar").length;

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>My Pipeline</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Welcome back, Visal. Focus on high-converting luxury design prospects and trigger outbound calls.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          
          {/* Card 1: My Hot Leads */}
          <div
            style={{
              background: "linear-gradient(145deg, #1A1A22 0%, #15151A 100%)",
              border: "1px solid rgba(201, 161, 74, 0.2)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
            style={{
              background: "linear-gradient(145deg, #151822 0%, #15151A 100%)",
              border: "1px solid rgba(99, 140, 255, 0.2)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
            style={{
              background: "linear-gradient(145deg, #111A16 0%, #15151A 100%)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                APPOINTMENTS BOOKED
              </span>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--green)", marginTop: 6 }}>
                2
              </div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginTop: 6 }}>
                📅 HSR & Indiranagar visits
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
              placeholder="Search my leads by name, layout type, location (e.g. Indiranagar, kitchen finishes)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                padding: "0 16px 0 44px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.2)",
                color: "var(--txt)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Filtered Active Data Table */}
        <div
          style={{
            background: "var(--surf)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: 14,
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
            style={{
              position: "relative",
              width: 500,
              height: "100%",
              background: "#15151A",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1001,
              animation: "floatUp 0.3s ease",
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
