"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Megaphone,
  FileText,
  Settings,
  FolderKanban,
  PhoneCall,
  Calendar,
  User,
  Users,
  Shield,
  PhoneForwarded,
  Home,
  Activity,
  Layers,
  BarChart2,
  Award,
} from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "SALES_AGENT" | "READ_ONLY";
  userEmail: string;
  userName: string;
  tenantName: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export function Sidebar({ role, userEmail, userName, tenantName }: SidebarProps) {
  const pathname = usePathname() || "";

  // Menu lists based on user role
  const adminMenu: MenuItem[] = [
    { name: "Overview", href: "/admin", icon: Home },
    { name: "Live Monitor", href: "/admin/live", icon: Activity },
    { name: "Contacts", href: "/admin/contacts", icon: Users },
    { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
    { name: "Scripts", href: "/admin/scripts", icon: FileText },
    { name: "Skill Packs", href: "/admin/skill-packs", icon: Layers },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Call Review", href: "/admin/call-review", icon: PhoneCall },
    { name: "Team", href: "/admin/team", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const agentMenu: MenuItem[] = [
    { name: "My Pipeline", href: "/sp/pipeline", icon: FolderKanban },
    { name: "My Calls", href: "/sp/calls", icon: PhoneCall },
    { name: "My Appointments", href: "/sp/appointments", icon: Calendar },
    { name: "My Performance", href: "/sp/performance", icon: Award },
  ];

  const readOnlyMenu: MenuItem[] = [
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Call Review", href: "/call-review", icon: PhoneCall },
    { name: "Contacts (view)", href: "/contacts", icon: Users },
  ];

  const currentMenu =
    role === "ADMIN"
      ? adminMenu
      : role === "SALES_AGENT"
      ? agentMenu
      : readOnlyMenu;

  return (
    <aside
      style={{
        width: 260,
        height: "100vh",
        background: "rgba(21, 21, 26, 0.85)",
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Sidebar Header */}
      <Link
        href="/"
        style={{
          height: 64,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          textDecoration: "none",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: role === "ADMIN" ? "var(--gold)" : "var(--blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0F0F12",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          V
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: ".06em",
              color: "var(--txt)",
            }}
          >
            VOXA PANEL
          </span>
          <span style={{ fontSize: 9, color: "var(--txt3)", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <Shield size={9} style={{ color: role === "ADMIN" ? "var(--gold)" : "var(--blue)" }} />
            {role === "ADMIN" ? "ADMIN MODE" : role === "SALES_AGENT" ? "SALES AGENT" : "READ ONLY"}
          </span>
        </div>
      </Link>

      {/* Sidebar Navigation */}
      <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--txt3)",
            letterSpacing: ".1em",
            marginBottom: 10,
            paddingLeft: 8,
          }}
        >
          NAVIGATION
        </div>
        {currentMenu.map((item) => {
          const Icon = item.icon;
          // Clean, dynamic active path validation covering nested routing
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--txt)" : "var(--txt2)",
                background: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
                border: isActive
                  ? `1px solid rgba(255, 255, 255, 0.06)`
                  : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
              className="group"
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? (role === "ADMIN" ? "var(--gold)" : "var(--blue)") : "var(--txt3)",
                  transition: "color 0.2s ease",
                }}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer User Info */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.03)",
          background: "rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={14} style={{ color: "var(--txt2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--txt)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--txt3)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userEmail}
            </span>
          </div>
        </div>
        
        {/* Active Tenant Label */}
        <div style={{ fontSize: 9, color: "var(--gold)", fontWeight: 600, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
          🏢 {tenantName.toUpperCase()}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
