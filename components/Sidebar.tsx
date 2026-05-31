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
  Users,
  Shield,
  Home,
  Activity,
  Layers,
  BarChart2,
  Award,
  LogOut,
  Moon,
  Sun,
  X
} from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "SALES_AGENT" | "READ_ONLY";
  userEmail: string;
  userName: string;
  tenantName: string;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export function Sidebar({
  role,
  userEmail,
  userName,
  tenantName,
  theme,
  onThemeToggle,
  isMobileOpen = false,
  onMobileClose
}: SidebarProps) {
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

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "VX";

  return (
    <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
      {/* Mobile Close Button */}
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          className="sidebar-close-btn"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "transparent",
            border: "none",
            color: "var(--txt3)",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
          }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      )}

      {/* Sidebar Header / Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--gold)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--abyss)",
              fontFamily: "var(--font-display)",
            }}
          >
            V
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--txt)",
                letterSpacing: -0.02,
              }}
            >
              VOXA
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--txt3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              AI Sales
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          marginTop: 12,
        }}
      >
        <div className="nav-section-label">Navigation</div>
        {currentMenu.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Bottom Info Drawer */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Theme Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--txt2)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {theme === "dark" ? (
              <Moon size={14} style={{ color: "var(--gold)" }} />
            ) : (
              <Sun size={14} style={{ color: "var(--txt3)" }} />
            )}
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </span>
          <button
            className="theme-toggle"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={onThemeToggle}
            aria-label="Toggle dark mode"
          />
        </div>

        {/* User Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "4px 8px",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--gold-muted)",
              border: "0.5px solid var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--txt)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--txt3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono)",
              }}
            >
              {userEmail}
            </span>
          </div>
        </div>

        {/* Dynamic Tenant and Sign Out Button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 8px 4px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--gold)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            🏢 {tenantName.toUpperCase()}
          </div>
          <button
            onClick={() => {
              if (typeof document !== "undefined") {
                document.cookie =
                  "session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                window.location.href = "/";
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-subtle)",
              border: "0.5px solid var(--border)",
              color: "var(--txt2)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.12s",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--border-strong)";
              e.currentTarget.style.color = "var(--txt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-subtle)";
              e.currentTarget.style.color = "var(--txt2)";
            }}
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
