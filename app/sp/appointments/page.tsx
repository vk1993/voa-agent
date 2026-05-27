"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  X,
  Phone,
} from "lucide-react";

interface Appointment {
  id: string;
  name: string;
  type: "Showroom Walkthrough" | "Site Measurement" | "Designer Consult";
  timestamp: string;
  location: string;
  assignedAgent: string;
  status: "Scheduled" | "Confirmed" | "Completed";
  notes: string;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    name: "Priya Nair",
    type: "Showroom Walkthrough",
    timestamp: "Next Sunday, 11:00 AM",
    location: "HSR Layout Showroom (Live Experience Zone)",
    assignedAgent: "Visal Kumar",
    status: "Confirmed",
    notes: "Particularly interested in modular kitchen cabinets and high-gloss acrylic finishes.",
  },
  {
    id: "apt-2",
    name: "Sneha Sen",
    type: "Showroom Walkthrough",
    timestamp: "Next Saturday, 3:00 PM",
    location: "HSR Layout Showroom (Live Experience Zone)",
    assignedAgent: "Shalini Padhy",
    status: "Confirmed",
    notes: "4BHK Sarjapur Road villa. Needs Italian marble and smart home automation walkthrough.",
  },
  {
    id: "apt-3",
    name: "Arjun Reddy",
    type: "Site Measurement",
    timestamp: "Tomorrow, 10:00 AM",
    location: "Indiranagar Duplex site",
    assignedAgent: "Visal Kumar",
    status: "Scheduled",
    notes: "Acrylic finishes verification. Kitchen wall dimensions check.",
  },
];

export default function SalesAgentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  
  // WhatsApp reminder feedback state
  const [whatsappSentId, setWhatsappSentId] = useState<string | null>(null);

  const handleSendReminder = (id: string) => {
    setWhatsappSentId(id);
    setTimeout(() => setWhatsappSentId(null), 3000);
  };

  const handleToggleStatus = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status === "Scheduled" ? "Confirmed" : "Completed";
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  return (
    <DashboardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: "var(--font-sans), sans-serif" }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>My Showroom & Site Schedules</h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", marginTop: 4 }}>
            Coordinate site measurements, lock live experience zone appointments, and send automated WhatsApp reminders.
          </p>
        </div>

        {/* Dynamic split layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: 30, alignItems: "start" }}>
          
          {/* Left panel: List of appointments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} style={{ color: "var(--green)" }} />
              <span>Schedules Calendar Bookings</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {appointments.map((a) => {
                let statusCol = "var(--gold)";
                if (a.status === "Confirmed") statusCol = "var(--green)";
                else if (a.status === "Completed") statusCol = "var(--blue)";

                const isReminderSent = whatsappSentId === a.id;

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedApt(a)}
                    className="glass-panel"
                    style={{
                      padding: 24,
                      cursor: "pointer",
                      border: selectedApt?.id === a.id ? "1px solid var(--green)" : "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--gold)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                          {a.type}
                        </span>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)", marginTop: 4 }}>{a.name}</h3>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: statusCol,
                          background: `color-mix(in srgb, ${statusCol} 10%, transparent)`,
                          border: `0.5px solid color-mix(in srgb, ${statusCol} 20%, transparent)`,
                          letterSpacing: ".04em",
                        }}
                      >
                        {a.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: "var(--txt2)", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={13} style={{ color: "var(--txt3)" }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.timestamp}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={13} style={{ color: "var(--txt3)" }} />
                        <span>{a.location}</span>
                      </div>
                    </div>

                    {/* Actions inside card */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14 }}>
                      <span style={{ fontSize: 11, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <User size={12} />
                        Assigned Designer: {a.assignedAgent}
                      </span>
                      
                      <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSendReminder(a.id)}
                          disabled={isReminderSent}
                          style={{
                            height: 30,
                            padding: "0 10px",
                            borderRadius: 6,
                            border: isReminderSent ? "1px solid var(--green)" : "1px solid rgba(255,255,255,0.08)",
                            background: isReminderSent ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                            color: isReminderSent ? "var(--green)" : "var(--txt2)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: isReminderSent ? "default" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <MessageSquare size={11} />
                          <span>{isReminderSent ? "WhatsApp Sent!" : "WhatsApp Confirmation"}</span>
                        </button>

                        {a.status !== "Completed" && (
                          <button
                            onClick={() => handleToggleStatus(a.id)}
                            style={{
                              height: 30,
                              padding: "0 10px",
                              borderRadius: 6,
                              border: "none",
                              background: "rgba(255,255,255,0.04)",
                              color: "var(--txt)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Advance
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Scheduling guidelines & Notes preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Schedule Details & Notes</h2>
            
            {selectedApt ? (
              <div className="glass-panel" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--green)", letterSpacing: ".1em" }}>
                    DETAILED BOOKING LOG
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", marginTop: 4 }}>{selectedApt.name}</h3>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>APPOINTMENT CATEGORY</span>
                    <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{selectedApt.type}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>APPOINTMENT TIME</span>
                    <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, fontFamily: "var(--font-mono)", color: "var(--green)" }}>
                      📅 {selectedApt.timestamp}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>LOCATION ADDRESS</span>
                    <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>📍 {selectedApt.location}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 9.5, color: "var(--txt3)", fontFamily: "var(--font-mono)" }}>DESIGNER SUMMARY NOTES</span>
                    <p style={{ fontSize: 12.5, color: "var(--txt2)", marginTop: 6, lineHeight: 1.5 }}>
                      {selectedApt.notes}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: 30, color: "var(--txt3)", fontSize: 13, textAlign: "center" }}>
                Select an appointment from the list to view detailed designer logs, site directions, and specific requirement notes.
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
