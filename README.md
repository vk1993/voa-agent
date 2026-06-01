<h1 align="center">VOXA</h1>

<p align="center">
  <strong>Enterprise-Grade Multi-Tenant AI Voice Sales Platform for High-Ticket Verticals</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/vk1993/voa-agent/deploy-frontend.yml?branch=main&style=for-the-badge&logo=github&label=Build%20Status" alt="Build Status" />
  <img src="https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js Version" />
  <img src="https://img.shields.io/badge/Fastify-5-blue?style=for-the-badge&logo=fastify" alt="Fastify Version" />
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python" alt="Python Version" />
  <img src="https://img.shields.io/badge/AWS-ECS%20Fargate-orange?style=for-the-badge&logo=amazon-aws" alt="AWS Fargate Stack" />
  <img src="https://img.shields.io/badge/Pinecone-Hybrid%20RAG-blue?style=for-the-badge&logo=pinecone" alt="Pinecone RAG" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative" alt="License" />
</p>

---

## Overview

**VOXA** is an advanced, enterprise-grade B2B conversational AI telephony and CRM orchestration platform. Built to support high-ticket business verticals—including luxury interior design, premium real estate, financial services, healthcare, and custom solutions—VOXA automates outbound sales campaigns, handles dynamic real-time objection-resolution via hybrid Retrieval-Augmented Generation (RAG), and initiates instant post-call follow-up channels.

By decoupling real-time stream ingestion from transactional backend APIs, VOXA delivers sub-800ms conversational turn latency alongside full data integrity:
- **Tenant Context Gating**: Dynamic, onboarding-adaptive dashboard modules and sales wizards.
- **Persistent Lead Timeline**: Immutable chronological event logging tracking customer preferences and objections.
- **Multimodal Post-Call Workflows**: Instant, automated WhatsApp follow-ups and calendar booking synchronization.
- **Row-Level Security (RLS)**: Enforced isolation at the database tier across all operational CRM tables.

---

## Architecture & Data Flow

VOXA utilizes a highly-available, fully-containerized architecture deployed on **AWS ECS Fargate**, isolated from third-party serverless hosting dependencies.

### System Topology

```mermaid
graph TD
    classDef client fill:#EBF3FF,stroke:#3182CE,stroke-width:2px,color:#2B6CB0;
    classDef edge fill:#EDFDF5,stroke:#38A169,stroke-width:2px,color:#276749;
    classDef alb fill:#FFFDF0,stroke:#D69E2E,stroke-width:2px,color:#744210;
    classDef compute fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#553C9A;
    classDef data fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;
    classDef integration fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;

    Client[Web/Mobile Client]:::client -->|HTTPS| CF[CloudFront CDN Distribution]:::edge
    CF -->|HTTP Origin Proxy| ALB[Application Load Balancer - ALB]:::alb
    
    %% ALB Path Rules
    ALB -->|/* default| NextJS[Next.js SSR Frontend - Port 3000]:::compute
    ALB -->|/contacts* & /tenant*| Fastify[Fastify Core Backend API - Port 8080]:::compute
    ALB -->|/webhook*, /turn*, /outbound*| Agent[Python Voice Telephony Agent - Port 8000]:::compute
    
    %% Internal Connections & Service Discovery
    NextJS -.->|Private Cloud Map DNS: fastify.voxa.internal| Fastify
    Fastify -.->|Private Cloud Map DNS: agent.voxa.internal| Agent
    
    %% Storage & Decoupling Queues
    Agent -->|Publish Call Event| SQS[SQS Call-Ended Queue]:::data
    SQS -->|SQS Trigger| Worker[Post-Call Worker Lambda]:::compute
    
    %% Database and Data Store Access
    NextJS --> Postgres[(PostgreSQL DB with RLS)]:::data
    Fastify --> Postgres
    Agent --> Postgres
    Worker --> Postgres
    
    NextJS --> DynamoDB[(DynamoDB Table - LeadEvents / Timeline)]:::data
    Fastify --> DynamoDB
    Agent --> DynamoDB
    Worker --> DynamoDB
    
    NextJS --> Redis[(Upstash Redis Session Gating)]:::data
    Fastify --> Redis
    
    Agent --> Pinecone[(Pinecone Vector DB - RAG)]:::data
    Agent --> Bedrock[(Amazon Bedrock - LLM)]:::data
    Worker --> Bedrock
    
    %% Integrations
    Worker --> Calendar[Google Calendar API]:::integration
    Worker --> WhatsApp[WhatsApp Cloud API]:::integration
```

