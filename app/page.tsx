"use client";

import React from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Metrics from "@/components/Metrics";
import SkillPacks from "@/components/SkillPacks";
import HowItWorks from "@/components/HowItWorks";
import Testimonial from "@/components/Testimonial";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const TWEAK_DEFAULTS = {
  accent: "#C9A14A",
  heroCTA: "Start free trial →",
  badge: "LIVE IN 23 COUNTRIES  ·  147 ACTIVE TENANTS",
  annualPricing: true,
};

export default function VOXALandingPage() {
  const t = TWEAK_DEFAULTS;

  return (
    <>
      <Nav acc={t.accent} />
      
      <main id="main-content">
        <Hero acc={t.accent} badge={t.badge} cta={t.heroCTA} />
        
        <Metrics acc={t.accent} />
        
        <SkillPacks acc={t.accent} />
        
        <HowItWorks acc={t.accent} />
        
        <Testimonial acc={t.accent} />
        
        <Pricing acc={t.accent} annualPricing={t.annualPricing} />
      </main>

      <Footer acc={t.accent} />
    </>
  );
}

