import { NextRequest, NextResponse } from "next/server";
import { verifySessionJwt } from "../../../../proxy";
import { logAuditEvent } from "@/lib/security/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const payload = await verifySessionJwt(sessionCookie);
    if (!payload) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Auth check: Must be ADMIN or SUPER_ADMIN
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Only administrators can trigger test calls." }, { status: 403 });
    }

    const { phone, persona } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "Mobile number is required." }, { status: 400 });
    }

    // Validate phone number: Simple E.164 check (must start with + and contain digits)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const formattedPhone = phone.trim().replace(/\s+/g, "");
    if (!e164Regex.test(formattedPhone)) {
      return NextResponse.json({ error: "INVALID_PHONE", message: "Phone number must be in E.164 format (e.g. +919876543210)." }, { status: 400 });
    }

    // Log the transaction to simulated LocalStack/DynamoDB Audit Trail
    try {
      await logAuditEvent(
        payload.tenantId,
        payload.sub,
        "TEST_CALL_TRIGGERED",
        formattedPhone,
        null,
        { persona, timestamp: new Date().toISOString() }
      );
    } catch (auditError) {
      console.error("[AUDIT] Failed to push test call event to DynamoDB:", auditError);
    }

    // Live Vapi call invocation (only triggered if VAPI_API_KEY is available)
    const vapiKey = process.env.VAPI_API_KEY;
    if (vapiKey) {
      console.log(`[VAPI] Initiating real outbound call to ${formattedPhone}...`);
      try {
        const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vapiKey}`,
          },
          body: JSON.stringify({
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID, // Vapi active phone
            customer: { number: formattedPhone },
            assistant: {
              name: persona?.agentName || "Voxa Outbound Test Agent",
              firstMessage: `Hello, this is ${persona?.agentName || "Priya"} calling from ${persona?.companyName || "Voxa"}. Is this a good time to talk?`,
              model: {
                provider: "openai",
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: `You are ${persona?.agentName || "Priya"}, a professional SDR agent calling from ${persona?.companyName || "Voxa"}. Your vertical is ${persona?.vertical || "Interior Design"}. Engage, qualify the customer, and attempt to schedule a calendar booking.`,
                  },
                ],
              },
            },
          }),
        });

        if (!vapiRes.ok) {
          const errData = await vapiRes.json();
          console.warn("[VAPI] Vapi outbound call failed:", errData);
        } else {
          const callData = await vapiRes.json();
          return NextResponse.json({ success: true, callId: callData.id, live: true });
        }
      } catch (vapiErr) {
        console.error("[VAPI] Exception while initiating Vapi call:", vapiErr);
      }
    }

    // Mock response for development fallback
    return NextResponse.json({
      success: true,
      callId: `mock-call-${crypto.randomUUID()}`,
      live: false,
      message: "Call mock triggered successfully (LocalStack Sim).",
    });
  } catch (error: any) {
    console.error("[ONBOARDING] Test call trigger exception:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Failed to initiate outbound test call." },
      { status: 500 }
    );
  }
}
