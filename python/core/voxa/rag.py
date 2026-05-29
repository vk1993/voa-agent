"""
Live Pinecone vector search. Replaces hardcoded INTERIOR_RAG_CATALOG dict.
"""
import time
import os
import hashlib
from pinecone import Pinecone
import structlog
from .telemetry import span

log = structlog.get_logger()

_pc: Pinecone | None = None

def _get_pinecone() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    return _pc

def _namespace(tenant_id: str) -> str:
    return f"t_{tenant_id}_catalog"

async def _embed(text: str) -> list[float]:
    """
    Generate embeddings. Use OpenAI text-embedding-3-small if configured,
    fall back to a deterministic hash-based mock for local dev.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        import openai as _oai
        client = _oai.AsyncOpenAI(api_key=openai_key)
        resp = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return resp.data[0].embedding
    # Local dev mock: deterministic 1536-dim vector from hash
    h = int(hashlib.sha256(text.encode()).hexdigest(), 16)
    return [(h >> i & 0xFF) / 255.0 for i in range(1536)]

async def query(
    text: str,
    tenant_id: str,
    top_k: int = 3,
    redis_client=None,   # optional Redis for caching
) -> str:
    """Query Pinecone and return formatted context string for system prompt."""
    if not text:
        return ""

    # Redis cache: key = hash of (tenant_id + text)
    cache_key = f"rag:{tenant_id}:{hashlib.md5(text.encode()).hexdigest()}"
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            return cached

    with span("rag.query", {"tenant_id": tenant_id, "top_k": top_k}):
        t0 = time.perf_counter()
        embedding = await _embed(text)

        pc = _get_pinecone()
        index = pc.Index(os.environ["PINECONE_INDEX"])
        results = index.query(
            vector=embedding,
            top_k=top_k,
            namespace=_namespace(tenant_id),
            include_metadata=True,
        )
        rag_ms = (time.perf_counter() - t0) * 1000
        log.debug("rag_query", matches=len(results.matches), rag_ms=round(rag_ms, 1))

    chunks = []
    for match in results.matches:
        if match.score > 0.70:  # relevance threshold
            meta = match.metadata or {}
            chunks.append(
                f"[Score {match.score:.2f}] {meta.get('text', '')}"
            )

    context = "\n---\n".join(chunks) if chunks else ""

    if redis_client and context:
        await redis_client.setex(cache_key, 3600, context)

    return context
