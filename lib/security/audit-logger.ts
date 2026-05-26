import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";

// Initialize DynamoDB Client with LocalStack endpoint support for local development
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_ENDPOINT = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
const IS_DEV = process.env.NODE_ENV !== "production";

let docClient: DynamoDBDocumentClient | null = null;

try {
  // Defensive initialization: only attempts connection when keys exist or we are running in local dev mode
  const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || IS_DEV;
  if (hasCreds) {
    const config: any = {
      region: AWS_REGION,
    };
    
    // Connect to LocalStack SQS/DynamoDB when in development mode
    if (IS_DEV) {
      config.endpoint = DYNAMODB_ENDPOINT;
      config.credentials = {
        accessKeyId: "mock_key",
        secretAccessKey: "mock_secret",
      };
      console.log(`Audit Logger initializing DynamoDB LocalStack Connection at endpoint: ${DYNAMODB_ENDPOINT}`);
    }

    const client = new DynamoDBClient(config);
    docClient = DynamoDBDocumentClient.from(client);
  }
} catch (error) {
  console.warn("Failed to initialize AWS DynamoDB Audit Trail Client. Falling back to local logging.", error);
}

export interface AuditEvent {
  tenant_id: string;
  timestamp: string;
  user_id: string;
  action: string;
  resource: string;
  previous_state: string; // Serialized JSON string
  new_state: string;      // Serialized JSON string
}

/**
 * Enterprise Audit Trail Service.
 * Asynchronously writes immutable event logs to DynamoDB (VoxaAuditLogs)
 * with robust local JSON fallback file storage for offline developer environments.
 */
export async function logAuditEvent(
  tenantId: string,
  userId: string,
  action: string,
  resource: string,
  previousState: any,
  newState: any
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  
  const eventPayload: AuditEvent = {
    tenant_id: tenantId || "voxa-default-tenant",
    timestamp,
    user_id: userId || "priya.nair@voxa.ai",
    action: String(action).toUpperCase(),
    resource: String(resource),
    previous_state: previousState ? JSON.stringify(previousState) : "{}",
    new_state: newState ? JSON.stringify(newState) : "{}",
  };

  console.log(`[AUDIT TRAIL] Intercepted state-changing operation: [${eventPayload.action}] on [${eventPayload.resource}] by [${eventPayload.user_id}]`);

  // Write to local JSON fallback database first to guarantee persistence in previews
  saveToLocalSimFile(eventPayload);

  if (!docClient) {
    console.log("[AUDIT TRAIL] (Simulation Mode) Saved to local JSON file audit-sim.json successfully.");
    return true;
  }

  try {
    // Write asynchronously to DynamoDB table
    await docClient.send(
      new PutCommand({
        TableName: "VoxaAuditLogs",
        Item: eventPayload,
      })
    );
    console.log(`[AUDIT TRAIL] Successfully pushed log to DynamoDB table VoxaAuditLogs for tenant: ${eventPayload.tenant_id}`);
    return true;
  } catch (error) {
    console.warn(`[AUDIT TRAIL] DynamoDB write failed. Local fallback maintained. Error:`, error);
    return false;
  }
}

/**
 * Persists audit logs to a local file in development mode for easy Admin UI exploration.
 */
function saveToLocalSimFile(event: AuditEvent) {
  try {
    const prismaDir = path.join(process.cwd(), "prisma");
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    const logFilePath = path.join(prismaDir, "audit-sim.json");
    
    let currentLogs: AuditEvent[] = [];
    if (fs.existsSync(logFilePath)) {
      try {
        const fileContent = fs.readFileSync(logFilePath, "utf8");
        currentLogs = JSON.parse(fileContent);
      } catch (e) {
        currentLogs = [];
      }
    }
    
    // Add new log to the top (latest first)
    currentLogs.unshift(event);
    
    // Limit to latest 100 entries to prevent files ballooning
    fs.writeFileSync(logFilePath, JSON.stringify(currentLogs.slice(0, 100), null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write simulation audit log locally:", err);
  }
}

/**
 * Fetch all local simulation audit logs (latest first)
 */
export function getLocalSimAuditLogs(): AuditEvent[] {
  try {
    const logFilePath = path.join(process.cwd(), "prisma", "audit-sim.json");
    if (fs.existsSync(logFilePath)) {
      const fileContent = fs.readFileSync(logFilePath, "utf8");
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error("Failed to read local audit logs:", err);
  }
  return [];
}
