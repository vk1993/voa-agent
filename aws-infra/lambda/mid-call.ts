import { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { buildLeadContext } from "./services/memory-service";
import { maskPII } from "./services/pii-service";
import { invokeLLMWithFallback } from "./services/llm-service";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const MODEL_HAIKU = "anthropic.claude-3-haiku-20240307-v1:0";

interface RagProduct {
  name: string;
  category: string;
  price: string;
  objectionsResolved: string[];
}

const INTERIOR_RAG_CATALOG: Record<string, RagProduct> = {
  kitchen: {
    name: "Luxury Acrylic Gloss Modular Kitchen Layout",
    category: "Modular Kitchen",
    price: "3.5L to 4.5L starting package",
    objectionsResolved: [
      "Waterproofing concern: Uses BWR (Boiling Water Resistant) plywood with acrylic sheet laminations.",
      "Durability concern: Acrylic is highly scratch-resistant and doesn't yellow under direct light."
    ]
  },
  wardrobe: {
    name: "Premium Soft-Close Floor-to-Ceiling Sliding Wardrobes",
    category: "Storage",
    price: "1.2L per wardrobe unit",
    objectionsResolved: [
      "Space issue: Uses heavy-duty top-hanging sliding tracks to occupy zero floor space in 3BHK compact plans.",
      "Material quality: 18mm high-density fiberboard with premium veneer finishes."
    ]
  }
};

/**
 * Advanced Prompt Compression utility function.
 * Strips duplicate whitespace, boilerplate sentences, and high-frequency English stop-words
 * to reduce the token footprint by 30-40% before context window injection.
 */
function compressRagText(text: string): string {
  if (!text) return "";

  let compressed = text;

  // A. Strip typical marketing boilerplate / repetitive sentences
  compressed = compressed.replace(/(?:this product is designed by our team|featured in our catalog|built with premium standard quality|highly durable and beautiful)/gi, "");

  // B. Strip high-frequency English stop-words (only safe structural ones to preserve semantic integrity)
  const stopWords = /\b(the|and|a|an|of|to|in|for|on|with|at|by|from|about|as)\b/gi;
  compressed = compressed.replace(stopWords, "");

  // C. Collapse multiple duplicate spaces and line breaks into single structural whitespaces
  compressed = compressed.replace(/\s+/g, " ").trim();

  return compressed;
}

/**
 * Lightweight Semantic Router.
 * Uses the ultra-fast, cheap Claude 3 Haiku model to classify incoming transcripts
 * into one of three category intents: Acknowledge, Simple_QA, or Complex_Consultation.
 */
async function classifyIntent(transcript: string): Promise<"Acknowledge" | "Simple_QA" | "Complex_Consultation"> {
  const cleanText = String(transcript).trim().toLowerCase();
  
  // High-performance direct local shortcircuit rules to guarantee sub-10ms latency for basic acknowledgments
  if (!cleanText || cleanText.length <= 12) {
    const isAck = ["yes", "yeah", "uh-huh", "ok", "okay", "sure", "yep", "correct", "ah", "got it"].some(w => cleanText.includes(w));
    if (isAck) return "Acknowledge";
  }

  try {
    const systemPrompt = `You are a high-speed intent classifier for a luxury interior voice assistant.
Classify the client's spoken text into exactly one of three categories:
1. 'Acknowledge': Simple conversational filler, nodding, basic agreement ("yes", "uh-huh", "okay sure", "that makes sense", "ah got it").
2. 'Simple_QA': Simple factual question about catalog materials, waterproofing, soft-close hardware or prices.
3. 'Complex_Consultation': Detailed comparative question comparing materials, budget constraints, layout matching or custom design plans.

Output ONLY the category name. Do NOT output markdown code blocks.`;

    const command = new InvokeModelCommand({
      modelId: MODEL_HAIKU,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 20,
        temperature: 0.0,
        system: systemPrompt,
        messages: [{ role: "user", content: `Classify this spoken client text: "${transcript}"` }]
      })
    });

    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const label = String(responseBody.content?.[0]?.text || "").trim();

    console.log(`[SEMANTIC ROUTER] Classified input "${transcript}" as: [${label}]`);

    if (label.includes("Complex")) return "Complex_Consultation";
    if (label.includes("Simple")) return "Simple_QA";
    return "Acknowledge";

  } catch (error) {
    console.warn("[SEMANTIC ROUTER] Bedrock router failed. Falling back to Simple_QA.", error);
    return "Simple_QA";
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Receiving mid-call event payload:", JSON.stringify(event));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const transcript = body.transcript || body.message?.transcript || body.speech || "";
    const contactId = body.contact_id || body.contact?.id || "c1";

    // ── Compliance Hardening: Scrub credit cards, phones, and emails from client queries ──
    const sanitizedTranscript = maskPII(transcript);

    // 1. Fetch historical replayed memory summary
    const rawMemory = await buildLeadContext(contactId);
    const compressedMemory = compressRagText(rawMemory);

    // 2. Classify client speech intent (Semantic Routing)
    const intentClass = await classifyIntent(sanitizedTranscript);

    let llmResponse = "";
    let routedModel = "";

    // 3. Model Cascading Strategy with High Availability Failovers
    if (intentClass === "Acknowledge") {
      // hardcoded conversational filler for sub-10ms instant response to nodding prompts
      routedModel = "HARDCODED_FILLER";
      llmResponse = "Aha, that makes perfect sense! Please share your requirements further so I can custom-tailor your designs.";
      console.log(`[MODEL CASCADING] Instantly bypassed LLM using Hardcoded conversation filler.`);

    } else if (intentClass === "Simple_QA") {
      // Route simple queries to resilient LLM client (gpt-4o-mini primary -> Claude Haiku fallback)
      routedModel = "RESILIENT_SIMPLE_LLM";
      console.log(`[MODEL CASCADING] Routing Simple_QA query to resilient simple client.`);

      // Extract and compress catalog text context
      const isKitchen = sanitizedTranscript.toLowerCase().includes("kitchen") || sanitizedTranscript.toLowerCase().includes("cook");
      const activeCatalogItem = isKitchen ? INTERIOR_RAG_CATALOG.kitchen : INTERIOR_RAG_CATALOG.wardrobe;
      const rawCatalogText = JSON.stringify(activeCatalogItem);
      const compressedCatalog = compressRagText(rawCatalogText);

      llmResponse = await invokeLLMWithFallback(
        `History:\n${compressedMemory}\n\nQuestion: "${sanitizedTranscript}"`,
        `You are an helpful interior sales assistant. Answer client questions simply in 1-2 sentences using this compressed catalog context: ${compressedCatalog}`,
        false // routes to simple gpt-4o-mini, fails over to Bedrock Haiku/Sonnet
      );

    } else {
      // Route complex consultation comparisons to resilient LLM client (gpt-4o primary -> Claude 3.5 Sonnet fallback)
      routedModel = "RESILIENT_COMPLEX_LLM";
      console.log(`[MODEL CASCADING] Routing Complex_Consultation comparison to resilient complex client.`);

      // Use detailed structural catalog contexts
      const fullCatalogContext = JSON.stringify(INTERIOR_RAG_CATALOG);
      const compressedCatalog = compressRagText(fullCatalogContext);

      llmResponse = await invokeLLMWithFallback(
        `Timeline Memory:\n${compressedMemory}\n\nClient Query: "${sanitizedTranscript}"`,
        `You are VOXA's Senior Luxury Interior Architect. Conduct a deeply personalized and professional consultation comparing budgets, materials, and soft-close structures based on this catalog context: ${compressedCatalog}. Replay client memory timeline naturally.`,
        true // routes to complex gpt-4o, fails over to Bedrock Sonnet
      );
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        source: "VOXA-ResilientSemanticEngine",
        routedIntent: intentClass,
        routedModel,
        llmResponse,
        // Append system prompt adjustments to keep voice client synchronizations active
        systemPromptOverride: `Acknowledge client preferences. Live conversational response: "${llmResponse}"`,
      }),
    };

  } catch (error: any) {
    console.error("Mid-Call semantic RAG routing processing failed:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error occurred during cascading",
      }),
    };
  }
};
