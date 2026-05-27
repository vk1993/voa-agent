"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Phone,
  MessageSquare,
  Calendar,
  X,
  UserCheck,
} from "lucide-react";

interface ContactData {
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

const MOCK_CONTACTS: ContactData[] = [
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
    id: "c3",
    name: "Sneha Sen",
    phone: "+91 98860 55432",
    email: "sneha.sen@outlook.com",
    status: "Booked",
    requirements: "Full Home Luxury Villa Design",
    location: "Sarjapur Road",
    budget: "25-30L",
    assignedAgent: "Shalini Padhy",
    lastCallDate: "May 25, 2:30 PM",
    callLog: {
      duration: "04:12",
      sentimentScore: 0.92,
      intentExtracted: "Showroom walkthrough booked. Fully qualified lead with high budget.",
      transcript: [
        { role: "AI", text: "Hello Sneha, calling regarding your inquiry on our luxury villa designs. How can we help you?" },
        { role: "USER", text: "Yes, we bought a 4BHK villa on Sarjapur road and need full home interiors. Italian marble and automated lights are a must." },
        { role: "AI", text: "A premium villa design with smart automation generally budgets around 25 to 30 lakhs. We have a live experience zone at HSR layout showing these setups." },
        { role: "USER", text: "That sounds amazing. Can we come down on Saturday?" },
        { role: "AI", text: "Saturday is perfect. I have locked your slot with Shalini Padhy, our chief architect, for 3:00 PM." }
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
  },
  {
    id: "c5",
    name: "Kavya Rao",
    phone: "+91 96110 99887",
    email: "kavya.rao@gmail.com",
    status: "Hot",
    requirements: "4BHK Duplex Full Home Designing",
    location: "HSR Layout",
    budget: "15-18L",
    assignedAgent: "Shalini Padhy",
    lastCallDate: "May 23, 5:45 PM",
    callLog: {
      duration: "03:05",
      sentimentScore: 0.88,
      intentExtracted: "Highly interested. Wants solid wood veneers. Consultation scheduled.",
      transcript: [
        { role: "AI", text: "Hi Kavya, calling from VOXA. You're looking for Duplex designs in HSR layout?" },
        { role: "USER", text: "Yes, we have possession of a duplex and need premium wood paneling and high-end veneers." },
        { role: "AI", text: "Duplexes are great! Standard veneer-themed layouts generally range from 15 to 18 lakhs. Would you like a designer to call you?" },
        { role: "USER", text: "Yes, please ask Shalini to call me. I liked her portfolio on your site." }
      ]
    }
  },
  {
    id: "c6",
    name: "Deepak Shetty",
    phone: "+91 95350 33221",
    email: "deepak.shetty@gmail.com",
    status: "Booked",
    requirements: "Living Room Accent Wall & Sofa Overhaul",
    location: "Koramangala",
    budget: "2.5-4L",
    assignedAgent: "Shalini Padhy",
    lastCallDate: "May 22, 11:15 AM",
    callLog: {
      duration: "01:25",
      sentimentScore: 0.72,
      intentExtracted: "Consultation booked. Wants custom structural gypsum wall treatments.",
      transcript: [
        { role: "AI", text: "Hi Deepak, VOXA calling. You enquired about our Koramangala premium living room renovations." },
        { role: "USER", text: "Yes, I need to renovate my TV unit and add customized wood paneling. Budget is around 3 lakhs." },
        { role: "AI", text: "We can easily fit solid MDF paneling in that range! I can book a home measurement visit for you." },
        { role: "USER", text: "Great, book it for Saturday morning at 10 AM." }
      ]
    }
  }
];

export default function AdminContacts() {
  const [filterStatus, setFilterStatus] = useState<"All" | "Hot" | "Warm" | "Booked" | "DND">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);

  // Filter contacts based on Status Pill and Search Query
  const filteredContacts = MOCK_CONTACTS.filter((c) => {
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.requirements.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.budget.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>Leads & Contacts</h1>
            <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
              Manage incoming qualified leads, trace call summaries, and track architect assignments.
            </p>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            Total Leads: <span style={{ color: "var(--gold)", fontWeight: 600 }}>{MOCK_CONTACTS.length}</span>
          </div>
        </div>

        {/* Toolbar: Search & Pills Filters */}
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
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--txt3)" }}
              />
              <input
                type="text"
                placeholder="Search leads by name, layout type, location (e.g. Whitefield, 3BHK)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 16px 0 44px",
                  fontSize: 13.5,
                }}
              />
            </div>

