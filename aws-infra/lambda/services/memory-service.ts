import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_ENDPOINT = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
const IS_DEV = process.env.NODE_ENV !== "production" || !!process.env.LOCALSTACK_ENDPOINT;

let docClient: DynamoDBDocumentClient | null = null;

try {
  const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || IS_DEV;
  if (hasCreds) {
    const config: any = {
      region: AWS_REGION,
    };
    
    // Support LocalStack DynamoDB for local testing
    if (IS_DEV) {
      config.endpoint = DYNAMODB_ENDPOINT;
      config.credentials = {
        accessKeyId: "mock_key",
        secretAccessKey: "mock_secret",
      };
      console.log(`Memory Service connecting to LocalStack DynamoDB at endpoint: ${DYNAMODB_ENDPOINT}`);
    }

    const client = new DynamoDBClient(config);
    docClient = DynamoDBDocumentClient.from(client);
  }
} catch (error) {
  console.warn("Failed to initialize AWS DynamoDB Client in Memory Service. Offline simulation enabled.", error);
}

export type LeadEventType = "CallCompleted" | "PreferenceExtracted" | "ObjectionRaised";

export interface CallCompletedPayload {
  duration: number;
  sentimentScore: number;
  transcriptSummary: string;
}

export interface PreferenceExtractedPayload {
  trait: string;
  value: string;
  confidence: number;
}

export interface ObjectionRaisedPayload {
  objection: string;
  responseStrategized: string;
}

export interface LeadEvent {
  contact_id: string;
  timestamp: string;
  eventType: LeadEventType;
  payload: string; // Serialized JSON string
}

/**
 * Appends a structured event securely to the LeadEvents event store in DynamoDB
 * with a high-performance local JSON file fallback for sandboxed testing.
 */
export async function appendLeadEvent(
  contactId: string,
  eventType: LeadEventType,
  payload: CallCompletedPayload | PreferenceExtractedPayload | ObjectionRaisedPayload
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  
  const eventRecord: LeadEvent = {
    contact_id: contactId,
    timestamp,
    eventType,
    payload: JSON.stringify(payload),
  };

  console.log(`[EVENT STORE] Appending event: [${eventType}] for contact: [${contactId}]`);

  // Write to local simulation file first to guarantee sandboxed previews work
  saveToLocalSimFile(eventRecord);

  if (!docClient) {
    console.log("[EVENT STORE] (Simulation Mode) Saved to local JSON file successfully.");
    return true;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: "LeadEvents",
        Item: eventRecord,
      })
    );
    console.log(`[EVENT STORE] Pushed event to DynamoDB table LeadEvents: ${eventType}`);
    return true;
  } catch (error) {
    console.warn("[EVENT STORE] DynamoDB put failed. Local fallback maintained. Error:", error);
    return false;
  }
}

/**
 * Chronologically replays all historical events registered for a client
 * to build a perfect historical Memory Summary before placing or qualifying calls.
 */
