# Database Storage and Isolation

This diagram illustrates how data is segregated securely across multiple tenants using PostgreSQL Row-Level Security (RLS) and AWS S3 prefix boundaries.

```mermaid
graph TD
    classDef compute fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef db fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef tenantA fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef tenantB fill:#fce4ec,stroke:#c2185b,stroke-width:2px;

    API[Fastify Backend API]:::compute

    API --> |set_tenant_context(TenantA)| RLS_A[Postgres Query Connection]
    API --> |set_tenant_context(TenantB)| RLS_B[Postgres Query Connection]

    subgraph PostgreSQL Shared Cluster
        RLS_A --> |Restricted Read/Write| DataA[(Tenant A Rows)]:::tenantA
        RLS_B --> |Restricted Read/Write| DataB[(Tenant B Rows)]:::tenantB
    end

    API --> |Uploads| S3[(AWS S3 Storage)]:::db

    subgraph S3 Bucket Segregation
        S3 --> |Path: /tenants/tenant-A/*| S3_A[Tenant A Files / Recordings]:::tenantA
        S3 --> |Path: /tenants/tenant-B/*| S3_B[Tenant B Files / Recordings]:::tenantB
    end
```
