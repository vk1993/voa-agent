# Vector Training Data Flow

This diagram explains how raw knowledge base documents are ingested, chunked, embedded using LLMs, and securely stored into the Pinecone Vector database for real-time Retrieval-Augmented Generation (RAG).

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Fastify as Fastify Core APIs (Port 8080)
    participant S3 as AWS S3 recordings
    participant LLM as OpenAI / Embeddings
    participant Pinecone as Pinecone Vector DB
    participant Postgres as PostgreSQL (Multi-AZ GP3)
    
    Admin->>Fastify: Upload Knowledge Base (PDF/Text)
    
    Fastify->>S3: Store raw document securely (KMS encrypted)
    Fastify->>Postgres: Create RagDocument record (Status: PENDING)
    
    Fastify->>Fastify: Parse text and chunk document into sections (e.g. 500 tokens)
    
    loop For each chunk batch
        Fastify->>LLM: Request text-embedding-3-small
        LLM-->>Fastify: Return dense vectors (1536 dims)
    end
    
    Fastify->>Pinecone: Upsert vectors with Metadata { tenantId, docId, chunkIndex }
    
    Fastify->>Postgres: Update RagDocument (Status: INDEXED, vectorCount)
    Fastify-->>Admin: Training Complete
```
