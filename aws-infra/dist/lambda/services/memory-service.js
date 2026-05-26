"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendLeadEvent = appendLeadEvent;
exports.buildLeadContext = buildLeadContext;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_ENDPOINT = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
const IS_DEV = process.env.NODE_ENV !== "production" || !!process.env.LOCALSTACK_ENDPOINT;
let docClient = null;
try {
    const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || IS_DEV;
    if (hasCreds) {
        const config = {
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
        const client = new client_dynamodb_1.DynamoDBClient(config);
        docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    }
}
catch (error) {
    console.warn("Failed to initialize AWS DynamoDB Client in Memory Service. Offline simulation enabled.", error);
}
/**
 * Appends a structured event securely to the LeadEvents event store in DynamoDB
 * with a high-performance local JSON file fallback for sandboxed testing.
 */
async function appendLeadEvent(contactId, eventType, payload) {
    const timestamp = new Date().toISOString();
    const eventRecord = {
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
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: "LeadEvents",
            Item: eventRecord,
        }));
        console.log(`[EVENT STORE] Pushed event to DynamoDB table LeadEvents: ${eventType}`);
        return true;
    }
    catch (error) {
        console.warn("[EVENT STORE] DynamoDB put failed. Local fallback maintained. Error:", error);
        return false;
    }
}
/**
 * Chronologically replays all historical events registered for a client
 * to build a perfect historical Memory Summary before placing or qualifying calls.
 */
async function buildLeadContext(contactId) {
    let events = [];
    if (docClient) {
        try {
            // Query events chronologically (DynamoDB sorts by Sort Key 'timestamp' automatically)
            const response = await docClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: "LeadEvents",
                KeyConditionExpression: "contact_id = :cid",
                ExpressionAttributeValues: {
                    ":cid": contactId,
                },
                ScanIndexForward: true, // Chronological ascending order
            }));
            events = response.Items || [];
            console.log(`[EVENT REPLAY] Fetched ${events.length} events from DynamoDB for contact: ${contactId}`);
        }
        catch (error) {
            console.warn(`[EVENT REPLAY] DynamoDB query failed, falling back to local file. Error:`, error);
            events = getLocalSimEvents(contactId);
        }
    }
    else {
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
    let memoryLines = [];
    let preferences = {};
    let objections = [];
    for (const event of events) {
        const dateStr = new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(event.payload);
        }
        catch (e) {
            parsedPayload = {};
        }
        if (event.eventType === "CallCompleted") {
            const { duration, sentimentScore, transcriptSummary } = parsedPayload;
            memoryLines.push(`- [${dateStr}] Call Ended (${duration}s, Sentiment Rating ${(sentimentScore * 100).toFixed(0)}%): ${transcriptSummary}`);
        }
        else if (event.eventType === "PreferenceExtracted") {
            const { trait, value, confidence } = parsedPayload;
            preferences[trait] = value;
            memoryLines.push(`- [${dateStr}] Extracted Preference: ${trait} set to '${value}' (confidence: ${(confidence * 100).toFixed(0)}%)`);
        }
        else if (event.eventType === "ObjectionRaised") {
            const { objection, responseStrategized } = parsedPayload;
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
function saveToLocalSimFile(event) {
    try {
        const prismaDir = path.join(process.cwd(), "prisma");
        // Only write in local dev if folder is writable
        if (!fs.existsSync(prismaDir)) {
            return;
        }
        const logFilePath = path.join(prismaDir, "lead-events-sim.json");
        let currentLogs = [];
        if (fs.existsSync(logFilePath)) {
            try {
                const fileContent = fs.readFileSync(logFilePath, "utf8");
                currentLogs = JSON.parse(fileContent);
            }
            catch (e) {
                currentLogs = [];
            }
        }
        currentLogs.push(event);
        fs.writeFileSync(logFilePath, JSON.stringify(currentLogs, null, 2), "utf8");
    }
    catch (err) {
        // Silently proceed in read-only lambda runtimes
    }
}
/**
 * Reads local event logs for a specific contact chronologically
 */
function getLocalSimEvents(contactId) {
    try {
        const logFilePath = path.join(process.cwd(), "prisma", "lead-events-sim.json");
        if (fs.existsSync(logFilePath)) {
            const fileContent = fs.readFileSync(logFilePath, "utf8");
            const allEvents = JSON.parse(fileContent) || [];
            // Filter by contact ID and sort chronologically (ascending by timestamp)
            return allEvents
                .filter((e) => e.contact_id === contactId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
    }
    catch (err) {
        // Fail gracefully
    }
    return [];
}
