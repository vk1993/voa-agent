# Vector Training Data Flow

This diagram explains how raw knowledge base documents are ingested, chunked, embedded using LLMs, and securely stored into the Pinecone Vector database for real-time Retrieval-Augmented Generation (RAG).

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Backend as Fastify API
    participant S3 as AWS S3
    participant LLM as OpenAI / Embeddings
    participant Pinecone as Pinecone Vector DB
    participant Postgres as PostgreSQL
    
    Admin->>Backend: Upload Knowledge Base (PDF/Text)
    
    Backend->>S3: Store raw document securely (KMS encrypted)
    Backend->>Postgres: Create RagDocument record (Status: PENDING)
    
    Backend->>Backend: Parse text and chunk document into sections (e.g. 500 tokens)
    
    loop For each chunk batch
        Backend->>LLM: Request text-embedding-3-small
        LLM-->>Backend: Return dense vectors (1536 dims)
    end
    
    Backend->>Pinecone: Upsert vectors with Metadata { tenantId, docId, chunkIndex }
    
    Backend->>Postgres: Update RagDocument (Status: INDEXED, vectorCount)
    Backend-->>Admin: Training Complete
```