### Application Load Balancer Path Routing

| Ingress Path | Target Container Service | Container Port | Purpose |
| :--- | :--- | :--- | :--- |
| `/*` (Default) | Next.js Frontend | `3000` | Server-Side Rendered dashboard, landing panels, and step-wizards |
| `/contacts*` | Fastify core CRM | `8080` | High-throughput contacts lists, pagination, and bulk CRUD |
| `/tenant*` | Fastify core CRM | `8080` | Multi-tenant profile configurations and domain settings |
| `/webhook*` | Python Telephony Agent | `8000` | Real-time call streaming hooks and metadata ingress |
| `/turn*` | Python Telephony Agent | `8000` | Conversation dialog routers (Vapi/Retell endpoints) |
| `/outbound*` | Python Telephony Agent | `8000` | Campaign outbound dial triggers |

### Internal Communication
Container groups communicate privately within the VPC using **AWS Cloud Map** private DNS under the `voxa.internal` namespace:
- **Fastify Backend URL**: `http://fastify.voxa.internal:8080`
- **Python Agent URL**: `http://agent.voxa.internal:8000`

Database migrations are executed securely within private subnets via a dedicated **Node.js Lambda Function (`MigrateFn`)** running `npx prisma migrate deploy` during deployment pipelines.

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router) | High-performance React framework. Handles dashboard views and secure edge routing. |
| | Vanilla CSS & Tailwind v4 | Harmonies HSL palettes (accent gold `#C9A14A`), glassmorphism, and responsive screens. |
| | Prisma ORM | Multi-tenant schema manager with Row-Level Security policy abstractions. |
| **Compute / APIs** | Fastify 5 | High-speed TypeScript B2B API gateway serving port `8080`. |
| | FastAPI (Python 3.12) | Real-time voice agent and objection processor serving port `8000`. |
| | AWS ECS Fargate | Highly available, auto-scaled container orchestration tier. |
| **Storage / Queuing**| PostgreSQL 16 | Relational core database with strict schema-level tenant boundaries. |
| | AWS DynamoDB | Audit Ledger (`VoxaAuditLogs`) and AI persistent timeline memory (`LeadEvents`). |
| | AWS SQS | Message queuing decoupling telephony from asynchronous worker pipelines. |
| | Upstash Redis | Edge caching session validations for under-5ms status redirects. |
| **AI / NLP** | Pinecone DB | Vector search database index handling semantic RAG extraction. |
| | Amazon Bedrock | VPC-private LLM gateway running Anthropic Claude 3.5 Haiku and Sonnet. |
| | SpaCy & Presidio | NLP pipeline executing real-time Hinglish-safe PII masking and redactions. |
| **Testing** | Vitest & Supertest | High-performance unit and integration testing suite for CRM schemas. |
| | Pytest | Async testing framework verifying python agent voice response pipelines. |

---

## Directory Structure

```
.
├── app/                            # Next.js App Router UI, Onboarding step-wizard, and dashboards
├── components/                     # Reusable UI elements (Hero, Nav, Waveform, Verticals showcase)
├── hooks/                          # Custom React Hooks (e.g. useTenantContext domain-aware resolver)
├── lib/                            # Shared utilities and configurations (domain-config.ts single source of truth)
├── server/                         # Fastify Core TypeScript CRM Server
│   ├── app.ts                      # Fastify initialization, CORS, and security hooks
│   └── routes/                     # Tenant and Contacts database controllers
├── python/                         # Telephony Voice Platform
│   ├── core/                       # Shared modules (LLM Bedrock interfaces, Pinecone RAG, calendar/WhatsApp tools)
│   ├── agent/                      # Telephony webhook receiver and response loop container (Port 8000)
│   └── worker/                     # Asynchronous SQS post-call workers and cron fine-tuning handlers
├── aws-infra/                      # Python AWS CDK infrastructure definitions
├── prisma/                         # Prisma configurations, seed-superadmin, and migrations
├── scripts/                        # Automation & Local Stack development mock helpers
├── tests/                          # E2E Tenant Isolation & Row-Level Security (RLS) boundary tests
├── docker-compose.yml              # Local databases (Postgres, Redis) and LocalStack simulator
└── next.config.ts                  # Next.js standalone configurations and security headers
```

