import OpenAI from "openai";

/**
 * 1. LLM Observability Client Wrapper
 * Configures the OpenAI client to proxy through Helicone, injecting custom property headers
 * to track precise token usage and costs per tenant, campaign, and call.
 */
export function createObservableOpenAI(params: {
  tenantId: string;
  campaignId: string;
  callId: string;
  openAiApiKey?: string;
  heliconeApiKey?: string;
}): OpenAI {
  const apiKey = params.openAiApiKey || process.env.OPENAI_API_KEY || "";
  const heliconeKey = params.heliconeApiKey || process.env.HELICONE_API_KEY || "";

  // If no Helicone key is provided, return a standard OpenAI client
  if (!heliconeKey) {
    console.log("No Helicone API key provided. Initializing standard OpenAI client.");
    return new OpenAI({ apiKey });
  }

  console.log(`Initializing Observable OpenAI client under Helicone for Tenant: ${params.tenantId}`);
  return new OpenAI({
    apiKey,
    baseURL: "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${heliconeKey}`,
      "Helicone-Property-TenantId": params.tenantId,
      "Helicone-Property-CampaignId": params.campaignId,
      "Helicone-Property-CallId": params.callId,
    },
  });
}

/**
 * 2. Prompt Injection Guardrail Middleware
 * Scans user inputs for prompt override instructions and blocks them with a deflection prompt.
 */
export function evaluateGuardrails(userInput: string): {
  isSafe: boolean;
  deflectionMessage?: string;
} {
  const normalizedInput = userInput.trim().toLowerCase();

  // Common prompt injection keywords/payloads
  const injectionPatterns = [
    "ignore previous instructions",
    "ignore all guidelines",
    "forget previous",
    "system prompt",
    "system override",
    "you are now a",
    "instead of being an",
    "change role",
    "print system instructions",
    "reveal instructions",
  ];

  const containsInjection = injectionPatterns.some((pattern) =>
    normalizedInput.includes(pattern)
  );

  if (containsInjection) {
    console.warn(`Prompt injection attempt blocked: "${userInput}"`);
    return {
      isSafe: false,
      deflectionMessage:
        "I am sorry, but I can only assist you with premium luxury interior design consultations for VOXA. Let's get back to discussing your modular kitchen or sliding wardrobe requirements.",
    };
  }

  return {
    isSafe: true,
  };
}

/**
 * 3. PII Redaction Filter Pipeline
 * High-performance regex pipeline designed to mask emails, phone numbers, and structural address markers.
 */
export function redactPII(text: string): string {
  if (!text) return "";

  let redactedText = text;

  // A. Redact Email Addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  redactedText = redactedText.replace(emailRegex, "[EMAIL_REDACTED]");

  // B. Redact Phone Numbers (Catching international E.164, Indian mobile +91, and local 10-digit formats)
  const phoneRegex = /(?:\+?91[-.\s]??)?[6-9]\d{9}|(?:\+?1[-.\s]??)?\(?\d{3}\)?[-.\s]??\d{3}[-.\s]??\d{4}/g;
  redactedText = redactedText.replace(phoneRegex, "[PHONE_REDACTED]");

  // C. Redact Structural Address Landmarks
  // Matches expressions containing Plot, Flat, Apartment, House, or Villa numbers,
  // alongside street, stage, sector, layout, or block details.
  const addressRegex = /(?:Flat|Apartment|Villa|House|Plot|Room|Door|No\.?)\s*(?:No\.?)?\s*\d+[a-zA-Z0-9]*(?:\s*,?\s*[A-Za-z0-9\s#/-]+)*(?:\s*(?:Street|Road|Lane|Avenue|Cross|Stage|Phase|Sector|Block|Layout|Colony|Nagar|Area)\s+[A-Za-z0-9\s]+)*/gi;
  redactedText = redactedText.replace(addressRegex, (match) => {
    // Exclude simple matches that are just isolated common keywords to prevent over-redaction
    const lowerMatch = match.trim().toLowerCase();
    const isGenericKeywordOnly = ["villa", "house", "plot", "room"].includes(lowerMatch);
    
    if (isGenericKeywordOnly) {
      return match;
    }
    
    return "[ADDRESS_REDACTED]";
  });

  return redactedText;
}
export default { createObservableOpenAI, evaluateGuardrails, redactPII };
