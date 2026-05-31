import React from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Verticals from "@/components/Verticals";
import HowItWorks from "@/components/HowItWorks";
import Metrics from "@/components/Metrics";
import Testimonial from "@/components/Testimonial";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function VOXALandingPage() {
  const accent = "#C9A14A";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--txt)" }}>
      {/* Sticky header navigation */}
      <Nav acc={accent} />

      {/* Main page content sections */}
      <main>
        {/* Dynamic rotating vertical hero */}
        <Hero
          acc={accent}
          badge="One platform · Every B2B vertical"
          cta="Start free — 50 calls included"
        />

        {/* Unified performance metrics */}
        <Metrics acc={accent} />

        {/* Numbered generic how it works & tech stack details */}
        <HowItWorks acc={accent} />

        {/* 8-vertical grid and statistics mapping */}
        <Verticals acc={accent} />

        {/* 3-column side-by-side client testimonials */}
        <Testimonial acc={accent} />

        {/* Pay-as-you-go call pricing structures */}
        <Pricing acc={accent} annualPricing={true} />
      </main>

      {/* Corporate compliance footer */}
      <Footer acc={accent} />
    </div>
  );
}
