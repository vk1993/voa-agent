"use client";

import React, { useState, useEffect } from "react";
import { OnboardingData } from "../page";
import { VERTICALS } from "@/lib/domain-config";

interface StepServicesProps {
  data: OnboardingData;
  onNext: (stepData: Partial<OnboardingData>) => void;
  onBack: () => void;
}

interface ServiceItem {
  name: string;
  rangeMin: number;
  rangeMax: number;
  leadDays: number;
}

export default function StepServices({ data, onNext, onBack }: StepServicesProps) {
  const [services, setServices] = useState<ServiceItem[]>(data.services || []);

  const v = data.verticalId ? VERTICALS[data.verticalId as keyof typeof VERTICALS] : null;

  // Determine if pricing is relevant for this vertical
  // If all default services are free / zero priced (like Healthcare clinical monograph, or Edtech Trial class), we hide pricing.
  const showPricing = v ? v.defaultServices.some((s) => s.rangeInr[0] > 0 || s.rangeInr[1] > 0) : true;

  useEffect(() => {
    if (services.length === 0 && v) {
      const mapped = (v.defaultServices || []).map((s) => ({
        name: s.name,
        rangeMin: s.rangeInr[0],
        rangeMax: s.rangeInr[1],
        leadDays: s.leadDays,
      }));
      setServices(mapped);
    }
  }, [v, services.length]);

  const handleAdd = () => {
    setServices([...services, { name: "", rangeMin: 0, rangeMax: 0, leadDays: 7 }]);
  };

  const handleRemove = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof ServiceItem, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ services });
  };

  const handleSkip = () => {
    onNext({ services: [] });
  };

  return (
    <div style={{ textAlign: "left" }} id="step-services">
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
        Your offerings & services
      </h2>
      <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32 }}>
        What B2B products or services are you promoting? Our AI uses these details to pitch to your prospects.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          {services.map((item, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: showPricing ? "1.8fr 1fr 1fr 90px 36px" : "2fr 100px 36px",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                {index === 0 && <label className="label">Service Name</label>}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="input"
                  placeholder="e.g. Premium Modular Kitchens"
                  required
                />
              </div>

              {showPricing && (
                <>
                  <div>
                    {index === 0 && <label className="label">Min Price (₹)</label>}
                    <input
                      type="number"
                      value={item.rangeMin}
                      onChange={(e) => handleChange(index, "rangeMin", parseInt(e.target.value) || 0)}
                      className="input"
                      placeholder="e.g. 200000"
                      required
                      min={0}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="label">Max Price (₹)</label>}
                    <input
                      type="number"
                      value={item.rangeMax}
                      onChange={(e) => handleChange(index, "rangeMax", parseInt(e.target.value) || 0)}
                      className="input"
                      placeholder="e.g. 500000"
                      required
                      min={0}
                    />
                  </div>
                </>
              )}

              <div>
                {index === 0 && <label className="label">Lead Days</label>}
                <input
                  type="number"
                  value={item.leadDays}
                  onChange={(e) => handleChange(index, "leadDays", parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="30"
                  required
                  min={1}
                />
              </div>

              <div>
                {index === 0 && <div className="label" style={{ height: 19 }}></div>}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius)",
                    background: "var(--red-bg)",
                    border: "none",
                    color: "var(--red)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Remove service"
                >
                  <i className="ti ti-trash" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="btn btn-outline"
          style={{ alignSelf: "flex-start", marginBottom: 20 }}
        >
          <i className="ti ti-plus" /> + Add offering
        </button>

        {/* Dynamic vertical-aware helpful tip */}
        {v && (
          <div
            style={{
              background: "var(--gold-muted)",
              border: "1px solid var(--gold-border)",
              borderRadius: "var(--radius)",
              padding: 12,
              fontSize: 12.5,
              color: "var(--gold)",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {showPricing ? (
              <span>
                🎯 <strong>Pro-Tip:</strong> The AI uses these price ranges to pre-qualify leads during calls. It will only pitch offerings that fit the budget constraints mentioned by the prospect.
              </span>
            ) : (
              <span>
                🎯 <strong>Pro-Tip:</strong> Outbound campaigns in <strong>{v.label}</strong> do not pitch pricing over the phone. Instead, the AI agent qualifies interest and shares materials (like a <em>{v.assetLabel}</em>) to secure the booking.
              </span>
            )}
          </div>
        )}

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
