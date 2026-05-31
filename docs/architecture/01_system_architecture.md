# VOXA Platform Container Architecture

This diagram outlines the high-level system topology of the containerized VOXA SaaS platform, illustrating how traffic is served securely and routed from the edge through CloudFront and the shared Application Load Balancer into individual ECS Fargate service groups.

```mermaid
graph TD
    classDef client fill:#EBF3FF,stroke:#3182CE,stroke-width:2px,color:#2B6CB0;
    classDef edge fill:#EDFDF5,stroke:#38A169,stroke-width:2px,color:#276749;
    classDef alb fill:#FFFDF0,stroke:#D69E2E,stroke-width:2px,color:#744210;
    classDef compute fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#553C9A;
    classDef data fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;

    Client[Web/Mobile Client]:::client -->|HTTPS| CF[CloudFront CDN Distribution]:::edge
    CF -->|HTTP Origin Proxy| ALB[Application Load Balancer - ALB]:::alb
    
    %% ALB Path Rules
    ALB -->|/* default| NextJS[Next.js SSR Frontend - Port 3000]:::compute
    ALB -->|/contacts* & /tenant*| Fastify[Fastify Core Backend API - Port 8080]:::compute
    ALB -->|/webhook*, /turn*, /outbound*| Agent[Python Voice Telephony Agent - Port 8000]:::compute
    
    %% Internal Connections & Service Discovery
    NextJS -.->|Private Cloud Map DNS voxa.internal| Fastify
    Fastify -.->|Private Cloud Map DNS voxa.internal| Agent
    
    %% Third-party integrations
    NextJS --> Cognito[AWS Cognito Auth]:::edge
    
    %% Data Store Access
    NextJS --> Postgres[(PostgreSQL Shared Cluster)]:::data
    Fastify --> Postgres
    Agent --> Postgres
    
    NextJS --> DynamoDB[(DynamoDB Table - LeadEvents)]:::data
    Fastify --> DynamoDB
    Agent --> DynamoDB
    
    Fastify --> Redis[(Redis / Upstash Cache)]:::data
    NextJS --> Redis
    
    NextJS --> S3[(AWS S3 Recordings Bucket)]:::data
    Fastify --> S3
    Agent --> S3
    
    NextJS --> Pinecone[(Pinecone Vector DB - RAG)]:::data
    Agent --> Pinecone
```
