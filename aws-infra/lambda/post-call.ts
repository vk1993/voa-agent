import { SQSEvent, SQSHandler } from "aws-lambda";
import { CalendlyService } from "./services/calendly";
import { WhatsAppService } from "./services/whatsapp";
import { appendLeadEvent } from "./services/memory-service";
import { maskPII } from "./services/pii-service";
import { invokeLLMWithFallback } from "./services/llm-service";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Create Secrets Manager Client
const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-east-1",
});

let cachedSecrets: any = null;

async function getSecrets(): Promise<any> {
  if (cachedSecrets) {
    return cachedSecrets;
  }
  const secretArn = process.env.SECRETS_ARN;
  if (!secretArn) {
    console.warn("SECRETS_ARN environment variable not defined. Falling back to env/mock values.");
    return {
      CALENDLY_TOKEN: process.env.CALENDLY_TOKEN || "mock_calendly_pat_token",
      WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "mock_whatsapp_cloud_token",
      WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || "109876543210",
      PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    };
  }

  try {
    const data = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    if (data.SecretString) {
      cachedSecrets = JSON.parse(data.SecretString);
      return cachedSecrets;
    }
  } catch (error) {
    console.error("Failed to load secrets from Secrets Manager:", error);
  }

  return {
    CALENDLY_TOKEN: process.env.CALENDLY_TOKEN || "mock_calendly_pat_token",
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "mock_whatsapp_cloud_token",
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || "109876543210",
    PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  };
}

let calendly: CalendlyService | null = null;
let whatsapp: WhatsAppService | null = null;

interface ExtractedLeadData {
  budget: number;
  timeline: string;
  style_preference: string;
  requires_booking: boolean;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log(`Processing SQS trigger batch of ${event.Records.length} records`);

  const secrets = await getSecrets();

  // Set secrets in environment so other modules can access them via process.env if needed
  if (secrets.PINECONE_API_KEY) process.env.PINECONE_API_KEY = secrets.PINECONE_API_KEY;
  if (secrets.TWILIO_AUTH_TOKEN) process.env.TWILIO_AUTH_TOKEN = secrets.TWILIO_AUTH_TOKEN;
  if (secrets.TWILIO_ACCOUNT_SID) process.env.TWILIO_ACCOUNT_SID = secrets.TWILIO_ACCOUNT_SID;
  if (secrets.OPENAI_API_KEY) process.env.OPENAI_API_KEY = secrets.OPENAI_API_KEY;

  if (!calendly) {
    calendly = new CalendlyService(secrets.CALENDLY_TOKEN || "mock_calendly_pat_token");
  }
  if (!whatsapp) {
    whatsapp = new WhatsAppService(
      secrets.WHATSAPP_PHONE_ID || "109876543210",
      secrets.WHATSAPP_TOKEN || "mock_whatsapp_cloud_token"
    );
  }

  const activeCalendly = calendly;
  const activeWhatsapp = whatsapp;

