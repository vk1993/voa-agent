"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Bell, Sparkles, LogOut, Shield, Menu } from "lucide-react";
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

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("voxa-theme") as "light" | "dark") || "light";
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("voxa-theme", next);
  };

  // Close mobile sidebar automatically on pathname transition change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
        tenant?: {
          vertical: string | null;
          config: any;
          onboardingComplete: boolean;
        };
      }>;
    },
  });

  // Redirect un-onboarded tenants immediately to /onboarding setup wizard
  useEffect(() => {
    if (session && session.tenant && !session.tenant.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [session, router]);

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
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTopColor: "var(--gold)",
              animation: "voxa-spin 1s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--txt3)", fontFamily: "var(--font-mono)", letterSpacing: ".05em" }}>
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
        <Sidebar
          role={role}
          userEmail={email}
          userName={name}
          tenantName={tenantName}
          theme={theme}
          onThemeToggle={toggleTheme}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "var(--blue-bg)",
              border: "1px solid var(--border-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Shield size={44} style={{ color: "var(--blue)" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "var(--txt)", fontFamily: "var(--font-display)" }}>Admin Access Required</h2>
          <p style={{ fontSize: 15, color: "var(--txt2)", marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
            You're signed in as a Sales Agent. This area is restricted to administrators only.
          </p>
          <button
            onClick={() => router.push("/sp/pipeline")}
            className="btn btn-gold"
          >
            Back to my pipeline
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Authenticated Dashboard Shell Layout
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)", display: "flex" }}>
      {/* Bound Sidebar with active verified B2B dynamic context */}
      <Sidebar
        role={role}
        userEmail={email}
        userName={name}
        tenantName={tenantName}
        theme={theme}
        onThemeToggle={toggleTheme}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <style>{`
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Content Area using responsive layout styles */}
      <main className="dashboard-content" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0 }}>
        
        {/* Top Navbar */}
        <header
          style={{
            height: 64,
            borderBottom: "0.5px solid var(--border)",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-card)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          {/* Mobile Menu Trigger & Page Info Container */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsMobileOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--txt2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
              className="mobile-menu-btn"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", letterSpacing: ".02em" }}>
                {role === "ADMIN" 
                  ? `${tenantName} Admin Console` 
                  : `${tenantName} Outbound Agent Workspace`
              }
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            
            {/* Active Server Verified Role Tag */}
            <div
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-subtle)",
                color: role === "ADMIN" ? "var(--gold)" : "var(--blue)",
                fontSize: 11.5,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Shield size={12} />
              <span style={{ fontFamily: "var(--font-sans)" }}>
                {role === "ADMIN" ? "Administrator" : role === "SALES_AGENT" ? "Sales Agent" : "Read-Only Viewer"}
              </span>
            </div>

            {/* Notification Indicator Icon */}
            <div
              className="card"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius)",
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

            <div style={{ width: 1, height: 20, background: "var(--border)" }} />

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

        {/* Content Box with clean div wrapper supporting dynamic Route path transitions */}
        <div key={pathname} style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardShell;
