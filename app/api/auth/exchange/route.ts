import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role, tenantId } = await request.json();
    
    if (!userId || !email || !role || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sign VOXA JWT
    const token = await new SignJWT({
      sub: userId,
      email,
      role,
      tenantId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("https://auth.voxa.ai")
      .setAudience("https://voxa.ai/app")
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode("voxa-local-dev-secret-key-123456789"));

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("Exchange route failure:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
