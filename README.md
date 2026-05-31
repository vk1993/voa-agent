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

The following diagram illustrates the low-latency end-to-end data flow. It traces real-time voice streams and post-call analysis from the client interface through our AWS CloudFront and Application Load Balancer edge routers, into containerized service groups in AWS ECS Fargate, and down to the various data stores and integrations:

```mermaid
graph TD
    %% Base Styling Definitions
    classDef client fill:#EBF3FF,stroke:#3182CE,stroke-width:2px,color:#2B6CB0;
    classDef edge fill:#EDFDF5,stroke:#38A169,stroke-width:2px,color:#276749;
    classDef compute fill:#FFFDF0,stroke:#D69E2E,stroke-width:2px,color:#744210;
    classDef storage fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#553C9A;
    classDef integration fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;

    %% Client and Telephony Nodes
    subgraph Web_Client_Tier ["Client & Telephony Webhook Origin"]
        Dashboard["Next.js Web Dashboard (Admin Panel)"]:::client
        Telephony["Telephony Provider (Vapi / Retell AI)"]:::client
    end

    %% Ingress and Load Balancing
    subgraph Ingress_Tier ["Ingress & CDN Tier"]
        CF["CloudFront CDN Distribution"]:::edge
        ALB["Application Load Balancer (ALB)"]:::edge
        CF --> ALB
    end

    %% Container Compute Services (ECS Fargate)
    subgraph Container_Compute ["AWS ECS Fargate Cluster"]
        NextJS["Next.js Standalone App (Port 3000)"]:::compute
        Fastify["Fastify Core APIs (Port 8080)"]:::compute
        Agent["Python Voice Agent (Port 8000)"]:::compute
    end

    %% Decoupling SQS Messaging Queue Nodes
    subgraph SQS_Messaging ["SQS Decoupling Queue Tier"]
        activeQueue["SQS Queue (voxa-post-call-queue)"]:::storage
    end

    %% Background Processing
    subgraph Background_Workers ["VPC Processing Lambdas"]
        Worker["Post-Call Worker (WorkerLambda)"]:::compute
    end

    %% Storage & AI / Intelligence Nodes
    subgraph Data_Intelligence_Store ["Data & AI Intelligence Tier"]
        auditDb[("DynamoDB Table (VoxaAuditLogs)")]:::storage
        memoryDb[("DynamoDB Table (LeadEvents)")]:::storage
        rds[("PostgreSQL 16 Database (with RLS)")]:::storage
        pinecone[("Pinecone (Vector DB - Hybrid RAG)")]:::storage
        bedrock["Amazon Bedrock (Claude 3.5 Haiku / Sonnet)"]:::storage
    end

    %% Third-party Integrations
    subgraph External_Integrations ["B2B Integrations"]
        Calendar["Google Calendar API"]:::integration
        WhatsApp["WhatsApp Cloud API (Messaging)"]:::integration
    end

    %% Data Flow Connections
    Dashboard -->|HTTPS / WSS| CF
    Telephony -->|POST Webhooks| CF

    %% ALB Path Routing
    ALB -->|/* default| NextJS
    ALB -->|/contacts* & /tenant*| Fastify
    ALB -->|/webhook*, /turn*, /outbound*| Agent

    %% Service Discovery
    NextJS -.->|Private Cloud Map DNS: fastify.voxa.internal| Fastify
    Fastify -.->|Private Cloud Map DNS: agent.voxa.internal| Agent

    %% Core Services DB Access
    NextJS --> rds
    Fastify --> rds
    Agent --> rds
    Worker --> rds

    Agent -->|Publish Call Event| activeQueue
    activeQueue -->|SQS Trigger| Worker

    Agent -->|Query Context| pinecone
    Agent -->|Resolve Current Objections| memoryDb
    Agent -->|Inference via Bedrock Models| bedrock

    Worker -->|Extract Lead Insights via Sonnet| bedrock
    Worker -->|Immutable Event Record| auditDb
    Worker -->|Chronological Timeline Update| memoryDb
    Worker -->|Create Dynamic Appointment| Calendar
    Worker -->|Trigger Rich Follow-up| WhatsApp
```

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [Next.js 16 (App Router)](https://nextjs.org/) | Standalone production image serving server-side rendered (SSR) dashboards and APIs. |
| | [Tailwind CSS v4](https://tailwindcss.com/) | Harmonies HSL palettes (premium gold accents `#C9A14A`) and custom glassmorphism panels. |
| | [Prisma ORM](https://www.prisma.io/) | PostgreSQL connector for campanha, tenant mapping, and auditable B2B records. |
| **Backend & Compute** | [Fastify](https://fastify.dev/) | High-performance TypeScript backend serving core CRM APIs on port 8080. |
| | [FastAPI (Python 3.12)](https://fastapi.tiangolo.com/) | High-performance voice telephony gateway serving /turn webhooks on port 8000. |
| | [AWS ECS Fargate](https://aws.amazon.com/fargate/) | Highly-available, auto-scaled container orchestration layer. |
| **IaC & Infra** | [AWS CDK (Python)](https://aws.amazon.com/cdk/) | Python-based infrastructure deployment stack modeling ECR, ECS, ALB, and secure RDS instances. |
| | [AWS DynamoDB](https://aws.amazon.com/dynamodb/) | Ledger storing session memories (`LeadEvents`) and compliance trails (`VoxaAuditLogs`). |
| | [AWS SQS](https://aws.amazon.com/sqs/) | Highly reliable messaging queue decoupling core telephony from post-call processing workers. |
| | [AWS Cognito](https://aws.amazon.com/cognito/) | Enterprise B2B identity management user pools with MFA and custom OIDC attributes. |
| **AI & Intelligence** | [Pinecone DB](https://www.pinecone.io/) | Vector search database index handling semantic RAG extraction. |
| | [Amazon Bedrock](https://aws.amazon.com/bedrock/) | In-VPC orchestrator for Anthropic Claude 3.5 Haiku and 3.5 Sonnet. |
| **Testing** | [Vitest & Supertest](https://vitest.dev/) | High speed Unit and Integration tests for standard CRM routes. |
| | [Pytest](https://pytest.org/) | Python test suite verifying voice processor pipelines. |

---

## Folder Structure

Below is the directory mapping of the VOXA multi-tenant container platform:

```
.
├── app/                            # Next.js App Router (Pages, UI, and standalone dashboards)
├── components/                     # Reusable React UI Elements
├── server/                         # Fastify Core TypeScript CRM Backend
│   ├── app.ts                      # Fastify core routing and security hooks
│   └── routes/                     # CRM specific routes (contacts, tenants)
├── python/                         # Voice Telephony Intelligence Services
│   ├── core/                       # Shared modules (LLM bedrock handlers, Google Calendar, RAG)
│   ├── agent/                      # Telephony endpoint container (/turn webhook ingress)
│   └── worker/                     # Asynchronous SQS post-call workers and fine-tuning cron
├── aws-infra/                      # Python AWS CDK container infrastructure project
│   ├── app.py                      # CDK App declaration
│   └── voxa_stack.py               # voxstack definition (ECR, ECS Fargate, Cognito, PostgreSQL GP3, CloudFront)
├── prisma/                         # Prisma migrations and multi-tenant schema models
├── scripts/                        # Automation & Local Stack local orchestration helpers
├── tests/                          # E2E Security boundary tests
├── docker-compose.yml              # Local database and localstack definitions
├── next.config.ts                  # Standalone build settings and custom security headers
└── README.md                       # Comprehensive guide
```

---

## Getting Started (Local Development)

VOXA provides a complete local development orchestration environment leveraging Docker Compose to mock local PostgreSQL, Redis, and AWS services.

### Prerequisites
- [Node.js 20.x or higher](https://nodejs.org/)
- [Python 3.12 or higher](https://www.python.org/)
- [Docker Desktop](https://www.docker.com/)

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

3. **Orchestrate Local Databases & LocalStack:**
   Spin up LocalStack (DynamoDB, SQS, KMS, Secrets) alongside PostgreSQL and Redis:
   ```bash
   docker compose up -d
   ```

4. **Initialize Local AWS Simulation:**
   ```bash
   chmod +x scripts/localstack-init.sh
   ./scripts/localstack-init.sh
   ```

5. **Prisma Postgres Scaffolding:**
   Create development database and deploy RLS migrations:
   ```bash
   npx prisma migrate dev
   ```

6. **Start All Local Compute Engines:**
   Start all three services concurrently:
   - **Next.js Dashboard**: `npm run dev` (Port 3000)
   - **Fastify API Server**: `npm run dev:server` (Port 8080)
   - **Python Telephony Agent**:
     ```bash
     cd python && source venv/bin/activate
     cd agent && uvicorn main:app --port 8000
     ```

---

## Environment Variables

Save this as `.env` at the root of the project to target local databases and Docker mock structures instantly:

```env
# Relational Database Configuration
DATABASE_URL="postgresql://voxa:voxa@localhost:5432/voxa_dev"
DIRECT_DATABASE_URL="postgresql://voxa:voxa@localhost:5432/voxa_dev"

# NextAuth & JWT Secrets
JWT_SECRET="f69ea6bc92040c1157bc1de15858cfd795b28d085ee5b31bf4e963bc15db642a"
NEXTAUTH_SECRET="f69ea6bc92040c1157bc1de15858cfd795b28d085ee5b31bf4e963bc15db642a"

# AWS Credentials (LocalStack target)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="mock_localstack_access_key"
AWS_SECRET_ACCESS_KEY="mock_localstack_secret_key"
AWS_ENDPOINT_URL="http://localhost:4566"
LOCALSTACK_ENDPOINT="http://localhost:4566"

# Vector Search (Pinecone RAG index)
PINECONE_API_KEY="mock_pinecone_api_key"
PINECONE_INDEX="voxa-sales-index"

# Third-party tokens
WHATSAPP_TOKEN="mock_whatsapp_cloud_token"
WHATSAPP_PHONE_ID="1234567890"
```


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

### Container Deployments (AWS ECS Fargate & CDK)
VOXA is fully containerized and deploys to highly-available AWS ECS Fargate clusters, removing Vercel dependencies entirely.

**Deploy Workflow**:
Pushing to the `main` branch triggers a unified GitHub Actions pipeline:
1. Builds Docker images (`Dockerfile.nextjs`, `Dockerfile.fastify`, `python/agent/Dockerfile`).
2. Pushes built containers to Amazon ECR repositories (`voxa-nextjs`, `voxa-fastify`, `voxa-agent`).
3. Deploys CDK infrastructure via `cdk deploy`.
4. Forces ECS service updates for all container groups.
5. Invokes VPC-private NodeJS Lambda (`MigrateFn`) to safely run Prisma schema migrations.

### Required GitHub Repository Secrets
Add these secrets in `Settings -> Secrets and Variables -> Actions` on your GitHub repository:
- `AWS_ACCESS_KEY_ID`: IAM deployment access key
- `AWS_SECRET_ACCESS_KEY`: IAM deployment secret key
- `AWS_ACCOUNT_ID`: 12-digit AWS account identifier
- `AWS_REGION`: target AWS region (`ap-south-1`)

### Local Production Build Test
To build and test production Docker containers locally:
```bash
docker compose up -d postgres localstack redis
# Next.js frontend standalone
docker build -f Dockerfile.nextjs -t voxa-nextjs:test .
# Fastify API server
docker build -f Dockerfile.fastify -t voxa-fastify:test .
# Python telephony agent
docker build -f python/agent/Dockerfile -t voxa-agent:test python/
```

---

## Automated Testing

VOXA features complete, automated backend integration and unit test suites across both the TypeScript CRM API layer and the Python telephony processor.

### Running TypeScript Integration Tests
Verify CRM tenant isolation and role-based access security controls using Vitest:
```bash
# Run Nest.js / Fastify integration specs
npx vitest run tests/
```

### Running Python Agent Telemetry & Processing Tests
Verify the Hinglish-safe mid-call objection processor and worker calendar/message handlers using pytest:
```bash
# Activate virtual environment
cd python && source venv/bin/activate
# Run all Python core & worker tests
python -m pytest -v --tb=short
```

### Automated Integration Test Coverage
- **Tenant Isolation Limits**: Asserts that requests from a logged-in agent strictly retrieve records matching their verified tenant database prefix (PostgreSQL Row-Level Security checks).
- **Hinglish-Safe Transcripts**: Simulates mixed English and Hindi prospect questions to assert that Presidio PII is correctly masked and Bedrock Haiku returns standard B2B responses.
- **SQS post-call hooks**: Mock events verify calendar scheduling, Pinecone RAG semantic extraction, and WhatsApp follow-up pipelines.
