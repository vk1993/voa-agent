"use client";

import React from "react";
import useTweaks from "@/components/useTweaks";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Metrics from "@/components/Metrics";
import SkillPacks from "@/components/SkillPacks";
import HowItWorks from "@/components/HowItWorks";
import Testimonial from "@/components/Testimonial";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import {
  TweaksPanel,
  TweakSection,
  TweakColor,
  TweakText,
  TweakToggle,
} from "@/components/TweaksPanel";

const TWEAK_DEFAULTS = {
  accent: "#C9A14A",
  heroCTA: "Start free trial →",
  badge: "LIVE IN 23 COUNTRIES  ·  147 ACTIVE TENANTS",
  annualPricing: true,
};

export default function VOXALandingPage() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

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

      <TweaksPanel title="VOXA Customizer">
        <TweakSection title="Brand Identity">
          <TweakColor
            label="Accent color"
            value={t.accent}
            options={["#C9A14A", "#638CFF", "#22C55E", "#E85D5D"]}
            onChange={(v) => setTweak("accent", v as string)}
          />
        </TweakSection>
        
        <TweakSection title="Hero Copy">
          <TweakText
            label="Primary CTA"
            value={t.heroCTA}
            placeholder="CTA button text"
            onChange={(v) => setTweak("heroCTA", v)}
          />
          <TweakText
            label="Badge text"
            value={t.badge}
            placeholder="Top badge notification text"
            onChange={(v) => setTweak("badge", v)}
          />
        </TweakSection>
        
        <TweakSection title="Billing & Pricing">
          <TweakToggle
            label="Show annual pricing"
            value={t.annualPricing}
            onChange={(v) => setTweak("annualPricing", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}