---

## Getting Started (Local Development)

VOXA provides a complete local development orchestration environment leveraging Docker Compose to mock local PostgreSQL, Redis, and AWS services.

### 1. Prerequisites
- **Node.js 20.x or higher**
- **Python 3.12 or higher**
- **Docker Desktop**

### 2. Project Installation & Node Setup
```bash
# 1. Clone the repository
git clone https://github.com/vk1993/voa-agent.git
cd voa-agent

# 2. Install TypeScript dependencies
npm install
```

### 3. Orchestrate Local Infrastructure
Spin up local databases and mock AWS endpoints (DynamoDB, SQS, Secrets Manager) using Docker:
```bash
# Start Docker containers
docker compose up -d

# Initialize local AWS queues, tables, and mock secrets
chmod +x scripts/localstack-init.sh
./scripts/localstack-init.sh
```

### 4. Database Setup & RLS Migrations
Apply PostgreSQL database schemas, initialize Row-Level Security rules, and seed the super-admin profile:
```bash
# Apply RLS schema migrations
npx prisma migrate dev

# Seed database with the Super-Admin user & global Tenant context
npx tsx prisma/seed-superadmin.ts
```
*Note: Seeding creates the local user `superadmin@local.dev` linked to an active default tenant profile.*

### 5. Python Virtual Environment & Dependency Installation
Because Python services depend on the shared `voxa-core` module, dependencies must be installed in editable mode (`-e`):

#### Option A: Using standard `venv` and `pip`
```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# 2. Install shared core, agent, and worker packages in editable mode
pip install -e python/core
pip install -e python/agent
pip install -e python/worker
```

#### Option B: Using `uv` (Ultra-fast setup)
```bash
# 1. Create and activate virtual environment
uv venv
source .venv/bin/activate

# 2. Install packages in editable mode
uv pip install -e python/core
uv pip install -e python/agent
uv pip install -e python/worker
```

### 6. Start the Compute Engines
Concurrently run the three primary engines locally:

- **Next.js Dashboard UI** (Port `3000`):
  ```bash
  npm run dev
  ```
- **Fastify API Server** (Port `8080`):
  ```bash
  npm run dev:server
  ```
- **Python Telephony Agent** (Port `8000`):
  ```bash
  # Ensure your virtual environment is active
  cd python/agent
  uvicorn main:app --port 8000 --reload
  ```

Once all servers are running, access the local dashboard at `http://localhost:3000`. Log in with your seeded credentials (`superadmin@local.dev`).

---

## Environment Variables Reference

Create a `.env` file at the root of the project to bind all local compute layers and Docker mock targets:

```env
# Database Connections
DATABASE_URL="postgresql://voxa:voxa_password@localhost:5432/voxa_dev?schema=public"
DIRECT_DATABASE_URL="postgresql://voxa:voxa_password@localhost:5432/voxa_dev?schema=public"

# NextAuth & Session Credentials
JWT_SECRET="f69ea6bc92040c1157bc1de15858cfd795b28d085ee5b31bf4e963bc15db642a"
NEXTAUTH_SECRET="f69ea6bc92040c1157bc1de15858cfd795b28d085ee5b31bf4e963bc15db642a"

# AWS LocalStack Target Configurations
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="mock_localstack_access_key"
AWS_SECRET_ACCESS_KEY="mock_localstack_secret_key"
AWS_ENDPOINT_URL="http://localhost:4566"
LOCALSTACK_ENDPOINT="http://localhost:4566"

# Vector Search (Pinecone RAG index mocks)
PINECONE_API_KEY="mock_pinecone_api_key"
PINECONE_INDEX="voxa-sales-index"

# Third-party Integrations
WHATSAPP_TOKEN="mock_whatsapp_cloud_token"
WHATSAPP_PHONE_ID="1234567890"
CALENDLY_TOKEN="mock_calendly_pat_token"
```

---

## Operational Runbooks & Incident Playbooks

