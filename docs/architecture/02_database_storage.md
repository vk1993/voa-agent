# Database Storage and Tenant Isolation

This diagram illustrates how data is segregated securely across multiple business tenants using PostgreSQL Row-Level Security (RLS) and AWS S3 prefix isolation across both our Next.js frontend services and Fastify backend APIs.

```mermaid
graph TD
    classDef compute fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#553C9A;
    classDef db fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#9B2C2C;
    classDef tenantA fill:#EBF3FF,stroke:#3182CE,stroke-width:2px,color:#2B6CB0;
    classDef tenantB fill:#FFFDF0,stroke:#D69E2E,stroke-width:2px,color:#744210;

    NextJS[Next.js SSR / API Router]:::compute
    Fastify[Fastify Core Backend API]:::compute

    %% Postgres Query Context Execution
    NextJS --> |getTenantClient(TenantId)| PostgresContext
    Fastify --> |getTenantClient(TenantId)| PostgresContext

    subgraph PostgresContext ["Dynamic Postgres Tenant Boundaries"]
        RLS_A[set_tenant_context(TenantA)]
        RLS_B[set_tenant_context(TenantB)]
    end

    subgraph PostgreSQL Shared Database Cluster
        RLS_A --> |Restricted Query Context| DataA[(Tenant A Rows)]:::tenantA
        RLS_B --> |Restricted Query Context| DataB[(Tenant B Rows)]:::tenantB
    end

    %% S3 Segment Isolation
    NextJS --> |Isolated Bucket Prefix| S3[(AWS S3 Recordings Bucket)]:::db
    Fastify --> |Isolated Bucket Prefix| S3

    subgraph S3 Segment Isolation
        S3 --> |Prefix: tenants/tenant-A/*| S3_A[Tenant A Files & Recordings]:::tenantA
        S3 --> |Prefix: tenants/tenant-B/*| S3_B[Tenant B Files & Recordings]:::tenantB
    end
```
