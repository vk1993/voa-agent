"use client";

import React, { useState, useEffect } from "react";
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
      const user = { role: newRole, email: "priya.nair@voxa.ai" };
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
      <Sidebar role={role} />

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
            background: "rgba(15, 15, 18, 0.7)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          {/* Page Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt2)" }}>
              Bangalore Luxury Interiors Dashboard
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
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--txt)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <span>Role: </span>
                <span style={{ color: role === "ADMIN" ? "var(--gold)" : "var(--blue)" }}>
                  {role === "ADMIN" ? "Admin" : "Sales Agent"}
                </span>
                <ChevronDown size={14} style={{ color: "var(--txt3)" }} />
              </button>
              {showRoleMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    width: 150,
                    background: "#15151A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                    padding: 4,
                    zIndex: 200,
                  }}
                >
                  <button
                    onClick={() => handleRoleChange("ADMIN")}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: role === "ADMIN" ? "rgba(255,255,255,0.04)" : "transparent",
                      color: role === "ADMIN" ? "var(--gold)" : "var(--txt2)",
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    Admin Mode
                  </button>
                  <button
                    onClick={() => handleRoleChange("SALES_AGENT")}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: role === "SALES_AGENT" ? "rgba(255,255,255,0.04)" : "transparent",
                      color: role === "SALES_AGENT" ? "var(--blue)" : "var(--txt2)",
                      fontSize: 12,
                      fontWeight: 500,
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
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
                position: "relative",
              }}
            >
              <Bell size={16} style={{ color: "var(--txt2)" }} />
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                }}
              />
            </div>

            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

            {/* Logout Action */}
            <button
              onClick={handleSignOut}
              style={{
                height: 36,
                padding: "0 12px",
                border: "none",
                background: "transparent",
                color: "var(--txt2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div style={{ flex: 1, padding: 40, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;
