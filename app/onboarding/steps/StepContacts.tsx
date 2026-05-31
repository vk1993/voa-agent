"use client";

import React, { useState } from "react";
import { OnboardingData } from "../page";
import { VERTICALS } from "@/lib/domain-config";

interface StepContactsProps {
  data: OnboardingData;
  onNext: (stepData: Partial<OnboardingData>) => void;
  onBack: () => void;
}

interface ContactItem {
  name: string;
  phone: string;
}

export default function StepContacts({ data, onNext, onBack }: StepContactsProps) {
  const [activeTab, setActiveTab] = useState<"csv" | "manual">("csv");

  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  // CSV Import States
  const [csvFile, setCsvFile] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<ContactItem[]>([]);
  const [dragging, setDragging] = useState(false);

  // Manual Input States
  const [manualContacts, setManualContacts] = useState<ContactItem[]>([
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  const handleManualChange = (index: number, field: keyof ContactItem, value: string) => {
    const updated = [...manualContacts];
    updated[index] = { ...updated[index], [field]: value };
    setManualContacts(updated);
  };

  const triggerMockCsvUpload = () => {
    setCsvFile("leads_campaign_june.csv");
    setCsvPreview([
      { name: "Rajesh Kumar", phone: "+91 98765 43210" },
      { name: "Anita Sharma", phone: "+91 91234 56789" },
      { name: "Vikram Patel", phone: "+91 99887 76655" },
      { name: "Meera Nair", phone: "+91 98989 89898" },
      { name: "Suresh Rao", phone: "+91 90000 11111" },
    ]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    triggerMockCsvUpload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "csv") {
      if (csvPreview.length === 0) return;
      onNext({ contacts: csvPreview });
    } else {
      const valid = manualContacts.filter((c) => c.name && c.phone);
      if (valid.length === 0) return;
      onNext({ contacts: valid });
    }
  };

  const totalLoaded = activeTab === "csv" ? csvPreview.length : manualContacts.filter((c) => c.name && c.phone).length;

  // Get vertical-aware CSV hints
  const getVerticalHint = () => {
    if (!v) return "Ensure your CSV has a column for 'Name' and a column for 'Phone' or 'Mobile'.";
    switch (v.id) {
      case "interior":
        return "💡 For Interior Design, we recommend uploading your Instagram ads list, website inquiry forms, or walk-in lead CSV files. Column mapping: 'Lead Name', 'Phone Number'.";
      case "real_estate":
        return "💡 For Real Estate, upload lead exports from listing portals (e.g. 99acres, Magicbricks) or Facebook Lead campaigns. Column mapping: 'Buyer Name', 'Mobile'.";
      case "construction":
        return "💡 For Construction, upload contractor referrals or estimation requests. Column mapping: 'Client Name', 'Phone'.";
      case "product":
        return "💡 For B2B Product Sales, upload trade show attendee exports, newsletter signups, or outbound prospecting lists. Column mapping: 'Contact Name', 'Phone'.";
      case "finance":
        return "💡 For Financial Services, upload policy renewal alerts or wealth Advisory requests. Column mapping: 'Customer Name', 'Phone'.";
      case "healthcare":
        return "💡 For Healthcare outreach, upload clinic directory exports, medical rep target clinics, or partner doctor lists. Column mapping: 'Doctor Name', 'Clinic Phone'.";
      case "education":
        return "💡 For Education, upload webinar signups, brochure download requests, or scholarship directory leads. Column mapping: 'Student Name', 'Mobile'.";
      default:
        return "Ensure your CSV has a column for 'Name' and a column for 'Phone' or 'Mobile'.";
    }
  };

  return (
    <div style={{ textAlign: "left" }} id="step-contacts">
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
        Import contacts
      </h2>
      <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 28 }}>
        Upload the prospect list you want your AI agent to contact first.
      </p>

      {/* Tab Selector */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "var(--bg-subtle)",
          padding: 4,
          borderRadius: "var(--radius)",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("csv")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "csv" ? "var(--bg-card)" : "transparent",
            color: activeTab === "csv" ? "var(--txt)" : "var(--txt2)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.12s",
            boxShadow: activeTab === "csv" ? "var(--shadow-sm)" : "none",
          }}
        >
          <i className="ti ti-file-type-csv" /> Upload CSV
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "manual" ? "var(--bg-card)" : "transparent",
            color: activeTab === "manual" ? "var(--txt)" : "var(--txt2)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.12s",
            boxShadow: activeTab === "manual" ? "var(--shadow-sm)" : "none",
          }}
        >
          <i className="ti ti-keyboard" /> Add Manually
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tab A: CSV Drag & Drop Upload */}
        {activeTab === "csv" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!csvFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerMockCsvUpload}
                style={{
                  border: dragging ? "2px dashed var(--gold)" : "2px dashed var(--border-strong)",
                  borderRadius: "var(--radius-lg)",
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging ? "var(--gold-muted)" : "var(--bg-card)",
                  transition: "all 0.2s",
                }}
              >
                <i
                  className="ti ti-cloud-upload"
                  style={{ fontSize: 36, color: "var(--txt3)", display: "block", marginBottom: 12 }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)", display: "block" }}>
                  Drag & drop your CSV file here
                </span>
                <span style={{ fontSize: 12, color: "var(--txt3)", display: "block", marginTop: 4 }}>
                  or click to select and auto-populate mock leads
                </span>
              </div>
            ) : (
              <div
                className="card"
                style={{ padding: 20, background: "var(--bg-card)", border: "1px solid var(--teal)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-file-check" style={{ fontSize: 20, color: "var(--teal)" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)" }}>
                      {csvFile}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvPreview([]);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--red)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Change file
                  </button>
                </div>

                {/* CSV First 5 Rows Preview */}
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Lead Name</th>
                        <th>Phone Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vertical-aware CSV instructions box */}
            <div
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 12,
                fontSize: 12.5,
                color: "var(--txt2)",
                lineHeight: 1.5,
              }}
            >
              {getVerticalHint()}
            </div>
          </div>
        )}

        {/* Tab B: Add Manually Forms */}
        {activeTab === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {manualContacts.map((contact, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleManualChange(index, "name", e.target.value)}
                  className="input"
                  placeholder={`Lead Name #${index + 1}`}
                  required={index === 0}
                />
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleManualChange(index, "phone", e.target.value)}
                  className="input"
                  placeholder={`+91 98765 4321${index}`}
                  required={index === 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Ready Badge Status Indicator */}
        {totalLoaded > 0 && (
          <div
            style={{
              alignSelf: "center",
              marginTop: 12,
            }}
          >
            <span className="badge badge-green" style={{ fontSize: 13, padding: "4px 12px" }}>
              ✓ {totalLoaded} contacts ready to call
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
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
            disabled={totalLoaded === 0}
            style={{ flex: 1, justifyContent: "center", opacity: totalLoaded === 0 ? 0.5 : 1 }}
          >
            Continue →
          </button>
        </div>
      </form>
    </div>
  );
}
