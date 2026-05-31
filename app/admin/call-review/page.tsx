"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useTenantContext } from "@/hooks/useTenantContext";
import {
  ClipboardList,
  Filter,
  PhoneCall,
  Clock,
  Sparkles,
  Smile,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  FileText,
} from "lucide-react";

interface CallTurn {
  role: "AI" | "USER";
  text: string;
}

interface CallReviewData {
  id: string;
  contactName: string;
  campaign: string;
  agent: string;
  duration: string;
  sentimentScore: number;
  date: string;
  outcome: "Booked ✓" | "WhatsApp Sent ✓" | "Follow-up" | "Not Interested" | "DND Added";
  transcript: CallTurn[];
}

const MOCK_CALL_REVIEWS: CallReviewData[] = [
  {
    id: "r-1",
    contactName: "Priya Nair",
    campaign: "Bangalore Luxury 3BHK Outbound",
    agent: "Arjun Reddy",
    duration: "2m 14s",
    sentimentScore: 88,
    date: "2026-05-30",
    outcome: "Booked ✓",
    transcript: [
      { role: "AI", text: "Hello Priya, this is VOXA on behalf of Prestige Premium Interiors. Am I speaking with you?" },
      { role: "USER", text: "Yes, this is Priya. I was looking at your modular kitchen portfolios." },
      { role: "AI", text: "Fabulous. We have high-gloss acrylic modular cabinets and modern space-saving wardrobes. What BHK layout is your flat?" },
      { role: "USER", text: "It's a luxury 3BHK flat in HSR Layout." },
      { role: "AI", text: "Excellent! HSR Layout flats match beautifully with our premium catalog. Our design experts have a live experience zone walkthrough there next Sunday. Would you like to reserve a walkthrough slot at 11 AM?" },
      { role: "USER", text: "Yes, HSR Layout showroom walkthrough next Sunday at 11 AM works for us. Please book that." },
      { role: "AI", text: "Wonderful. I have booked your walkthrough for next Sunday at 11 AM at the HSR Layout Showroom. See you there!" }
    ]
  },
  {
    id: "r-2",
    contactName: "Arjun Reddy",
    campaign: "Electronic City Budget 2BHK Enquiries",
    agent: "Sneha Rao",
    duration: "1m 32s",
    sentimentScore: 72,
    date: "2026-05-29",
    outcome: "Follow-up",
    transcript: [
      { role: "AI", text: "Hi Arjun, this is VOXA from Space Optimizer Designs. How are you today?" },
      { role: "USER", text: "Hello, yeah. I wanted to know the starting pricing for modular wardrobe closets for a 2BHK." },
      { role: "AI", text: "We have space-saving modular wardrobes starting from 1.5 Lakhs in Electronic City. What kind of materials do you prefer? High-gloss laminate or matte?" },
      { role: "USER", text: "Matte is fine, but I need to consult my wife first on the budget." },
      { role: "AI", text: "That is completely understandable. Would it be alright if I follow up on WhatsApp with some matte wardrobe style portfolios?" },
      { role: "USER", text: "Sure, WhatsApp me the catalogs and we'll check it out." }
    ]
  },
  {
    id: "r-3",
    contactName: "Sneha Rao",
    campaign: "Indiranagar Kitchen Remodel Callback",
    agent: "Visal Kumar",
    duration: "2m 45s",
    sentimentScore: 91,
    date: "2026-05-30",
    outcome: "WhatsApp Sent ✓",
    transcript: [
      { role: "AI", text: "Hello Sneha, I'm calling from VOXA Kitchen Specialist Hub. You requested callback regarding modular kitchen remodels." },
      { role: "USER", text: "Yes, I have an old kitchen in Indiranagar. I want to swap it with German soft-close fittings and high-gloss acrylic shutters." },
      { role: "AI", text: "That sounds like a beautiful upgrade. Acrylic shutters are waterproof and highly durable. Do you have an estimate of the counter length?" },
      { role: "USER", text: "Roughly 10 feet straight layout." },
      { role: "AI", text: "Great. I will trigger an instant WhatsApp message to your phone right now with our Indiranagar German acrylic design portfolio. Did you receive it?" },
      { role: "USER", text: "Ah yes! I got the link on WhatsApp, thank you." }
    ]
  },
  {
    id: "r-4",
    contactName: "Rahul Mehta",
    campaign: "Sarjapur Luxury Duplex & Villa Pipeline",
    agent: "Arjun Reddy",
    duration: "1m 15s",
    sentimentScore: 45,
    date: "2026-05-28",
    outcome: "Not Interested",
    transcript: [
      { role: "AI", text: "Hello Rahul, this is VOXA Outbound on behalf of Prestige Luxury Duplex. Is this a good time to speak?" },
      { role: "USER", text: "I'm busy right now." },
      { role: "AI", text: "No problem. I understand you recently bought a duplex in Sarjapur and are looking for premium structure consulting." },
      { role: "USER", text: "No, we actually hired a local carpenter for the entire interior work. So we are good." },
      { role: "AI", text: "Ah, local carpenters might lack structural warranty, but I understand. Thank you for your time." }
    ]
  },
  {
    id: "r-5",
    contactName: "Kavya Singh",
    campaign: "Bangalore Luxury 3BHK Outbound",
    agent: "Sneha Rao",
    duration: "58s",
    sentimentScore: 35,
    date: "2026-05-29",
    outcome: "DND Added",
    transcript: [
      { role: "AI", text: "Hello Kavya, this is VOXA outbound sales call. How are you today?" },
      { role: "USER", text: "Look, please stop calling this number. I'm not interested in design packages." },
      { role: "AI", text: "I understand, Kavya. I will register this number on our do-not-call registry list immediately. Sorry to disturb you." }
    ]
  }
];

