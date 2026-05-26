import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-native routing proxy interceptor for VOXA Next.js.
 * Handles enterprise Cognito identity parsing and maps federated Okta/Azure AD groups.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard layouts and configuration settings
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("session")?.value;

    // 1. Authentication Check: Redirect to Cognito SSO-ready /login if not authenticated
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Decode the session. In a fully configured Cognito OIDC flow, this reads the verified ID token.
      const session = JSON.parse(decodeURIComponent(sessionCookie));

      if (!session) {
        throw new Error("Empty session state");
      }

      // 2. Enterprise Claims Mapping: Extract roles from Cognito Federated User Pool Groups
      // Standard Cognito claim: "cognito:groups" contains okta/azure-ad synced groups list
      const cognitoGroups: string[] = session["cognito:groups"] || session.cognitoGroups || [];
      let resolvedRole = session.role;

      // Group-to-role mappings
      if (cognitoGroups.includes("ADMIN")) {
        resolvedRole = "ADMIN";
      } else if (cognitoGroups.includes("SALES_AGENT")) {
        resolvedRole = "SALES_AGENT";
      }

      // 3. Authorization Guards: Protect /admin routes using role mapping
      if (resolvedRole === "SALES_AGENT") {
        // Sales agents are restricted from accessing /admin configuration dashboards
        const url = request.nextUrl.clone();
        url.pathname = "/sp/pipeline";
        return NextResponse.redirect(url);
      }

      if (resolvedRole === "ADMIN") {
        // Admin passes validation
        return NextResponse.next();
      }

      // Catch-all: Redirect unknown session states to SSO login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);

    } catch (error) {
      console.error("Cognito JWT/Session parsing failed on Edge proxy:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

