"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const sqs = new client_sqs_1.SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL || "";
const handler = async (event) => {
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
            await sqs.send(new client_sqs_1.SendMessageCommand({
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(messageBody),
                MessageAttributes: {
                    EventType: {
                        DataType: "String",
                        StringValue: eventType || "call_ended",
                    },
                },
            }));
        }
        else {
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
            },
            body: JSON.stringify({
                success: true,
                message: "Webhook packet accepted and enqueued successfully",
            }),
        };
    }
    catch (error) {
        console.error("Webhook ingestion failed:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: error.message || "Queue insertion failed",
            }),
        };
    }
};
exports.handler = handler;
