"""
POST /turn — replaces mid-call.ts Lambda handler.

Receives webhook from Vapi/Retell with transcript text,
runs the full CascadeProcessor pipeline, executes tool calls
(WhatsApp portfolio send) asynchronously, returns spoken response.
"""
import asyncio
import os
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import structlog

from voxa.models import TurnInput, ConversationTurn
from voxa.processor import create_processor
from voxa.whatsapp import WhatsAppService
from voxa.secrets import get_secrets
from voxa.telemetry import span

log = structlog.get_logger()
router = APIRouter()

# Portfolio URL resolver
PORTFOLIO_MAP = {
    "modular-kitchen": "https://cdn.voxa.ai/{tenant}/portfolio/kitchen.jpg",
    "wardrobe":        "https://cdn.voxa.ai/{tenant}/portfolio/wardrobe.jpg",
    "full-home":       "https://cdn.voxa.ai/{tenant}/portfolio/full-home.jpg",
    "living-room":     "https://cdn.voxa.ai/{tenant}/portfolio/living-room.jpg",
    "bedroom":         "https://cdn.voxa.ai/{tenant}/portfolio/bedroom.jpg",
}

class TurnRequest(BaseModel):
    transcript:  str | None = None
    speech:      str | None = None
    contact_id:  str = "unknown"
    tenant_id:   str = "default"
    call_sid:    str = ""
    turn_index:  int = 0
    language:    str = "en"
    history:     list[dict] = []

@router.post("/turn")
async def handle_turn(req: TurnRequest):
    t0 = time.perf_counter()

    text = req.transcript or req.speech or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty transcript")

    history = [
        ConversationTurn(
            role=m.get("role", "user"),
            content=m.get("content", ""),
            timestamp=datetime.now(timezone.utc),
        )
        for m in req.history
    ]

    turn = TurnInput(
        text=text,
        contact_id=req.contact_id,
        tenant_id=req.tenant_id,
        call_sid=req.call_sid,
        turn_index=req.turn_index,
        language=req.language,
        history=history,
    )

    processor = create_processor(req.tenant_id)

    with span("turn.total", {"tenant": req.tenant_id, "turn": req.turn_index}):
        output = await processor.process_turn(turn)

    # Execute tool calls fire-and-forget (never block voice response)
    for tool in output.tool_calls:
        if tool.name == "send_portfolio":
            asyncio.create_task(
                _send_portfolio(
                    tenant_id=req.tenant_id,
                    contact_id=req.contact_id,
                    style_keyword=tool.input.get("style_keyword", "full-home"),
                )
            )

    total_ms = (time.perf_counter() - t0) * 1000
    log.info(
        "turn_complete",
        contact_id=req.contact_id,
        intent=output.intent,
        total_ms=round(total_ms, 1),
        pii_ms=round(output.latency.pii_ms, 1),
        rag_ms=round(output.latency.rag_ms, 1),
        llm_ms=round(output.latency.llm_ms, 1),
    )

    return {
        "success": True,
        "llm_response": output.response_text,
        "intent": output.intent,
        "latency": output.latency.model_dump(),
    }

async def _send_portfolio(
    tenant_id: str, contact_id: str, style_keyword: str
):
    """
    Fetch contact phone from Fastify API then send WA portfolio.
    Falls back gracefully if phone unavailable.
    """
    secrets = get_secrets()
    wa = WhatsAppService(
        phone_number_id=secrets.get("WHATSAPP_PHONE_ID", ""),
        access_token=secrets.get("WHATSAPP_TOKEN", ""),
    )
    # Fetch phone from internal Fastify contacts API
    fastify_url = os.environ.get("FASTIFY_INTERNAL_URL", "http://localhost:3001")
    phone: str | None = None
    try:
        async with __import__("httpx").AsyncClient() as client:
            r = await client.get(
                f"{fastify_url}/contacts/{contact_id}/phone",
                headers={"x-internal-key": os.environ.get("INTERNAL_API_KEY", "")},
                timeout=2.0,
            )
            if r.status_code == 200:
                phone = r.json().get("phone")
    except Exception as e:
        log.warning("phone_fetch_failed", contact_id=contact_id, error=str(e))

    if not phone:
        log.warning("portfolio_send_skipped",
                    reason="phone_unavailable", contact_id=contact_id)
        return

    url_template = PORTFOLIO_MAP.get(style_keyword, PORTFOLIO_MAP["full-home"])
    portfolio_url = url_template.replace("{tenant}", tenant_id)
    try:
        await wa.send_image(
            to=phone,
            url=portfolio_url,
            caption=f"Here are some {style_keyword.replace('-', ' ')} designs!"
        )
        log.info("portfolio_sent", contact_id=contact_id, style=style_keyword)
    except Exception as e:
        log.warning("portfolio_send_failed", error=str(e))
