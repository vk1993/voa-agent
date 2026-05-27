"use client";

import React, { useState, useEffect, ViewTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Bell, Sparkles, LogOut, ChevronDown } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [role, setRole] = useState<"ADMIN" | "SALES_AGENT">("ADMIN");
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Read current role from cookies on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
      };
      
      const session = getCookie("session");
      if (session) {
        try {
          const user = JSON.parse(decodeURIComponent(session));
          if (user && user.role) {
            setRole(user.role);
          }
        } catch (e) {
          // Fallback to cookie setter below if parsing fails
        }
      } else {
        // If no session exists, default to ADMIN for easy exploration
        const defaultUser = { role: "ADMIN", email: "priya.nair@voxa.ai" };
        document.cookie = `session=${encodeURIComponent(JSON.stringify(defaultUser))}; path=/`;
      }
    }
  }, [pathname]);

  const handleRoleChange = (newRole: "ADMIN" | "SALES_AGENT") => {
    setRole(newRole);
    setShowRoleMenu(false);

    if (typeof document !== "undefined") {
      const user = { role: newRole, email: newRole === "ADMIN" ? "priya.nair@voxa.ai" : "visal.kumar@voxa.ai" };
      // Set the session cookie so that proxy.ts correctly identifies the role
      document.cookie = `session=${encodeURIComponent(JSON.stringify(user))}; path=/`;
      
      // Perform routing redirects based on role change
      if (newRole === "SALES_AGENT") {
        router.push("/sp/pipeline");
      } else {
        router.push("/admin/contacts");
      }
    }
  };

  const handleSignOut = () => {
    if (typeof document !== "undefined") {
      // Clear the cookie by setting max-age to 0
      document.cookie = "session=; path=/; max-age=0";
      router.push("/");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)" }}>
      {/* Dynamic left sidebar */}
      <Sidebar role={role} userEmail={role === "ADMIN" ? "priya.nair@voxa.ai" : "visal.kumar@voxa.ai"} />

      {/* Main Content Area */}
      <div style={{ marginLeft: 260, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Top Navbar */}
        <header
          style={{
            height: 64,
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(7, 8, 11, 0.7)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 90,
            viewTransitionName: "site-header", // Persistent stationary site-header in dashboards!
          }}
        >
          {/* Page Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", letterSpacing: ".02em" }}>
              {role === "ADMIN" ? "Bangalore Luxury Interiors Admin Console" : "Enterprise VoIP Outbound Pipeline"}
            </span>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            
            {/* Interactive Role Switcher Toggle */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--txt)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <span>Session Scope: </span>
                <span style={{ color: role === "ADMIN" ? "var(--gold)" : "var(--blue)" }}>
                  {role === "ADMIN" ? "Administrator" : "Sales Agent"}
                </span>
                <ChevronDown size={14} style={{ color: "var(--txt3)" }} />
              </button>
              {showRoleMenu && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    width: 160,
                    background: "#0c0d14",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                    padding: 6,
                    zIndex: 200,
                  }}
                >
                  <button
                    onClick={() => handleRoleChange("ADMIN")}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: role === "ADMIN" ? "rgba(255,255,255,0.04)" : "transparent",
                      color: role === "ADMIN" ? "var(--gold)" : "var(--txt2)",
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    Admin Console
                  </button>
                  <button
                    onClick={() => handleRoleChange("SALES_AGENT")}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: role === "SALES_AGENT" ? "rgba(255,255,255,0.04)" : "transparent",
                      color: role === "SALES_AGENT" ? "var(--blue)" : "var(--txt2)",
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    Sales Agent
                  </button>
                </div>
              )}
            </div>

            {/* Notification Dot */}
            <div
              className="glass-panel"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={16} style={{ color: "var(--txt2)" }} />
              <div
                style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 6px var(--gold)",
                }}
              />
            </div>

            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

            {/* Logout Action */}
            <button
              onClick={handleSignOut}
              style={{
                height: 36,
                padding: "0 10px",
                border: "none",
                background: "transparent",
                color: "var(--txt2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--txt)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--txt2)"}
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Content Box with native View Transition on Route changes */}
        <div style={{ flex: 1, padding: 40, overflowY: "auto" }}>
          <ViewTransition
            key={pathname}
            name="dashboard-content"
            share="auto"
            enter="auto"
            default="none"
          >
            <div>
              {children}
            </div>
          </ViewTransition>
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;