Refer to [SECURITY-RUNBOOK.md](file:///Users/turbo/Developer/AntiGravity/voa-agent/docs/SECURITY-RUNBOOK.md) for full operational protocols. Key incident and maintenance procedures are summarized below:

### 1. Cross-Tenant Leak Ingress Resolution
1. **Quarantine Connection Pools**: Limit connection counts or apply strict postgres security filters.
2. **Scan Log Simulations**: Search the simulation logs for cross-tenant hijack events:
   ```bash
   jq '[.[] | select(.action == "CROSS_TENANT_HIJACK_ATTEMPT")]' prisma/audit-sim.json
   ```
3. **Verify PostgreSQL RLS Policies**: Check active row level security on relational tables:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   -- To enforce if disabled:
   ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
   ```
4. **Invalidate Token Signatures**: Terminate the target user sessions instantly by inserting their JWT JTI into the Redis blacklist.

### 2. Purging Contaminated RAG Vectors
If namespace cross-contamination is identified in Pinecone indexes, immediately purge the affected tenant namespace via the Pinecone REST API:
```bash
curl -i -X POST "https://<YOUR_PINECONE_INDEX_HOST>/vectors/delete" \
  -H "Api-Key: <YOUR_PINECONE_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "deleteAll": true,
    "namespace": "tenant_<COMPROMISED_TENANT_ID>"
  }'
```

### 3. Redriving Post-Call Failures from SQS DLQ
If the `PostCallProcessor` encounters a bottleneck (such as a database pool exhaustion), message backlogs will accumulate in the Dead Letter Queue. Once resolved, redrive the queue to process pending schedule entries:
```bash
aws sqs start-message-move-tasks \
  --source-arn arn:aws:sqs:ap-south-1:123456789012:voxa-call-ended-dlq \
  --destination-arn arn:aws:sqs:ap-south-1:123456789012:voxa-call-ended-queue
```

### 4. Zero-Downtime JWT Secret Rotations
1. Generate a new RS256 key pair (`openssl genpkey`).
2. Format the new public key and append it as an active index inside the corporate JWKS array:
   ```json
   { "keys": [ { "kid": "key-2026-q2", ... }, { "kid": "key-old-expired", ... } ] }
   ```
3. Deploy JWKS file to `.well-known/jwks.json` distribution endpoints.
4. Set authentication instances to sign new cookies with `key-2026-q2`.
5. Wait exactly **1 hour** for old sessions to naturally expire, then delete the deprecated key from the active JWKS document.

---

## AWS SES Email Deliverability Setup

To ensure system notifications and magic sign-in links consistently bypass spam filters and maintain high deliverability, the following DNS and AWS SES identity records are enforced (see [SES-DELIVERABILITY.md](file:///Users/turbo/Developer/AntiGravity/voa-agent/docs/SES-DELIVERABILITY.md) for details):

### 1. SPF Record
Authorize SES to send emails from your domain name. Add this standard `TXT` record to your DNS zone:
```
TXT @ "v=spf1 include:amazonses.com ~all"
```

### 2. DKIM Signature Setup
1. In the AWS SES Console: navigate to **Verified Identities** ➔ **yourdomain.com** ➔ **DKIM** ➔ **Enable Easy DKIM**.
2. Copy the three distinct CNAME records provided by AWS.
3. Publish these CNAME entries to your DNS provider. Allow up to 24–48 hours for global propagation.

### 3. DMARC Policy
Enforce a quarantine policy for misaligned senders. Add this `TXT` record at the `_dmarc` subdomain:
```
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100"
```

### 4. Verification Check
Query the status of active DKIM identities using the AWS CLI:
```bash
aws ses get-identity-dkim-attributes --identities yourdomain.com
# Status must return "Success" before production traffic is activated.
```

---

## Automated Testing Suite

VOXA features complete integration and unit tests validating multitenancy boundaries and transcription engines.

### Running TypeScript Integration Tests
Verify PostgreSQL Row-Level Security, tenant boundary queries, and auth edge-proxy behaviors using Vitest:
```bash
npx vitest run tests/
```

### Running Python Agent Telemetry & Objection Tests
Validate voice-state pipelines, PII redactions, and Bedrock Haiku dialogue flows using pytest:
```bash
# Activate your python virtual environment
cd python
python -m pytest -v --tb=short
```