            <button
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                color: "var(--txt2)",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Filter size={14} />
              <span>Advanced Filter</span>
            </button>
          </div>

          {/* Pill Filters */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--txt3)", marginRight: 8, fontWeight: 500 }}>
              FILTER STATUS:
            </span>
            {(["All", "Hot", "Warm", "Booked", "DND"] as const).map((status) => {
              const isActive = filterStatus === status;
              let activeCol = "var(--gold)";
              if (status === "Hot") activeCol = "var(--gold)";
              else if (status === "Warm") activeCol = "var(--blue)";
              else if (status === "Booked") activeCol = "var(--green)";
              else if (status === "DND") activeCol = "#E85D5D";

              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 30,
                    border: isActive
                      ? `1px solid ${activeCol}`
                      : "1px solid rgba(255, 255, 255, 0.05)",
                    background: isActive
                      ? `color-mix(in srgb, ${activeCol} 12%, transparent)`
                      : "rgba(255, 255, 255, 0.02)",
                    color: isActive ? activeCol : "var(--txt2)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div
          className="glass-panel stagger-item"
          style={{
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.18)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                {["NAME", "STATUS", "REQUIREMENTS", "LOCATION", "BUDGET", "ASSIGNED AGENT", "LAST ACTIVITY", ""].map(
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
              {filteredContacts.length > 0 ? (
                filteredContacts.map((c) => {
                  let statusCol = "var(--gold)";
                  if (c.status === "Warm") statusCol = "var(--blue)";
                  else if (c.status === "Booked") statusCol = "var(--green)";
                  else if (c.status === "DND") statusCol = "#E85D5D";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
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
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>
                          <span style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2 }}>{c.phone}</span>
                        </div>
                      </td>

                      {/* Status */}
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
                          {c.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Requirements */}
                      <td style={{ padding: "18px 24px", fontSize: 13, color: "var(--txt2)" }}>{c.requirements}</td>

                      {/* Location */}
                      <td style={{ padding: "18px 24px", fontSize: 13 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--txt2)" }}>
                          {c.location}
                        </span>
                      </td>

                      {/* Budget */}
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
                          {c.budget}
                        </span>
                      </td>

                      {/* Assigned Agent */}
                      <td style={{ padding: "18px 24px", fontSize: 13, color: "var(--txt2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                            }}
                          >
                            👤
                          </div>
                          <span>{c.assignedAgent}</span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td style={{ padding: "18px 24px", fontSize: 11.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                        {c.lastCallDate}
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
                  <td colSpan={8} style={{ padding: "40px 24px", textAlign: "center", color: "var(--txt3)", fontSize: 14 }}>
                    No qualified leads matched your search filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out detail drawer */}
      {selectedContact && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedContact(null)}
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
                    color: "var(--gold)",
                    letterSpacing: ".1em",
                  }}
                >
                  LEAD PROFILE DETAIL
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{selectedContact.name}</h2>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
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
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{selectedContact.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EMAIL ADDRESS</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedContact.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>LOCATION</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>📍 {selectedContact.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>BUDGET SCALE</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3, color: "var(--gold)" }}>💰 {selectedContact.budget}</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>REQUIREMENTS</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{selectedContact.requirements}</div>
                </div>
              </div>

              {/* Call Intelligence */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 12, letterSpacing: "-.01em" }}>
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
                        {selectedContact.callLog.duration} secs
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>SENTIMENT RATING</span>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: selectedContact.callLog.sentimentScore > 0.8 ? "var(--green)" : "var(--blue)" }}>
                          {(selectedContact.callLog.sentimentScore * 100).toFixed(0)}% Positive
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>EXTRACTED INTENT</span>
                    <p style={{ fontSize: 12.5, color: "var(--txt2)", marginTop: 4, lineHeight: 1.5 }}>
                      {selectedContact.callLog.intentExtracted}
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
                  {selectedContact.callLog.transcript.map((line, idx) => (
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
