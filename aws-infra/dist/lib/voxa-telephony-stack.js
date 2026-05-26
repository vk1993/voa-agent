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
exports.VoxaTelephonyStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
const path = __importStar(require("path"));
class VoxaTelephonyStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Retrieve Secrets securely from AWS Secrets Manager
        const voxaSecrets = secretsmanager.Secret.fromSecretNameV2(this, "VoxaSecrets", "voxa/production/secrets");
        // 1. Decoupling Queue Setup (Dead Letter Queue + Active SQS Queue)
        const deadLetterQueue = new sqs.Queue(this, "CallEndedDeadLetterQueue", {
            queueName: "voxa-call-ended-dlq",
            retentionPeriod: cdk.Duration.days(14),
        });
        const callEndedQueue = new sqs.Queue(this, "CallEndedQueue", {
            queueName: "voxa-call-ended-queue",
            visibilityTimeout: cdk.Duration.seconds(30),
            deadLetterQueue: {
                maxReceiveCount: 3,
                queue: deadLetterQueue,
            },
        });
        // 2. Lambda Functions Configuration
        // Code assets are loaded from the compiled 'dist/lambda' output directory
        const lambdaCode = lambda.Code.fromAsset(path.join(__dirname, "../dist/lambda"));
        // Lambda A: Mid-Call RAG Intent Handler
        const midCallRAGHandler = new lambda.Function(this, "MidCallRAGHandler", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "mid-call.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(5),
            memorySize: 256,
            environment: {
                NODE_ENV: "production",
            },
        });
        // Lambda B: Webhook Ingest Queue Publisher
        const ingestWebhookHandler = new lambda.Function(this, "IngestWebhookHandler", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "ingest.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(3),
            memorySize: 128,
            environment: {
                QUEUE_URL: callEndedQueue.queueUrl,
                NODE_ENV: "production",
            },
        });
        // Grant Ingestion Lambda permission to publish to SQS Queue
        callEndedQueue.grantSendMessages(ingestWebhookHandler);
        // Lambda C: Post-Call LLM Extractor
        const postCallProcessor = new lambda.Function(this, "PostCallProcessor", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "post-call.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(15),
            memorySize: 512,
            environment: {
                QUEUE_URL: callEndedQueue.queueUrl,
                NODE_ENV: "production",
                CALENDLY_TOKEN: voxaSecrets.secretValueFromJson("CALENDLY_TOKEN").unsafeUnwrap(),
                WHATSAPP_TOKEN: voxaSecrets.secretValueFromJson("WHATSAPP_TOKEN").unsafeUnwrap(),
                WHATSAPP_PHONE_ID: voxaSecrets.secretValueFromJson("WHATSAPP_PHONE_ID").unsafeUnwrap(),
                PINECONE_API_KEY: voxaSecrets.secretValueFromJson("PINECONE_API_KEY").unsafeUnwrap(),
                TWILIO_AUTH_TOKEN: voxaSecrets.secretValueFromJson("TWILIO_AUTH_TOKEN").unsafeUnwrap(),
                TWILIO_ACCOUNT_SID: voxaSecrets.secretValueFromJson("TWILIO_ACCOUNT_SID").unsafeUnwrap(),
            },
        });
        // Attach SQS Queue Trigger to PostCallProcessor Lambda
        postCallProcessor.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(callEndedQueue, {
            batchSize: 5,
            maxBatchingWindow: cdk.Duration.seconds(2),
        }));
        // Grant SQS Queue permission to read/delete from SQS Queue
        callEndedQueue.grantConsumeMessages(postCallProcessor);
        // Grant Post-Call Lambda read permission to Secrets Manager secret
        voxaSecrets.grantRead(postCallProcessor);
        // Grant Post-Call Lambda permission to invoke Claude 3 Haiku via Amazon Bedrock
        postCallProcessor.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:InvokeModel"],
            resources: [
                // Grant access to Anthropic Claude 3 Haiku model
                "arn:aws:bedrock:*:*:model/anthropic.claude-3-haiku-*-v*:*",
                // General wildcard to facilitate multi-model failover testing (e.g. Llama-3, Claude 3.5 Sonnet)
                "arn:aws:bedrock:*:*:model/*",
            ],
            effect: iam.Effect.ALLOW,
        }));
        // Grant Mid-Call RAG Handler permission to invoke cheap & expensive models via Bedrock
        midCallRAGHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:InvokeModel"],
            resources: [
                "arn:aws:bedrock:*:*:model/anthropic.claude-3-haiku-*-v*:*",
                "arn:aws:bedrock:*:*:model/anthropic.claude-3-5-sonnet-*-v*:*",
                "arn:aws:bedrock:*:*:model/*",
            ],
            effect: iam.Effect.ALLOW,
        }));
        // 3. API Gateway Creation
        const api = new apigateway.RestApi(this, "VoxaVoiceWebhookApi", {
            restApiName: "voxa-voice-webhook-api",
            description: "Low-latency REST gateway receiver for real-time call webhooks",
            deployOptions: {
                stageName: "prod",
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            },
        });
        // API Route endpoints
        const webhookRoot = api.root.addResource("webhook");
        // Route POST /webhook/mid-call -> MidCallRAGHandler
        const midCallResource = webhookRoot.addResource("mid-call");
        midCallResource.addMethod("POST", new apigateway.LambdaIntegration(midCallRAGHandler));
        // Route POST /webhook/call-ended -> IngestWebhookHandler
        const callEndedResource = webhookRoot.addResource("call-ended");
        callEndedResource.addMethod("POST", new apigateway.LambdaIntegration(ingestWebhookHandler));
        // Output endpoints for developer references
        new cdk.CfnOutput(this, "ApiUrl", {
            value: api.url,
            description: "API Gateway base URL deployment",
        });
        new cdk.CfnOutput(this, "QueueUrl", {
            value: callEndedQueue.queueUrl,
            description: "Ingest Queue URL endpoint",
        });
        // 3.9. AWS KMS Customer Managed Key (CMK) for Enterprise compliance and encryption at rest
        const voxaKmsKey = new kms.Key(this, "VoxaDynamoDbKmsKey", {
            enableKeyRotation: true, // Enterprise audit compliance standard
            description: "Customer Managed KMS Key (CMK) for encrypting VOXA enterprise DynamoDB tables at rest",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // 4. Immutable Audit Trail Setup (DynamoDB Table)
        const auditLogsTable = new dynamodb.Table(this, "VoxaAuditLogs", {
            tableName: "VoxaAuditLogs",
            partitionKey: { name: "tenant_id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Strict security standard for audit compliance
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: voxaKmsKey,
        });
        // Grant read/write rights to the PostCallProcessor lambda for automated event logs writes
        auditLogsTable.grantReadWriteData(postCallProcessor);
        // 4.1. AI Persistent Memory Event Store (LeadEvents DynamoDB Table)
        const leadEventsTable = new dynamodb.Table(this, "LeadEvents", {
            tableName: "LeadEvents",
            partitionKey: { name: "contact_id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For persistent event sourcing logs
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: voxaKmsKey,
        });
        // Grant read/write permissions to both Lambdas for storing and replaying events
        leadEventsTable.grantReadWriteData(postCallProcessor);
        leadEventsTable.grantReadWriteData(midCallRAGHandler);
        // Grant Lambdas decrypt/encrypt access to Customer Managed KMS Key (Required for CUSTOMER_MANAGED Tables)
        voxaKmsKey.grantEncryptDecrypt(postCallProcessor);
        voxaKmsKey.grantEncryptDecrypt(midCallRAGHandler);
        // 5. B2B Enterprise SSO Identity Provider (AWS Cognito User Pool & Groups)
        const userPool = new cognito.UserPool(this, "VoxaUserPool", {
            userPoolName: "voxa-user-pool",
            selfSignUpEnabled: false, // Security: B2B SSO enterprise governance model
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
        });
        // Create Cognito Groups for Role-Based Access Control mapping
        new cognito.CfnUserPoolGroup(this, "CognitoAdminGroup", {
            userPoolId: userPool.userPoolId,
            groupName: "ADMIN",
            description: "VOXA Enterprise Administrators with full tenant-wide access",
        });
        new cognito.CfnUserPoolGroup(this, "CognitoSalesAgentGroup", {
            userPoolId: userPool.userPoolId,
            groupName: "SALES_AGENT",
            description: "VOXA Sales Agents with access to assigned pipeline and leads",
        });
        // Cognito User Pool Client supporting Okta / Azure AD redirection and OAuth flows
        const userPoolClient = new cognito.UserPoolClient(this, "VoxaUserPoolClient", {
            userPool,
            userPoolClientName: "voxa-web-app-client",
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
                callbackUrls: ["https://voxa.ai/api/auth/callback"], // Redirect back to Next.js Edge callback
                logoutUrls: ["https://voxa.ai/"],
            },
        });
        // 6. API Key Management (API Gateway Usage Plans & Key Enforcements)
        const usagePlan = api.addUsagePlan("VoxaClientUsagePlan", {
            name: "voxa-client-usage-plan",
            description: "Limits and throttles API usage for external CRM triggers",
            throttle: {
                rateLimit: 10, // Stable limit of 10 requests per second
                burstLimit: 20, // Peak burst limit of 20 requests
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.MONTH, // Enterprise limit: 10k trigger requests per month
            },
        });
        // Link API stage deployment to our Usage Plan
        usagePlan.addApiStage({
            stage: api.deploymentStage,
        });
        // Add a secure route for third-party CRM trigger calls
        // Route POST /webhook/trigger-campaign -> IngestWebhookHandler (Requires X-API-Key header)
        const triggerCampaignResource = webhookRoot.addResource("trigger-campaign");
        triggerCampaignResource.addMethod("POST", new apigateway.LambdaIntegration(ingestWebhookHandler), {
            apiKeyRequired: true,
        });
        // Output cognitive details for next-step integrations
        new cdk.CfnOutput(this, "UserPoolId", {
            value: userPool.userPoolId,
            description: "AWS Cognito User Pool identifier ID",
        });
        new cdk.CfnOutput(this, "UserPoolClientId", {
            value: userPoolClient.userPoolClientId,
            description: "AWS Cognito User Pool Client identifier ID",
        });
        new cdk.CfnOutput(this, "AuditLogsTableName", {
            value: auditLogsTable.tableName,
            description: "DynamoDB Immutable Audit Logs table name",
        });
        new cdk.CfnOutput(this, "LeadEventsTableName", {
            value: leadEventsTable.tableName,
            description: "DynamoDB Event Sourcing LeadEvents table name",
        });
    }
}
exports.VoxaTelephonyStack = VoxaTelephonyStack;
