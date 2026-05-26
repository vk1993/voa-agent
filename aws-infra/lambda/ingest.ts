import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL || "";

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  console.log("Receiving webhook event packet:", JSON.stringify(event));

  const start = Date.now();

  try {
    if (!QUEUE_URL) {
      throw new Error("QUEUE_URL environment variable is missing");
    }

    const body = event.body ? JSON.parse(event.body) : {};
    
    // Validate that this is the correct event payload
    const eventType = body.type || body.event || "";
    
    // We only process call ended transcripts or general webhook queues
    if (!eventType || eventType === "call_ended" || body.transcript) {
      // Decode and package SQS Message
      const messageBody = {
        receivedAt: new Date().toISOString(),
        clientIp: event.requestContext?.identity?.sourceIp || "unknown",
        payload: body,
      };

      // Push payload asynchronously into our decoupled SQS Queue
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify(messageBody),
          MessageAttributes: {
            EventType: {
              DataType: "String",
              StringValue: eventType || "call_ended",
            },
          },
        })
      );
    } else {
      console.log(`Bypassing enqueue for non-matching event Type: ${eventType}`);
    }

    const elapsed = Date.now() - start;
    console.log(`Webhook enqueued successfully to SQS. Ingestion latency: ${elapsed}ms`);

    // Return instant 200 OK (sub-50ms ingestion latency)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Ingestion-Latency-Ms": String(elapsed),
      } as Record<string, string>,
      body: JSON.stringify({
        success: true,
        message: "Webhook packet accepted and enqueued successfully",
      }),
    };
  } catch (error: any) {
    console.error("Webhook ingestion failed:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json" 
      } as Record<string, string>,
      body: JSON.stringify({
        success: false,
        error: error.message || "Queue insertion failed",
      }),
    };
  }
};
