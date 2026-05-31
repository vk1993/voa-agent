"use client";
import { useEffect, useState } from "react";
import { getVerticalConfig, VerticalConfig, VERTICALS } from "@/lib/domain-config";

interface TenantData {
  vertical:          string;
  config:            Record<string, any>;
  onboardingComplete: boolean;
}

export function useTenantContext() {
  const [tenant, setTenant]   = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        setTenant(data.tenant || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const verticalConfig: VerticalConfig = tenant?.vertical
    ? getVerticalConfig(tenant.vertical)
    : VERTICALS.custom;

  // Merge tenant_context overrides on top of vertical defaults
  const persona = tenant?.config?.persona || {};

  return {
    loading,
    tenant,
    vertical:          verticalConfig,
    // Labels — read from tenant_context first, fall back to vertical defaults
    meetingLabel:      persona.primary_goal    || verticalConfig.meetingLabel,
    locationLabel:     verticalConfig.locationLabel,
    contactRoleLabel:  verticalConfig.contactRoleLabel,
    kpiLabel:          verticalConfig.kpiLabel,
    outcomeLabel:      verticalConfig.outcomeLabel,
    agentName:         persona.agent_name      || verticalConfig.agentNameDefault,
    companyName:       persona.company_name    || "Your Company",
    assetLabel:        verticalConfig.assetLabel,
  };
}