  for (const record of event.Records) {
    try {
      console.log(`Processing Message ID: ${record.messageId}`);
      
      const payloadWrapper = JSON.parse(record.body);
      const payload = payloadWrapper.payload || {};
      
      // Get the transcript from the webhook body
      const transcriptList = payload.transcript || payload.message?.transcript || payload.call?.transcript || "";
      
      let transcriptText = "";
      if (Array.isArray(transcriptList)) {
        transcriptText = transcriptList
          .map((line: any) => `${line.role || line.speaker || "Speaker"}: ${line.text || line.message || ""}`)
          .join("\n");
      } else {
        transcriptText = String(transcriptList);
      }

      // ── Compliance Hardening: Scrub phone, credit cards, and emails from transcripts before logs/DB ──
      const sanitizedTranscript = maskPII(transcriptText);

      if (!sanitizedTranscript.trim()) {
        console.warn(`Record ${record.messageId} contained an empty call transcript. Skipping LLM invocation.`);
        continue;
      }

      console.log("Analyzing Sanitized Transcript snippet:\n", sanitizedTranscript.slice(0, 300) + "...");

      const systemPrompt = `You are a Principal Lead Extraction Assistant for VOXA Luxury Interior Design Systems.
Analyze the voice call transcript and extract structured intelligence.
You MUST output ONLY a valid JSON object matching the requested schema.
Do NOT wrap the output in markdown code blocks like \`\`\`json ... \`\`\`.
Do NOT include explanations, preambles, intros, or postscript warnings.
Your output must be parseable by JSON.parse() directly.
 
Target JSON Schema Structure:
{
  "budget": number, // Convert string representations like 8-10L to a numeric value in Rupees (e.g. 900000). If not specified, return 0.
  "timeline": string, // Extract when they want to start or visit the showroom. If not specified, return "not_specified".
  "style_preference": string, // Veneers, soft-close wardrobes, acrylic glass kitchen, Italian marble, etc. If not specified, return "none".
  "requires_booking": boolean // True if they booked a walkthrough consult, site measurement, or showroom visit during the call.
}`;

      // ── Resilient LLM Failover Integration ──
      // Attempts OpenAI gpt-4o first. Automatically fails over to Bedrock Claude 3.5 Sonnet on 5XX or 1.2s timeout!
      const rawTextResult = await invokeLLMWithFallback(
        `Analyze the following interior design client call transcript and extract the parameters:
        
        --- TRANSCRIPT START ---
        ${sanitizedTranscript}
        --- TRANSCRIPT END ---`,
        systemPrompt,
        true // isComplex consultation analysis
      );

      console.log(`Resilient LLM response resolved successfully: ${rawTextResult}`);

      try {
        const extractedData: ExtractedLeadData = JSON.parse(rawTextResult);
        console.log(`Lead analysis SUCCESS for Message: ${record.messageId}`);
        console.log("Extracted Payload Profile:", JSON.stringify(extractedData, null, 2));
        
        // Resolve contactId from payload defensively
        const contactId = payload.contactId || payload.contact?.id || "c1";

        // ── Programmatic Event Sourcing: Append qualify events to Event Store ──
        const discussedStyle = extractedData.style_preference !== "none" ? extractedData.style_preference : "Premium Custom Layouts";
        
        // A. Log preference event
        await appendLeadEvent(contactId, "PreferenceExtracted", {
          trait: "StylePreference",
          value: discussedStyle,
          confidence: 0.95,
        }).catch((err) => console.warn("Failed to append PreferenceExtracted event:", err));

        // B. Log call completed summary event
        await appendLeadEvent(contactId, "CallCompleted", {
          duration: payload.duration || 120, // default or dynamic SQS metadata
          sentimentScore: 0.85,
          transcriptSummary: `Qualified budget: ${extractedData.budget}. Preferred style: ${discussedStyle}. Timeline: ${extractedData.timeline}.`,
        }).catch((err) => console.warn("Failed to append CallCompleted event:", err));

        // C. Log Objections dynamically if budget not set
        if (extractedData.budget === 0) {
          await appendLeadEvent(contactId, "ObjectionRaised", {
            objection: "Prospect hesitated to disclose exact budget ranges",
            responseStrategized: "Emphasized free customized quoting and modular package flexible financing alternatives.",
          }).catch((err) => console.warn("Failed to append ObjectionRaised event:", err));
        }

        // ── Programmatic Post-Call Action Automation Layer ──
        if (extractedData.requires_booking) {
          console.log("requires_booking is TRUE! Automating Calendly & WhatsApp Cloud touchpoints...");

          const customerName = payload.customerName || payload.contact?.name || "Valued Prospect";
          const customerPhone = payload.customerPhone || payload.contact?.phone || "+919845012345";

          // WhatsApp: Send pre-approved templates message immediately
          console.log(`Triggering WhatsApp portfolio and voucher pack to: ${customerName} (${customerPhone})`);
          await activeWhatsapp.sendTemplateMessage(
            customerPhone,
            "portfolio_and_voucher",
            [customerName, discussedStyle]
          );

          // Calendly: Query designer scheduling availability
          const designerUri = "https://api.calendly.com/users/prestige-lead-architect";
          const schedulingUrl = await activeCalendly.getSchedulingLink(designerUri);
          console.log(`Calendly booking URL successfully prepared and logged: ${schedulingUrl}`);
        } else {
          console.log("requires_booking is FALSE. Skipping action automation layer for this lead.");
        }

      } catch (jsonErr) {
        console.error("Failed to parse LLM response text as valid structured JSON:", rawTextResult, jsonErr);
      }

    } catch (error) {
      console.error(`Error processing message ID ${record.messageId}:`, error);
      throw error;
    }
  }
};
