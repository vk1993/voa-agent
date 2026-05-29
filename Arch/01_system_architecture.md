# VOXA System Architecture

This diagram outlines the high-level system architecture of the VOXA SaaS platform, illustrating how traffic flows from the client through the edge proxy, into the Next.js and Fastify backend, and down to the various data stores.

```mermaid
graph TD
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef edge fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef compute fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef ext fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    Client[Web/Mobile Client]:::client -->|HTTPS| Proxy[Next.js Edge Proxy Middleware]:::edge
    
    Proxy -->|Validates JWT & Extracts Tenant ID| NextJS[Next.js App Router API]:::compute
    Proxy -->|Rate Limits & Routes| Fastify[Fastify Core Backend API]:::compute
    
    NextJS -->|Provisioning| Cognito[AWS Cognito Auth]:::ext
    
    Fastify -->|Reads/Writes Data| Postgres[(PostgreSQL with RLS)]:::data
    Fastify -->|Audit Logs| DynamoDB[(DynamoDB Ledger)]:::data
    Fastify -->|Session & Limits| Redis[(Redis / Upstash)]:::data
    Fastify -->|Upload/Download| S3[(AWS S3 Storage)]:::data
    Fastify -->|Semantic Search| Pinecone[(Pinecone Vector DB)]:::data
```
