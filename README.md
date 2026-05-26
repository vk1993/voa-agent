<h1 align="center">VOXA</h1>

<p align="center">
  <strong>Enterprise-Grade AI Voice Sales Agent for High-Ticket Industries</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/vk1993/voa-agent/deploy-frontend.yml?branch=main&style=for-the-badge&logo=github&label=Build%20Status" alt="Build Status" />
  <img src="https://img.shields.io/badge/Next.js-15%20%2F%2016%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js Version" />
  <img src="https://img.shields.io/badge/AWS-Serverless-orange?style=for-the-badge&logo=amazon-aws" alt="AWS Serverless Stack" />
  <img src="https://img.shields.io/badge/Pinecone-Hybrid%20RAG-blue?style=for-the-badge&logo=pinecone" alt="Pinecone RAG" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative" alt="License" />
</p>

---

## Overview

VOXA is an advanced, enterprise-grade B2B conversational AI telephony platform purpose-built for high-ticket industries like luxury interior design. It orchestrates ultra-low-latency outbound sales campaigns, handles dynamic real-time customer queries via hybrid Retrieval-Augmented Generation (RAG), and integrates deeply with enterprise booking and messaging workflows. The platform automatically qualifies prospects, addresses complex objections chronologically using persistent lead timeline memory, and schedules design consultations directly into sales pipelines.

Built on an ultra-scalable AWS Serverless infrastructure coupled with a modern Next.js App Router frontend, VOXA is designed for zero-downtime high-throughput scenarios. By leveraging real-time semantic routing, a high-performance Pinecone vector database, and state-of-the-art LLMs (Anthropic Claude 3 Haiku and 3.5 Sonnet), VOXA delivers high business value: capturing customer intent mid-call, immediately firing rich post-call messaging follow-ups via WhatsApp, scheduling calendar events via Calendly, and maintaining an immutable, KMS Customer-Managed Key (CMK) encrypted audit trail of every interaction for compliance.

---

## Architecture

The following diagram illustrates the low-latency end-to-end data flow. It traces real-time voice streams and post-call analysis from the client interface through our AWS Serverless endpoints, our AI intelligence tier, and into third-party integrations:

