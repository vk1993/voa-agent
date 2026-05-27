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
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const elasticache = __importStar(require("aws-cdk-lib/aws-elasticache"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const cw_actions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
const path = __importStar(require("path"));
class VoxaTelephonyStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const vpc = props.vpc;
        const sgLambda = props.lambdaSecurityGroup;
        const sgRds = props.rdsSecurityGroup;
        const sgRedis = props.redisSecurityGroup;
        const env = props.envName || "production";
        // 1. Retrieve B2B Secrets dynamically at runtime via secrets ARN references
        const voxaSecrets = secretsmanager.Secret.fromSecretNameV2(this, "VoxaSecrets", "voxa/production/secrets");
        // 2. AWS KMS Customer Managed Key (CMK) for enterprise regulatory compliance
        const voxaKmsKey = new kms.Key(this, "VoxaDynamoDbKmsKey", {
            enableKeyRotation: true,
            description: "Customer Managed KMS Key (CMK) for encrypting VOXA enterprise stack resources at rest",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // 3. SNS Topic for DLQ Alerts
        const alertTopic = new sns.Topic(this, "VoxaAlerts", {
            topicName: `voxa-dlq-alerts-${env}`,
            masterKey: voxaKmsKey,
        });
        // 4. SQS Queue Setup with dead letter alerts and KMS encryption
        const deadLetterQueue = new sqs.Queue(this, "CallEndedDeadLetterQueue", {
            queueName: `voxa-call-ended-dlq-${env}`,
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.KMS,
            encryptionMasterKey: voxaKmsKey,
        });
        const callEndedQueue = new sqs.Queue(this, "CallEndedQueue", {
            queueName: `voxa-call-ended-queue-${env}`,
            visibilityTimeout: cdk.Duration.seconds(30),
            encryption: sqs.QueueEncryption.KMS,
            encryptionMasterKey: voxaKmsKey,
            deadLetterQueue: {
                maxReceiveCount: 3,
                queue: deadLetterQueue,
            },
        });
        // 5. CloudWatch Alarm for Dead Letter Queue visibility
        const dlqAlarm = new cloudwatch.Alarm(this, "DlqAlarm", {
            metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: "Post-call processor failing — messages in DLQ",
        });
        dlqAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
        // 6. S3 Bucket for Luxury recordings
        const recordingsBucket = new s3.Bucket(this, "VoxaRecordings", {
            bucketName: `voxa-recordings-${env}-${this.account}`,
            versioned: true,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: voxaKmsKey,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
            lifecycleRules: [{
                    id: "recordings-lifecycle",
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90),
                        },
                    ],
                    expiration: cdk.Duration.days(365),
                }],
            serverAccessLogsPrefix: "access-logs/",
        });
        // 7. Secure Relational Database - PostgreSQL 16
        const dbInstance = new rds.DatabaseInstance(this, "VoxaPostgres", {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_16,
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            securityGroups: [sgRds],
            multiAz: true,
            storageEncrypted: true,
            storageEncryptionKey: voxaKmsKey,
            backupRetention: cdk.Duration.days(7),
            deletionProtection: true,
            credentials: rds.Credentials.fromGeneratedSecret("voxa_admin"),
            databaseName: "voxadb",
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // 8. ElastiCache Redis 7.1 Private Cluster
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, "RedisSubnetGroup", {
            description: "Isolated Subnet Group for Voxa Redis Cluster",
            subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
        });
        const redisCluster = new elasticache.CfnReplicationGroup(this, "VoxaRedis", {
            replicationGroupDescription: "VOXA session + queue store",
            numCacheClusters: 2,
            cacheNodeType: "cache.t4g.medium",
            engine: "redis",
            engineVersion: "7.1",
            atRestEncryptionEnabled: true,
            transitEncryptionEnabled: true,
            kmsKeyId: voxaKmsKey.keyArn,
            securityGroupIds: [sgRedis.securityGroupId],
            cacheSubnetGroupName: redisSubnetGroup.ref,
        });
        // 9. Lambda Functions Configurations (VPC Bound)
        const lambdaCode = lambda.Code.fromAsset(path.join(__dirname, "../dist/lambda"));
        // Lambda A: Mid-Call RAG Intent Handler
        const midCallRAGHandler = new lambda.Function(this, "MidCallRAGHandler", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "mid-call.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(5),
            memorySize: 256,
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [sgLambda],
            allowPublicSubnet: false,
            environment: {
                NODE_ENV: "production",
                VOXA_SECRETS_ARN: voxaSecrets.secretArn,
                RECORDINGS_BUCKET: recordingsBucket.bucketName,
            },
        });
        // Lambda B: Webhook Ingest Queue Publisher
        const ingestWebhookHandler = new lambda.Function(this, "IngestWebhookHandler", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "ingest.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(3),
            memorySize: 128,
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [sgLambda],
            allowPublicSubnet: false,
            environment: {
                QUEUE_URL: callEndedQueue.queueUrl,
                NODE_ENV: "production",
                VOXA_SECRETS_ARN: voxaSecrets.secretArn,
            },
        });
        // Lambda C: Post-Call LLM Extractor
        const postCallProcessor = new lambda.Function(this, "PostCallProcessor", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "post-call.handler",
            code: lambdaCode,
            timeout: cdk.Duration.seconds(15),
            memorySize: 512,
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [sgLambda],
            allowPublicSubnet: false,
            environment: {
                QUEUE_URL: callEndedQueue.queueUrl,
                NODE_ENV: "production",
                VOXA_SECRETS_ARN: voxaSecrets.secretArn,
                RECORDINGS_BUCKET: recordingsBucket.bucketName,
            },
        });
        // Grant SQS and Secrets permissions
        callEndedQueue.grantSendMessages(ingestWebhookHandler);
        callEndedQueue.grantConsumeMessages(postCallProcessor);
        voxaSecrets.grantRead(midCallRAGHandler);
        voxaSecrets.grantRead(ingestWebhookHandler);
        voxaSecrets.grantRead(postCallProcessor);
        recordingsBucket.grantReadWrite(postCallProcessor);
        recordingsBucket.grantReadWrite(midCallRAGHandler);
        // Bind SQS event source to post-call processor
        postCallProcessor.addEventSource(new aws_lambda_event_sources_1.SqsEventSource(callEndedQueue, {
            batchSize: 5,
            maxBatchingWindow: cdk.Duration.seconds(2),
        }));
        // Grant KMS Encrypt/Decrypt permissions
        voxaKmsKey.grantEncryptDecrypt(postCallProcessor);
        voxaKmsKey.grantEncryptDecrypt(midCallRAGHandler);
        voxaKmsKey.grantEncryptDecrypt(ingestWebhookHandler);
        // 10. Restricted Bedrock IAM Permissions (Scoped to specific models and regions)
        postCallProcessor.addToRolePolicy(new iam.PolicyStatement({
            sid: "AllowBedrockInvoke",
            actions: ["bedrock:InvokeModel"],
            resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
            ],
            effect: iam.Effect.ALLOW,
        }));
        midCallRAGHandler.addToRolePolicy(new iam.PolicyStatement({
            sid: "AllowBedrockInvokeMidCall",
            actions: ["bedrock:InvokeModel"],
            resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
            ],
            effect: iam.Effect.ALLOW,
        }));
        // 11. REST API Gateway with Restricted CORS boundaries
        const api = new apigateway.RestApi(this, "VoxaVoiceWebhookApi", {
            restApiName: `voxa-voice-webhook-api-${env}`,
            description: "Low-latency REST gateway receiver for real-time call webhooks",
            deployOptions: {
                stageName: "prod",
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: [
                    "https://voxa.ai",
                    "https://*.voxa.ai",
                ],
                allowMethods: ["POST", "OPTIONS"],
                allowHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
                maxAge: cdk.Duration.hours(1),
            },
        });
        const webhookRoot = api.root.addResource("webhook");
        const midCallResource = webhookRoot.addResource("mid-call");
        midCallResource.addMethod("POST", new apigateway.LambdaIntegration(midCallRAGHandler));
        const callEndedResource = webhookRoot.addResource("call-ended");
        callEndedResource.addMethod("POST", new apigateway.LambdaIntegration(ingestWebhookHandler));
        // 12. DynamoDB Compliance Audit Logs & Persistent Event Stores
        const auditLogsTable = new dynamodb.Table(this, "VoxaAuditLogs", {
            tableName: `VoxaAuditLogs-${env}`,
            partitionKey: { name: "tenant_id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: voxaKmsKey,
        });
        auditLogsTable.grantReadWriteData(postCallProcessor);
        const leadEventsTable = new dynamodb.Table(this, "LeadEvents", {
            tableName: `LeadEvents-${env}`,
            partitionKey: { name: "contact_id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: voxaKmsKey,
        });
        leadEventsTable.grantReadWriteData(postCallProcessor);
        leadEventsTable.grantReadWriteData(midCallRAGHandler);
        // 13. AWS Cognito User Pool & Governance
        const userPool = new cognito.UserPool(this, "VoxaUserPool", {
            userPoolName: `voxa-user-pool-${env}`,
            selfSignUpEnabled: false,
            signInAliases: { email: true },
            autoVerify: { email: true },
            mfa: cognito.Mfa.OPTIONAL,
            mfaSecondFactor: { sms: true, otp: true },
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: cdk.Duration.days(3),
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
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
        const userPoolClient = new cognito.UserPoolClient(this, "VoxaUserPoolClient", {
            userPool,
            userPoolClientName: "voxa-web-app-client",
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
                callbackUrls: ["https://voxa.ai/api/auth/callback"],
                logoutUrls: ["https://voxa.ai/"],
            },
        });
        // 14. API Gateway CRM Throttle Plans
        const usagePlan = api.addUsagePlan("VoxaClientUsagePlan", {
            name: `voxa-client-usage-plan-${env}`,
            description: "Limits and throttles API usage for external CRM triggers",
            throttle: {
                rateLimit: 10,
                burstLimit: 20,
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.MONTH,
            },
        });
        usagePlan.addApiStage({
            stage: api.deploymentStage,
        });
        const triggerCampaignResource = webhookRoot.addResource("trigger-campaign");
        triggerCampaignResource.addMethod("POST", new apigateway.LambdaIntegration(ingestWebhookHandler), {
            apiKeyRequired: true,
        });
        // Outputs for developer profiles
        new cdk.CfnOutput(this, "ApiUrl", {
            value: api.url,
            description: "API Gateway base URL deployment",
        });
        new cdk.CfnOutput(this, "QueueUrl", {
            value: callEndedQueue.queueUrl,
            description: "Ingest SQS Queue URL endpoint",
        });
        new cdk.CfnOutput(this, "UserPoolId", {
            value: userPool.userPoolId,
            description: "Cognito User Pool ID",
        });
        new cdk.CfnOutput(this, "UserPoolClientId", {
            value: userPoolClient.userPoolClientId,
            description: "Cognito User Pool Client ID",
        });
        new cdk.CfnOutput(this, "AuditLogsTableName", {
            value: auditLogsTable.tableName,
            description: "DynamoDB compliance logs name",
        });
    }
}
exports.VoxaTelephonyStack = VoxaTelephonyStack;
