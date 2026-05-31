"use client";
import React from "react";

export default function Testimonial({ acc }: { acc: string }) {
  const reviews = [
    {
      vertical: "Interior Design",
      vColor: "#C9A14A",
      quote: "VOXA's AI called 200 cold leads over a single weekend. By Monday morning we had 14 showroom visits booked. Our sales team would have spent two full weeks manually dials to get this result.",
      initials: "PR",
      name: "Priya Rajan",
      company: "Prestige Interiors",
    },
    {
      vertical: "Real Estate",
      vColor: "#1D9E75",
      quote: "We were highly skeptical about how an AI would handle detailed property negotiations. But VOXA qualified interest and booked 31 site visits in our first month. The CRM integration is bulletproof.",
      initials: "AK",
      name: "Ankit Kulkarni",
      company: "Apex Properties",
    },
    {
      vertical: "Product Sales",
      vColor: "#8B5CF6",
      quote: "Objection handling was our biggest bottleneck. VOXA is trained on our exact SaaS playbook and handles comparisons smoothly. Our cost per product demo dropped by 60% compared to SDRs.",
      initials: "SS",
      name: "Saurabh Sharma",
      company: "TechCorp Systems",
    },
  ];

  return (
    <section id="testimonials" style={{ background: "var(--abyss)", padding: "var(--space-section) 0" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: acc, marginBottom: 14 }}>
            Customer Success
          </p>
          <h2 className="land-h2" style={{ color: "var(--warm-white)" }}>
            Loved by fast-growing B2B sales teams.
          </h2>
        </div>

        {/* Testimonial Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={i} className="glass-panel" style={{
              background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              {/* Vertical Badge */}
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 12,
                  background: `${r.vColor}18`, color: r.vColor, border: `0.5px solid ${r.vColor}40`,
                  letterSpacing: "0.04em", textTransform: "uppercase"
                }}>
                  {r.vertical}
                </span>
              </div>

              {/* Quote text */}
              <blockquote style={{
                fontFamily: "var(--font-serif)", fontSize: 18, fontStyle: "italic",
                color: "var(--warm-white)", lineHeight: 1.55, marginBottom: 28
              }}>
                "{r.quote}"
              </blockquote>

              {/* Author Profile */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `${r.vColor}24`, color: r.vColor, border: `0.5px solid ${r.vColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600
                }}>
                  {r.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--warm-white)" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    {r.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
