"""
Abstract VoiceProcessor base class.
CascadeProcessor = current STT→LLM→TTS pipeline.
S2SProcessor = future native speech model stub.
"""
from abc import ABC, abstractmethod
from .models import TurnInput, TurnOutput

class VoiceProcessor(ABC):
    @property
    @abstractmethod
    def mode(self) -> str: ...

    @abstractmethod
    async def process_turn(self, turn: TurnInput) -> TurnOutput: ...

    @abstractmethod
    async def health_check(self) -> dict: ...


class CascadeProcessor(VoiceProcessor):
    mode = "cascade"

    def __init__(self, tenant_id: str, redis_client=None):
        self._tenant_id = tenant_id
        self._redis = redis_client

    async def process_turn(self, turn: TurnInput) -> TurnOutput:
        import time
        from .pii import mask_pii
        from .rag import query as rag_query
        from .memory import build_context
        from .llm import process_turn as llm_turn

        t0 = time.perf_counter()

        t_pii = time.perf_counter()
        clean_text = mask_pii(turn.text, turn.language)
        pii_ms = (time.perf_counter() - t_pii) * 1000

        t_mem = time.perf_counter()
        memory = await build_context(turn.contact_id)
        mem_ms = (time.perf_counter() - t_mem) * 1000

        t_rag = time.perf_counter()
        rag_ctx = await rag_query(clean_text, self._tenant_id, redis_client=self._redis)
        rag_ms = (time.perf_counter() - t_rag) * 1000

        clean_turn = turn.model_copy(update={"text": clean_text})
        result = await llm_turn(clean_turn, rag_ctx, memory, tenant_context=turn.tenant_context)

        total_ms = (time.perf_counter() - t0) * 1000
        return result.model_copy(update={
            "latency": result.latency.model_copy(update={
                "pii_ms": pii_ms, "rag_ms": rag_ms, "total_ms": total_ms
            })
        })

    async def health_check(self) -> dict:
        import time
        try:
            from .rag import query as rag_query
            t0 = time.perf_counter()
            await rag_query("test", self._tenant_id, top_k=1)
            return {"healthy": True, "latency_ms": (time.perf_counter() - t0)*1000}
        except Exception as e:
            return {"healthy": False, "error": str(e)}


class S2SProcessor(VoiceProcessor):
    mode = "s2s"

    async def process_turn(self, turn: TurnInput) -> TurnOutput:
        raise NotImplementedError(
            "S2SProcessor not implemented yet. "
            "Set VOICE_PROCESSOR_MODE=cascade."
        )

    async def health_check(self) -> dict:
        return {"healthy": False, "mode": "s2s", "status": "not_implemented"}


def create_processor(tenant_id: str, redis_client=None) -> VoiceProcessor:
    import os
    mode = os.environ.get("VOICE_PROCESSOR_MODE", "cascade")
    if mode == "s2s":
        return S2SProcessor()
    return CascadeProcessor(tenant_id, redis_client)
