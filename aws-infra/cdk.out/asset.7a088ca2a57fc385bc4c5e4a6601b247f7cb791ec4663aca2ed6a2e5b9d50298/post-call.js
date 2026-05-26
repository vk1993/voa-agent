"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const calendly_1 = require("./services/calendly");
const whatsapp_1 = require("./services/whatsapp");
const bedrock = new client_bedrock_runtime_1.BedrockRuntimeClient({});
const DEFAULT_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
// Instantiate third-party action services using environment tokens
const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN || "mock_calendly_pat_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "mock_whatsapp_cloud_token";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "109876543210"; // Sample Meta phone ID
const calendly = new calendly_1.CalendlyService(CALENDLY_TOKEN);
const whatsapp = new whatsapp_1.WhatsAppService(WHATSAPP_PHONE_ID, WHATSAPP_TOKEN);
const handler = async (event) => {
    console.log(`Processing SQS trigger batch of ${event.Records.length} records`);
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
                    .map((line) => `${line.role || line.speaker || "Speaker"}: ${line.text || line.message || ""}`)
                    .join("\n");
            }
            else {
                transcriptText = String(transcriptList);
            }
            if (!transcriptText.trim()) {
                console.warn(`Record ${record.messageId} contained an empty call transcript. Skipping LLM invocation.`);
                continue;
            }
            console.log("Analyzing Transcript snippet:\n", transcriptText.slice(0, 300) + "...");
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
            // Invoke Bedrock Runtime
            console.log(`Invoking Bedrock LLM Model: ${DEFAULT_MODEL_ID}`);
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: DEFAULT_MODEL_ID,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 600,
                    temperature: 0.1,
                    system: systemPrompt,
                    messages: [
                        {
                            role: "user",
                            content: `Analyze the following interior design client call transcript and extract the parameters:
              
              --- TRANSCRIPT START ---
              ${transcriptText}
              --- TRANSCRIPT END ---`
                        }
                    ]
                })
            });
            const response = await bedrock.send(command);
            const responseBodyString = new TextDecoder().decode(response.body);
            const parsedResponse = JSON.parse(responseBodyString);
            const rawTextResult = parsedResponse.content?.[0]?.text?.trim() || "";
            console.log(`Raw Bedrock response received: ${rawTextResult}`);
            try {
                const extractedData = JSON.parse(rawTextResult);
                console.log(`Lead analysis SUCCESS for Message: ${record.messageId}`);
                console.log("Extracted Payload Profile:", JSON.stringify(extractedData, null, 2));
                // ── Programmatic Post-Call Action Automation Layer ──
                if (extractedData.requires_booking) {
                    console.log("requires_booking is TRUE! Automating Calendly & WhatsApp Cloud touchpoints...");
                    // 1. Resolve contact identity from payload
                    const customerName = payload.customerName || payload.contact?.name || "Valued Prospect";
                    const customerPhone = payload.customerPhone || payload.contact?.phone || "+919845012345";
                    const customerEmail = payload.customerEmail || payload.contact?.email || "customer@example.com";
                    const discussedStyle = extractedData.style_preference !== "none" ? extractedData.style_preference : "Premium Custom Layouts";
                    // 2. WhatsApp: Send pre-approved templates message immediately
                    console.log(`Triggering WhatsApp portfolio and voucher pack to: ${customerName} (${customerPhone})`);
                    await whatsapp.sendTemplateMessage(customerPhone, "portfolio_and_voucher", [customerName, discussedStyle]);
                    // 3. Calendly: Query designer scheduling availability
                    const designerUri = "https://api.calendly.com/users/prestige-lead-architect";
                    const schedulingUrl = await calendly.getSchedulingLink(designerUri);
                    console.log(`Calendly booking URL successfully prepared and logged: ${schedulingUrl}`);
                    // Optionally: We can push the custom booking link directly to WhatsApp/SMS here
                    // as a follow-up action step.
                }
                else {
                    console.log("requires_booking is FALSE. Skipping action automation layer for this lead.");
                }
            }
            catch (jsonErr) {
                console.error("Failed to parse LLM response text as valid structured JSON:", rawTextResult, jsonErr);
            }
        }
        catch (error) {
            console.error(`Error processing message ID ${record.messageId}:`, error);
            throw error;
        }
    }
};
exports.handler = handler;