```mermaid
graph TD
    %% Base Styling Definitions
    classDef client fill:#EBF3FF,stroke:#3182CE,stroke-width:2px,color:#2B6CB0;
    classDef gateway fill:#EDFDF5,stroke:#38A169,stroke-width:2px,color:#276749;
    classDef compute fill:#FFFDF0,stroke:#D69E2E,stroke-width:2px,color:#744210;
    classDef storage fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#553C9A;
    classDef integration fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;

    %% Client and Telephony Nodes
    subgraph Web_Client_Tier ["Client & Telephony Webhook Origin"]
        Dashboard["Next.js Web Dashboard (Admin Panel)"]:::client
        Telephony["Telephony Provider (Vapi / Retell AI)"]:::client
    end

    %% API Gateway Ingestion Nodes
    subgraph API_Ingest_Tier ["AWS API Gateway Gateway Tier"]
        ApiGW["REST API Gateway (voxa-voice-webhook-api)"]:::gateway
        usagePlan["Usage Plan & Throttle Control (10 RPS / 20 Burst)"]:::gateway
        ApiGW --> usagePlan
    end

    %% Serverless Lambda Compute Nodes
    subgraph Serverless_Compute ["AWS Lambda Serverless Handlers"]
        midCallLambda["Mid-Call Intent Handler (NodeJS 20.x)"]:::compute
        ingestLambda["Ingest Webhook Handler (NodeJS 20.x)"]:::compute
        postCallLambda["Post-Call SQS Worker (NodeJS 20.x)"]:::compute
    end

    %% Decoupling SQS Messaging Queue Nodes
    subgraph SQS_Messaging ["SQS Decoupling Queue Tier"]
        activeQueue["SQS Queue (voxa-call-ended-queue)"]:::storage
        dlq["Dead Letter Queue (voxa-call-ended-dlq)"]:::storage
        activeQueue -.->|Failed attempts > 3| dlq
    end

    %% Storage & AI / Intelligence Nodes
    subgraph Data_Intelligence_Store ["Data & AI Intelligence Tier"]
        KMS["KMS Key (VoxaDynamoDbKmsKey)"]:::storage
        auditDb[("Audit Logs Table (VoxaAuditLogs)")]:::storage
        memoryDb[("Lead Events Table (LeadEvents)")]:::storage
        pinecone[("Pinecone (Vector DB - Hybrid RAG)")]:::storage
        bedrock["Amazon Bedrock (Claude 3 Haiku / 3.5 Sonnet)"]:::storage
        
        KMS -->|Encrypts At-Rest| auditDb
        KMS -->|Encrypts At-Rest| memoryDb
    end

    %% Third-party Integrations
    subgraph External_Integrations ["B2B Integrations"]
        Calendly["Calendly API (Auto Scheduling)"]:::integration
        WhatsApp["WhatsApp Cloud API (Messaging)"]:::integration
    end

    %% Data Flow Connections
    Dashboard -->|Trigger Outbound / Manage Keys| ApiGW
    Telephony -->|POST /webhook/mid-call (Real-time Stream)| ApiGW
    Telephony -->|POST /webhook/call-ended (Payload Ingestion)| ApiGW

    usagePlan -->|Forward API Key Validated Campaigns| ingestLambda
    usagePlan -->|Direct Mid-Call POST| midCallLambda
    usagePlan -->|Direct Ingest POST| ingestLambda

    ingestLambda -->|Asynchronously Publish Payload| activeQueue
    activeQueue -->|SQS Trigger (Batch size: 5)| postCallLambda

    midCallLambda -->|Query Context| pinecone
    midCallLambda -->|Resolve Current Objections| memoryDb
    midCallLambda -->|Inference (Bedrock Models)| bedrock

    postCallLambda -->|Fetch Secret Tokens| secretsManager["AWS Secrets Manager"]:::gateway
    postCallLambda -->|Extract Timeline & Insights (Claude 3 Haiku)| bedrock
    postCallLambda -->|Immutable Event Record| auditDb
    postCallLambda -->|Chronological Timeline Update| memoryDb
    postCallLambda -->|Schedule Call| Calendly
    postCallLambda -->|Trigger WhatsApp Alert| WhatsApp
```

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15/16](https://nextjs.org/) | App Router architecture, optimized production bundles, and dynamic server-rendered pages. |
| | [Tailwind CSS v4](https://tailwindcss.com/) | Curated luxury color palettes (accent tones `#C9A14A` - premium gold) and responsive layout utility classes. |
| | [shadcn/ui](https://ui.shadcn.com/) | Accessible, highly-customizable primitive design system components. |
| | [Prisma ORM](https://www.prisma.io/) | SQLite connector for local campaign, API key, and client tenant relational mapping. |
| **Backend & IaC** | [AWS CDK](https://aws.amazon.com/cdk/) | Infrastructure as Code written in TypeScript, ensuring immutable infrastructure deployment. |
| | [AWS API Gateway](https://aws.amazon.com/api-gateway/) | Low-latency REST Gateway with custom usage plans, throttling (10 RPS), and CORS protection. |
| | [AWS Lambda](https://aws.amazon.com/lambda/) | Modular NodeJS 20.x event-driven serverless processing units. |
| | [AWS DynamoDB](https://aws.amazon.com/dynamodb/) | Fully managed NoSQL tables encrypted at rest with AWS KMS Customer-Managed Keys (CMK). |
| | [AWS SQS](https://aws.amazon.com/sqs/) | Highly reliable messaging broker with active call processing decoupling and dead-letter queues. |
| | [AWS Cognito](https://aws.amazon.com/cognito/) | B2B Enterprise Single Sign-On (SSO) with strict password policies and RBAC security groups. |
| **AI / Intelligence** | [Pinecone DB](https://www.pinecone.io/) | High-density vector database orchestrating semantic hybrid RAG search for luxury materials and objection handlers. |
| | [Amazon Bedrock](https://aws.amazon.com/bedrock/) | Enterprise-grade Anthropic Claude 3 Haiku & 3.5 Sonnet model orchestrator. |
| | [OpenAI API](https://openai.com/) | Standard fallback LLM integration for multilingual intent validation. |
| **QA / Testing** | [REST Assured](https://rest-assured.io/) | Java-based domain-specific library for validating telephony webhook behaviors. |
| | [TestNG](https://testng.org/) | Robust testing framework providing structural data-driven assertions and reporting. |
| | [Maven](https://maven.apache.org/) | Dependency management and build orchestrator for the QA test execution pipeline. |

---

## Folder Structure

Below is the high-level project organization detailing the separation of concerns between our web dashboard, AWS serverless backend constructs, and automated API validation suites:

```
.
├── app/                            # Next.js App Router
│   ├── admin/                      # Admin Panel (Campaign management & usage statistics)
│   ├── api/                        # Next.js Serverless Edge Routes
│   │   ├── audit-logs/             # Immutable audit trails fetch endpoints
│   │   └── keys/                   # Third-party client API key registration
│   ├── login/                      # Custom Cognito federated B2B login screen
│   ├── globals.css                 # Global styles, custom scrollbars, & luxury tailwind imports
│   ├── layout.tsx                  # Global page shell
│   └── page.tsx                    # Landing page containing customizer (VOXA Customizer)
├── components/                     # Reusable React UI Components
│   ├── TweaksPanel.tsx             # Interactive branding and accent customizer
│   ├── DashboardShell.tsx          # Responsive administrative console layout
│   ├── Waveform.tsx                # Audio visualizer for real-time voice monitoring
│   └── useTweaks.ts                # Branding customization state hooks
├── lib/                            # Next.js Business Logic & Services
│   ├── rag/                        # Vector search interface
│   │   └── rag-service.ts          # Pinecone index interface & semantic routing
│   └── security/                   # Next.js security and access utilities
│       ├── api-wrapper.ts          # Edge middleware API Key validator
│       ├── audit-logger.ts         # Relational database logging adapter
│       └── security-service.ts     # SHA-256 key hashing & validation module
├── aws-infra/                      # AWS CDK Serverless Backend Stack
│   ├── bin/                        # CDK Entry point definition
│   ├── lib/                        # Infrastructure blueprint declarations
│   │   └── voxa-telephony-stack.ts # CDK Stack (API GW, SQS, Cognito, DynamoDB, KMS CMK)
│   └── lambda/                     # AWS Lambda Handlers
│       ├── ingest.ts               # Ingestion Lambda (Receives Webhook, writes to SQS)
│       ├── mid-call.ts             # RAG Intent Lambda (Handles active dialogue objections)
│       ├── post-call.ts            # SQS Worker (Inference, Calendly/WhatsApp triggers, audit logs write)
│       └── services/               # Shared backend integration adapters
│           ├── bedrock-llm.ts      # Bedrock Claude model runner
│           ├── calendly.ts         # Calendly API dynamic scheduler
│           └── whatsapp.ts         # WhatsApp Cloud messaging gateway
├── qa-automation/                  # Java/REST Assured Automated Integration Test Framework
│   ├── src/
│   │   ├── main/
│   │   │   └── java/               # Core test utilities, request models, & HTTP clients
│   │   └── test/
│   │       ├── java/               # Test suites (Webhook and payload validation tests)
│   │       └── resources/          # Configuration files (config.properties, mock_payloads.json)
│   ├── pom.xml                     # Maven project configuration (Rest Assured, TestNG dependencies)
│   └── testng.xml                  # Test suite runner mapping
├── prisma/                         # Database Migration & Client Setup
│   ├── schema.prisma               # Multi-tenant SQLite configuration schema
│   └── dev.db                      # Local relational database file
├── scripts/                        # Development Utility Scripts
│   └── localstack-init.sh          # LocalStack resource creation (SQS, Secrets, DynamoDB tables)
├── docker-compose.yml              # Multi-container orchestration (LocalStack)
└── vercel.json                     # Next.js routing, headers, & edge build configuration
```

---

## Getting Started (Local Development)

Follow these steps to run a fully functional VOXA development environment locally, complete with mock AWS serverless backend infrastructure:

### Prerequisites
- [Node.js 20.x or higher](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required to run LocalStack for local AWS simulation)
- [Java Development Kit (JDK) 21](https://www.oracle.com/java/technologies/downloads/) (for the QA test automation suite)
- [Maven](https://maven.apache.org/) (for the QA test automation suite)

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vk1993/voa-agent.git
   cd voa-agent
   ```

2. **Install Workspace Dependencies:**
   ```bash
   npm install
   ```

3. **Orchestrate Local AWS Services (LocalStack):**
   Spin up local instances of AWS SQS, Secrets Manager, and DynamoDB tables in background containers:
   ```bash
   docker compose up -d
   ```

4. **Initialize and Seed Local AWS Resources:**
   Run the automation script to create the local queues, register KMS Customer-Managed Keys, deploy the DynamoDB schemas (`VoxaAuditLogs`, `LeadEvents`), and inject mock credentials into the AWS Secrets Manager:
   ```bash
   chmod +x scripts/localstack-init.sh
   ./scripts/localstack-init.sh
   ```

5. **Generate Database Client & Run Relational Migrations:**
   Set up your local SQLite database for campaign and tenant configurations managed by Next.js and Prisma:
   ```bash
   npx prisma db push
   ```

6. **Start the Next.js Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) on your browser to view the VOXA Interactive landing page, Customize brand layouts, and inspect telemetry stats.

---

## Environment Variables

Copy the content below and save it as `.env` in the root of the project. These values are configured for local development targeting SQLite and LocalStack out of the box:

```env
# ==============================================================================
# VOXA Local Environment Configuration
# ==============================================================================

# Relational SQLite Database Configuration (Prisma)
DATABASE_URL="file:./dev.db"

# NextAuth JWT Signing Secret
NEXTAUTH_SECRET="f69ea6bc92040c1157bc1de15858cfd795b28d085ee5b31bf4e963bc15db642a"

# AWS Local Stack Credentials & Region Details
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="mock_localstack_access_key"
AWS_SECRET_ACCESS_KEY="mock_localstack_secret_key"

# LocalStack Unified Endpoint Target (Set only in local/test configurations)
AWS_ENDPOINT_URL="http://localhost:4566"

# AWS Cognito Configuration (User authentication and B2B governance)
COGNITO_USER_POOL_ID="us-east-1_mockPool"
COGNITO_CLIENT_ID="mockUserPoolClient1234567"

# Pinecone & Vector Search Configurations
PINECONE_API_KEY="mock_pinecone_api_key"
PINECONE_INDEX="voxa-sales-index"

# Production API Integration Secrets (Mocked locally in Secrets Manager)
CALENDLY_TOKEN="mock_calendly_pat_token"
WHATSAPP_TOKEN="mock_whatsapp_cloud_token"
WHATSAPP_PHONE_ID="1234567890"
```

---

## Deployment

### Frontend (Next.js Edge to Vercel)
Deploying the Next.js frontend is fully optimized for [Vercel](https://vercel.com).
1. Import the repository into your Vercel Dashboard.
2. In the project settings, configure the environment variables as shown in your production `.env` (ensuring database targets point to production database instances).
3. Vercel automatically honors `vercel.json` and compiles dynamic routers.
4. Ensure the build command generates the prisma client:
   ```bash
   npx prisma generate && next build
   ```

### Backend (AWS CDK Infrastructure)
Deploy the serverless stack (API Gateway, decoupled SQS Queues, DLQ, KMS Keys, DynamoDB Tables, Lambdas) straight to AWS:
1. Navigate to the infrastructure package:
   ```bash
   cd aws-infra
   npm install
   ```
2. Build and compile the TypeScript Lambda handlers:
   ```bash
   npm run build
   ```
3. Synthesize and deploy the infrastructure using the AWS CDK CLI:
   ```bash
   # Ensure your local shell is authenticated to your target AWS AWS Account
   npx cdk bootstrap
   npx cdk deploy
   ```
   CDK will output the base `ApiUrl` (REST gateway URL) and the Cognito configurations on successful completion.

---

## Automated Testing

VOXA features an automated API integration validation suite written in Java, REST Assured, and TestNG. This framework is responsible for running deep integration checks on the telephony webhook ingress routes against security policies, usage plans, queue persistence, and asynchronous processing.

### Running Test Framework

1. **Navigate to the QA Directory:**
   ```bash
   cd qa-automation
   ```

2. **Review Target Configurations:**
   Open `src/test/resources/config.properties` and verify that the target base URI aligns with your local endpoint or your AWS sandbox stack:
   ```properties
   base.uri=http://localhost:4566
   api.key=mock_client_api_key_from_secrets
   ```

3. **Execute Test Cases via Maven:**
   Run all test validations through the standard maven test harness:
   ```bash
   mvn clean test
   ```

### Automated Integration Test Coverage
- **Webhook Ingress Handlers (`POST /webhook/mid-call`):** Simulates real-time telephony agent voice transcripts, validating that semantic queries are properly matched, Pinecone context is retrieved, and objection responses are formulated.
- **Queue Decoupling Validations (`POST /webhook/call-ended`):** Verifies that webhook payloads containing call durations, recorded voice transcript links, and user data are received instantly within the SLA, pushed straight to the `voxa-call-ended-queue`, and that the `PostCallProcessor` handles chronological storage in the `LeadEvents` store correctly.
- **Throttling & API Key Authentication:** Ensures that key permissions are strictly enforced on high-priority routes (e.g. `/webhook/trigger-campaign`) and that the API Gateway correctly throttles calls exceeding the Usage Plan limits.
- **HTML Reporting:** ExtentReports generates visual reports at `target/reports/ExtentReport.html` after every test execution run, providing timing metrics, query params, and JSON schemas for pipeline logs.
