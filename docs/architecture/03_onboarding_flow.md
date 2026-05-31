# SaaS Onboarding Workflow

This sequence diagram maps the multi-tenant onboarding flow, from user registration through AWS Cognito provisioning, all the way to isolated database creation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Next.js Dashboard UI
    participant NextJS as Next.js API Service
    participant Cognito as AWS Cognito User Pool
    participant Postgres as PostgreSQL (Multi-AZ GP3)
    participant S3 as AWS S3 recordings
    
    User->>Frontend: Fills Signup Form (Email, Company Name)
    Frontend->>NextJS: POST /api/onboard
    NextJS->>Cognito: AdminCreateUser (Email, Temp Password)
    Cognito-->>NextJS: Returns Cognito Identity ID
    
    NextJS->>NextJS: Generate unique tenantSlug (e.g., company-name)
    
    NextJS->>Postgres: BEGIN TRANSACTION
    NextJS->>Postgres: INSERT INTO "tenants" (slug, name, status)
    Postgres-->>NextJS: Return Tenant ID
    NextJS->>Postgres: INSERT INTO "users" (tenantId, cognitoSub, role=ADMIN)
    NextJS->>Postgres: COMMIT TRANSACTION
    
    NextJS->>S3: Create isolated prefix folder `tenants/{tenantId}/`
    
    NextJS-->>Frontend: Onboarding Success & Authentication JWT Token
    Frontend-->>User: Redirect to Dynamic Subdomain Dashboard (e.g. company.voxa.ai)
```
