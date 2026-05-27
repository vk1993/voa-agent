"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Bell, Sparkles, LogOut, Shield } from "lucide-react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

interface DashboardShellProps {
  children: React.ReactNode;
}

// Locally scope standard QueryClient to prevent context collisions across routes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache B2B session client-side for 5 minutes
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent>{children}</DashboardContent>
    </QueryClientProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "";

  // Dynamic Edge-backed Session Profiler
  const { data: session, isLoading, error } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      if (!res.ok) {
        throw new Error("FAILED_TO_FETCH");
      }
      return res.json() as Promise<{
        userId: string;
        email: string;
        name: string;
        role: "ADMIN" | "SALES_AGENT" | "READ_ONLY";
        tenantId: string;
        tenantName: string;
      }>;
    },
  });

  const handleSignOut = () => {
    if (typeof document !== "undefined") {
      // Evict JWT token session cookie boundaries
      document.cookie = "session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      window.location.href = "/";
    }
  };

  // 1. Loading State: Render elegant animated premium dashboard placeholder skeleton
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07080B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid rgba(255, 255, 255, 0.03)",
              borderTopColor: "var(--gold, #c9a14a)",
              animation: "voxa-spin 1s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--txt3, #8a8a93)", fontFamily: "var(--font-mono)", letterSpacing: ".05em" }}>
            VERIFYING ENCRYPTED SESSION GATEWAY...
          </span>
          <style>{`
            @keyframes voxa-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // 2. Auth Exception State: Redirect unauthenticated page requests securely to Cognito/SSO
  if (error || !session) {
    if (typeof window !== "undefined") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
    return null;
  }

  const { role, email, name, tenantName } = session;

  // 3. Blocked Access Guard: Render beautiful centered access block if SALES_AGENT tries accessing ADMIN routes
  const isAdminRoute = pathname.startsWith("/admin/") || pathname === "/admin";
  if (isAdminRoute && role === "SALES_AGENT") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)", display: "flex" }}>
        {/* Render fully functional Sidebar to enable safe pipeline return routes */}
        <Sidebar role={role} userEmail={email} userName={name} tenantName={tenantName} />
        
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "rgba(49, 130, 206, 0.1)",
              border: "1px solid rgba(49, 130, 206, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 0 24px rgba(49, 130, 206, 0.15)",
            }}
          >
            <Shield size={44} style={{ color: "#3182ce" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "var(--txt)" }}>Admin Access Required</h2>
          <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
            You're signed in as a Sales Agent. This area is restricted to administrators only.
          </p>
          <button
            onClick={() => router.push("/sp/pipeline")}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--gold, #c9a14a) 0%, #a87e2f 100%)",
              border: "none",
              color: "#07080B",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(201, 161, 74, 0.2)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Back to my pipeline
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Authenticated Dashboard Shell Layout
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)" }}>
      {/* Bound Sidebar with active verified B2B dynamic context */}
      <Sidebar role={role} userEmail={email} userName={name} tenantName={tenantName} />

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
          }}
        >
          {/* Page Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", letterSpacing: ".02em" }}>
              {role === "ADMIN" 
                ? `${tenantName} Admin Console` 
                : `${tenantName} Outbound Agent Workspace`
              }
            </span>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            
            {/* Active Server Verified Role Tag */}
            <div
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
                color: role === "ADMIN" ? "var(--gold)" : "var(--blue)",
                fontSize: 11.5,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Shield size={12} />
              <span>{role === "ADMIN" ? "Administrator" : role === "SALES_AGENT" ? "Sales Agent" : "Read-Only Viewer"}</span>
            </div>

            {/* Notification Indicator Icon */}
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
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--txt)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txt2)")}
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Content Box with clean div wrapper supporting dynamic Route path animations */}
        <div key={pathname} style={{ flex: 1, padding: 40, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;
