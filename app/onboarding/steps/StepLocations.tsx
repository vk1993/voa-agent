"use client";

import React, { useState, useEffect } from "react";
import { OnboardingData } from "../page";
import { VERTICALS } from "@/lib/domain-config";

interface StepLocationsProps {
  data: OnboardingData;
  onNext: (stepData: Partial<OnboardingData>) => void;
  onBack: () => void;
}

interface LocationItem {
  name: string;
  pincodes: string;
  contactName: string;
  contactRole: string;
  calendarId: string;
}

export default function StepLocations({ data, onNext, onBack }: StepLocationsProps) {
  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  // Check if physical locations are skipped for this vertical
  const isOnlineOnly = data.verticalId === "product" || data.verticalId === "custom";

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (locations.length === 0) {
      if (data.locations && data.locations.length > 0) {
        setLocations(data.locations);
      } else if (v && !isOnlineOnly) {
        setLocations([
          {
            name: `Main ${v.locationLabel}`,
            pincodes: "560001, 560038",
            contactName: "",
            contactRole: v.contactRoleLabel,
            calendarId: "",
          },
        ]);
      }
    }
  }, [v, data.locations, isOnlineOnly]);

  const handleConnectCalendar = () => {
    setConnecting(true);
    // Simulate OAuth Google Calendar popup window
    setTimeout(() => {
      setCalendarConnected(true);
      setConnecting(false);
      // Pre-fill calendar IDs for all active locations
      setLocations((prev) =>
        prev.map((loc) => ({ ...loc, calendarId: "primary" }))
      );
    }, 1500);
  };

  const handleAdd = () => {
    if (!v) return;
    setLocations([
      ...locations,
      { name: "", pincodes: "", contactName: "", contactRole: v.contactRoleLabel, calendarId: calendarConnected ? "primary" : "" },
    ]);
  };

  const handleRemove = (index: number) => {
    if (locations.length === 1) return;
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof LocationItem, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOnlineOnly) {
      onNext({ locations: [] });
    } else {
      onNext({ locations });
    }
  };

  const handleSkip = () => {
    onNext({ locations: [] });
  };

  if (isOnlineOnly && v) {
    return (
      <div style={{ textAlign: "left" }} id="step-locations-skipped">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--txt)",
            marginBottom: 8,
            letterSpacing: -0.02,
          }}
        >
          Calendar integrations
        </h2>
        <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
          {v.label} campaigns operate entirely online via video calls and web scheduling.
        </p>

        <div
          className="card"
          style={{
            padding: 24,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--gold-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              💻
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", marginBottom: 6 }}>
                Online Meetings Only
              </h4>
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>
                Outbound call flows will pitch scheduling a <strong>live web demo</strong> (e.g. Zoom, Google Meet) instead of physical showroom visits.
                No showroom address or postal code routing rules are required.
              </p>
            </div>
          </div>
        </div>

        {/* Google Calendar Connect */}
        <div
          className="card"
          style={{
            padding: 20,
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            border: calendarConnected ? "1px solid var(--teal)" : "0.5px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <i
              className="ti ti-brand-google"
              style={{
                fontSize: 24,
                color: calendarConnected ? "var(--teal)" : "var(--txt2)",
              }}
            />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)" }}>
                Google Calendar Connection
              </div>
              <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}>
                Allow AI to check your sales team's availability and book meetings instantly.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectCalendar}
            disabled={connecting || calendarConnected}
            className={`btn ${calendarConnected ? "badge-green" : "btn-outline"}`}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              cursor: calendarConnected ? "default" : "pointer",
            }}
          >
            {connecting
              ? "Connecting..."
              : calendarConnected
              ? "Connected ✓"
              : "Connect Google Calendar"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center" }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-gold"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Continue to Leads
          </button>
        </div>
      </div>
    );
  }

  if (!v) return null;

  return (
    <div style={{ textAlign: "left" }} id="step-locations">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--txt)",
          marginBottom: 8,
          letterSpacing: -0.02,
        }}
      >
        Add {v.locationLabel}s & centers
      </h2>
      <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
        Where can meetings or <strong>{v.meetingLabel}s</strong> be scheduled by the AI?
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 12 }}>
          {locations.map((item, index) => (
            <div
              key={index}
              className="card"
              style={{
                padding: 20,
                background: "var(--bg-card)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "none",
                    border: "none",
                    color: "var(--red)",
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <i className="ti ti-trash" /> Remove
                </button>
              )}

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--txt2)",
                  marginBottom: 4,
                }}
              >
                {v.locationLabel} #{index + 1}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">{v.locationLabel} Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    className="input"
                    placeholder={`e.g. Indiranagar ${v.locationLabel}`}
                    required
                  />
                </div>
                <div>
                  <label className="label">Covered Pincodes</label>
                  <input
                    type="text"
                    value={item.pincodes}
                    onChange={(e) => handleChange(index, "pincodes", e.target.value)}
                    className="input"
                    placeholder="e.g. 560038, 560008"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Assigned {v.contactRoleLabel}</label>
                  <input
                    type="text"
                    value={item.contactName}
                    onChange={(e) => handleChange(index, "contactName", e.target.value)}
                    className="input"
                    placeholder="e.g. Arjun Prasad"
                    required
                  />
                </div>
                <div>
                  <label className="label">Contact Person Role</label>
                  <input
                    type="text"
                    value={item.contactRole}
                    onChange={(e) => handleChange(index, "contactRole", e.target.value)}
                    className="input"
                    placeholder={`e.g. Lead ${v.contactRoleLabel}`}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: "var(--gold)",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 20,
          }}
        >
          + Add another {v.locationLabel.toLowerCase()}
        </button>

        {/* Google Calendar Connect */}
        <div
          className="card"
          style={{
            padding: 20,
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            border: calendarConnected ? "1px solid var(--teal)" : "0.5px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <i
              className="ti ti-brand-google"
              style={{
                fontSize: 24,
                color: calendarConnected ? "var(--teal)" : "var(--txt2)",
              }}
            />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)" }}>
                Google Calendar Connection
              </div>
              <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}>
                Allow AI to check salesperson real-time slots and book visits.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectCalendar}
            disabled={connecting || calendarConnected}
            className={`btn ${calendarConnected ? "badge-green" : "btn-outline"}`}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              cursor: calendarConnected ? "default" : "pointer",
            }}
          >
            {connecting
              ? "Connecting..."
              : calendarConnected
              ? "Connected ✓"
              : "Connect Google Calendar"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center" }}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-gold"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Continue
          </button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: "none",
            border: "none",
            color: "var(--txt3)",
            fontSize: 13,
            cursor: "pointer",
            marginTop: 12,
            alignSelf: "center",
          }}
        >
          Skip this step for now
        </button>
      </form>
    </div>
  );
}