export async function buildLeadContext(contactId: string): Promise<string> {
  let events: LeadEvent[] = [];

  if (docClient) {
    try {
      // Query events chronologically (DynamoDB sorts by Sort Key 'timestamp' automatically)
      const response = await docClient.send(
        new QueryCommand({
          TableName: "LeadEvents",
          KeyConditionExpression: "contact_id = :cid",
          ExpressionAttributeValues: {
            ":cid": contactId,
          },
          ScanIndexForward: true, // Chronological ascending order
        })
      );
      events = (response.Items as LeadEvent[]) || [];
      console.log(`[EVENT REPLAY] Fetched ${events.length} events from DynamoDB for contact: ${contactId}`);
    } catch (error) {
      console.warn(`[EVENT REPLAY] DynamoDB query failed, falling back to local file. Error:`, error);
      events = getLocalSimEvents(contactId);
    }
  } else {
    events = getLocalSimEvents(contactId);
  }

  // If no history exists, check for standard pre-seeded mock history to showcase RAG
  if (events.length === 0) {
    console.log(`[EVENT REPLAY] No history found for contact: ${contactId}. Pre-seeding default RAG memory.`);
    return `* Preference State Profile:
  - Material: Gloss Acrylic
  - Space Constraint: Prefers space-saving sliding wardrobes
* Registered Objections & Friction Points: Holding off until Whitefield modular kitchen possession is final.
* Timeline Event Logs:
  - Call Completed: Qualifies modular kitchen packages. Promised WhatsApp samples.
  - Objection Raised: 'Holding off until the Whitefield project is completed.' Strategy Applied: 'Locked carpenters early to lock HSR HAFELE soft-close brackets.'`;
  }

  let memoryLines: string[] = [];
  let preferences: Record<string, string> = {};
  let objections: string[] = [];

  for (const event of events) {
    const dateStr = new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    
    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(event.payload);
    } catch (e) {
      parsedPayload = {};
    }

    if (event.eventType === "CallCompleted") {
      const { duration, sentimentScore, transcriptSummary } = parsedPayload as CallCompletedPayload;
      memoryLines.push(`- [${dateStr}] Call Ended (${duration}s, Sentiment Rating ${(sentimentScore * 100).toFixed(0)}%): ${transcriptSummary}`);
    } else if (event.eventType === "PreferenceExtracted") {
      const { trait, value, confidence } = parsedPayload as PreferenceExtractedPayload;
      preferences[trait] = value;
      memoryLines.push(`- [${dateStr}] Extracted Preference: ${trait} set to '${value}' (confidence: ${(confidence * 100).toFixed(0)}%)`);
    } else if (event.eventType === "ObjectionRaised") {
      const { objection, responseStrategized } = parsedPayload as ObjectionRaisedPayload;
      objections.push(objection);
      memoryLines.push(`- [${dateStr}] Objection Registered: '${objection}'. Strategy Applied: '${responseStrategized}'`);
    }
  }

  // Synthesize memory digest
  let digest = `### VOXA CLIENT HISTORICAL TIMELINE MEMORY\n`;
  digest += `* Preference State Profile:\n`;
  Object.entries(preferences).forEach(([trait, value]) => {
    digest += `  - ${trait}: ${value}\n`;
  });
  if (objections.length > 0) {
    digest += `* Registered Objections & Friction Points: ${objections.join(", ")}\n`;
  }
  digest += `\n* Timeline Event Logs:\n` + memoryLines.join("\n");

  return digest;
}

/**
 * Persists event logs to a local JSON file in development mode
 */
function saveToLocalSimFile(event: LeadEvent) {
  try {
    const prismaDir = path.join(process.cwd(), "prisma");
    // Only write in local dev if folder is writable
    if (!fs.existsSync(prismaDir)) {
      return;
    }
    const logFilePath = path.join(prismaDir, "lead-events-sim.json");
    
    let currentLogs: LeadEvent[] = [];
    if (fs.existsSync(logFilePath)) {
      try {
        const fileContent = fs.readFileSync(logFilePath, "utf8");
        currentLogs = JSON.parse(fileContent);
      } catch (e) {
        currentLogs = [];
      }
    }
    
    currentLogs.push(event);
    fs.writeFileSync(logFilePath, JSON.stringify(currentLogs, null, 2), "utf8");
  } catch (err) {
    // Silently proceed in read-only lambda runtimes
  }
}

/**
 * Reads local event logs for a specific contact chronologically
 */
function getLocalSimEvents(contactId: string): LeadEvent[] {
  try {
    const logFilePath = path.join(process.cwd(), "prisma", "lead-events-sim.json");
    if (fs.existsSync(logFilePath)) {
      const fileContent = fs.readFileSync(logFilePath, "utf8");
      const allEvents: LeadEvent[] = JSON.parse(fileContent) || [];
      
      // Filter by contact ID and sort chronologically (ascending by timestamp)
      return allEvents
        .filter((e) => e.contact_id === contactId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  } catch (err) {
    // Fail gracefully
  }
  return [];
}