const QA_CRITERIA = [
  { id: "c1", label: "Greeting quality" },
  { id: "c2", label: "Objection handling" },
  { id: "c3", label: "Booking attempt made" },
  { id: "c4", label: "Script adherence" },
  { id: "c5", label: "Positive close" }
];

export default function CallReviewPage() {
  const { meetingLabel } = useTenantContext();
  const [reviews, setReviews] = useState<CallReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [qaNotes, setQaNotes] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Filters state
  const [selectedCampaign, setSelectedCampaign] = useState("All");
  const [selectedOutcome, setSelectedOutcome] = useState("All");

  useEffect(() => {
    async function fetchCallLogs() {
      try {
        const res = await fetch("/api/call-logs?limit=50");
        const data = await res.json();
        if (data.success && Array.isArray(data.callLogs)) {
          const mapped: CallReviewData[] = data.callLogs.map((cl: any) => ({
            id: cl.id,
            contactName: cl.contact?.name || "Unknown",
            campaign: cl.campaign?.name || "No Campaign",
            agent: cl.assignedAgentId || "—",
            duration: `${Math.floor((cl.durationSeconds || 0) / 60)}m ${((cl.durationSeconds || 0) % 60)}s`,
            sentimentScore: cl.sentimentScore ? Math.round(cl.sentimentScore * 100) : 0,
            date: new Date(cl.createdAt).toISOString().split("T")[0],
            outcome: cl.outcomeType === "BOOKED" ? "Booked ✓"
              : cl.outcomeType === "CALLBACK_REQUESTED" ? "Follow-up"
              : cl.outcomeType === "DND" ? "DND Added"
              : cl.outcomeType === "NOT_INTERESTED" ? "Not Interested"
              : "WhatsApp Sent ✓",
            transcript: [], // Transcript comes from contact detail if needed
          }));
          setReviews(mapped);
          if (mapped.length > 0) setSelectedId(mapped[0].id);
        }
      } catch (err) {
        console.error("Failed to load call logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCallLogs();
  }, []);

  const currentCall = reviews.find((r) => r.id === selectedId) || reviews[0] || null;

  const handleCheckboxChange = (id: string) => {
    setCheckedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCriteria = QA_CRITERIA.filter((c) => !!checkedCriteria[c.id]).map((c) => c.label);
    if (activeCriteria.length === 0 || !currentCall) return;

    try {
      const score = Math.round((activeCriteria.length / QA_CRITERIA.length) * 100);
      const res = await fetch(`/api/call-logs/${currentCall.id}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: activeCriteria, score, note: qaNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage("QA Score submitted successfully ✓");
        setTimeout(() => setToastMessage(""), 3500);
        setCheckedCriteria({});
        setQaNotes("");
      }
    } catch (err) {
      console.error("QA submit failed:", err);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const campMatch = selectedCampaign === "All" || r.campaign === selectedCampaign;
    const outcomeMatch = selectedOutcome === "All" || r.outcome === selectedOutcome;
    return campMatch && outcomeMatch;
  });

  const isSubmitDisabled = Object.values(checkedCriteria).filter(Boolean).length === 0 || !currentCall;

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "var(--font-sans), sans-serif", height: "calc(100vh - 120px)", overflow: "hidden" }}>
        
        {/* Style sheet for transitions */}
        <style>{`
          .call-row-active {
            border: 1px solid var(--gold) !important;
            background: rgba(201, 161, 74, 0.04) !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
        `}</style>

        {/* Page Title */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Synthesized Call Review</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Trace OIDC outbound conversation metrics, audit synthesized turn transcripts, and checklist QA score guidelines.
          </p>
        </div>

        {/* Main Split Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, flex: 1, overflow: "hidden", minHeight: 0 }}>
          
          {/* Left Panel: Call Filters & Clickable List */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, overflow: "hidden" }}>
            
            {/* Filter Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                <Filter size={14} />
                <span>FILTER DIRECTORY</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Campaign Selector */}
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  style={{
                    height: 32,
                    fontSize: 11,
                    background: "#0c0d12",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    padding: "0 6px",
                    color: "var(--txt2)",
                  }}
                >
                  <option value="All">All Campaigns</option>
                  <option value="Bangalore Luxury 3BHK Outbound">Luxury 3BHK</option>
                  <option value="Electronic City Budget 2BHK Enquiries">Budget 2BHK</option>
                  <option value="Indiranagar Kitchen Remodel Callback">Kitchen Callback</option>
                  <option value="Sarjapur Luxury Duplex & Villa Pipeline">Duplex & Villa</option>
                </select>

                {/* Outcome Selector */}
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  style={{
                    height: 32,
                    fontSize: 11,
                    background: "#0c0d12",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    padding: "0 6px",
                    color: "var(--txt2)",
                  }}
                >
                  <option value="All">All Outcomes</option>
                  <option value="Booked ✓">Booked</option>
                  <option value="WhatsApp Sent ✓">WhatsApp</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="DND Added">DND Added</option>
                </select>
              </div>
            </div>

            {/* Scrollable Call List Container */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  const isActive = review.id === selectedId;
                  let sentimentColor = "var(--green)";
                  if (review.sentimentScore > 80) sentimentColor = "var(--green)";
                  else if (review.sentimentScore > 50) sentimentColor = "#F59E0B";
                  else sentimentColor = "#E85D5D";

                  return (
                    <div
                      key={review.id}
                      onClick={() => setSelectedId(review.id)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.01)",
                        border: isActive ? "1px solid var(--gold)" : "1px solid rgba(255, 255, 255, 0.04)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: "all 0.2s ease",
                      }}
                      className={isActive ? "call-row-active" : ""}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{review.contactName}</span>
                        <span style={{ fontSize: 10, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>
                          {review.date}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--txt2)" }}>
                        <span>Agent: {review.agent}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)" }}>
                          <Clock size={11} />
                          <span>{review.duration}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            color: "var(--gold)",
                            background: "rgba(201, 161, 74, 0.08)",
                          }}
                        >
                          {review.outcome === "Booked ✓" ? `${meetingLabel} ✓` : review.outcome}
                        </span>
                        
                        <span style={{ fontSize: 11, fontWeight: 700, color: sentimentColor, fontFamily: "var(--font-mono)" }}>
                          {review.sentimentScore}% Pos
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>
                  No call logs matched your filter selections.
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Detailed Call Review Viewer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
            
            {/* Scrollable Main Content Zone */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, paddingRight: 6 }}>
              
              {!currentCall ? (
                <div style={{ padding: 60, textAlign: "center", color: "var(--txt3)", fontSize: 14 }}>
                  {loading ? "Loading call logs..." : "No call logs available. Calls will appear here after they are completed."}
                </div>
              ) : (<>
              <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--gold)", letterSpacing: ".15em" }}>
                      TURN-BY-TURN TRANSCRIPT AUDITING
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{currentCall.contactName}</h2>
                  </div>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 6,
                      color: "var(--gold)",
                      background: "rgba(201, 161, 74, 0.1)",
                      border: "0.5px solid rgba(201, 161, 74, 0.25)",
                      letterSpacing: ".05em",
                    }}
                  >
                    {currentCall.outcome === "Booked ✓" ? `${meetingLabel.toUpperCase()} ✓` : currentCall.outcome.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>VOICE PIPELINE</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>{currentCall.campaign}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>ASSIGNED AGENT</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>👤 {currentCall.agent}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>CALL DURATION</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, fontFamily: "var(--font-mono)", color: "var(--gold)" }}>
                      ⏳ {currentCall.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Turns Transcript Box */}
              <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 6 }}>
                  <PhoneCall size={16} style={{ color: "var(--gold)" }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Symmetric Conversation Flow</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {currentCall.transcript.map((turn, idx) => {
                    const isAi = turn.role === "AI";
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: isAi ? "rgba(201, 161, 74, 0.04)" : "rgba(255, 255, 255, 0.02)",
                          border: isAi ? "1px solid rgba(201, 161, 74, 0.08)" : "1px solid rgba(255, 255, 255, 0.04)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8.5,
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: isAi ? "var(--gold)" : "var(--blue)",
                            letterSpacing: ".04em",
                          }}
                        >
                          {isAi ? "AI VOICE AGENT" : "PROSPECT"}
                        </span>
                        <p style={{ fontSize: 12.5, color: isAi ? "var(--txt)" : "var(--txt2)", lineHeight: 1.5 }}>
                          {turn.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QA Checklist Grading Section */}
              <div className="glass-panel" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 18 }}>
                  <ShieldCheck size={16} style={{ color: "var(--teal)" }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>QA Quality Assurance Checklist</h3>
                </div>

                <form onSubmit={handleQaSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  
                  {toastMessage && (
                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        color: "var(--green)",
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>{toastMessage}</span>
                    </div>
                  )}

                  {/* Criteria Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                    {QA_CRITERIA.map((crit) => {
                      const isChecked = !!checkedCriteria[crit.id];
                      return (
                        <div
                          key={crit.id}
                          onClick={() => handleCheckboxChange(crit.id)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: isChecked ? "rgba(20, 184, 166, 0.05)" : "rgba(255,255,255,0.01)",
                            border: isChecked ? "1px solid var(--teal)" : "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <CheckSquare size={14} style={{ color: isChecked ? "var(--teal)" : "var(--txt3)" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: isChecked ? "var(--txt)" : "var(--txt2)" }}>
                            {crit.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Textarea Notes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: ".05em" }}>
                      AUDITOR QA EVALUATION FEEDBACK
                    </label>
                    <textarea
                      placeholder="Input granular feedback points, script divergence, or objection failure notes..."
                      value={qaNotes}
                      onChange={(e) => setQaNotes(e.target.value)}
                      className="glass-input"
                      style={{
                        height: 90,
                        padding: 12,
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        resize: "none",
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    style={{
                      height: 38,
                      borderRadius: 8,
                      background: isSubmitDisabled ? "rgba(255,255,255,0.03)" : "var(--teal)",
                      color: isSubmitDisabled ? "var(--txt3)" : "#0F0F12",
                      fontSize: 12.5,
                      fontWeight: 700,
                      border: isSubmitDisabled ? "1px solid rgba(255,255,255,0.04)" : "none",
                      cursor: isSubmitDisabled ? "default" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      alignSelf: "flex-end",
                      padding: "0 20px",
                      boxShadow: isSubmitDisabled ? "none" : "0 4px 12px rgba(20,184,166,0.15)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>Submit QA Audited Score</span>
                  </button>

                </form>
              </div>

              </>)}
            </div>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
