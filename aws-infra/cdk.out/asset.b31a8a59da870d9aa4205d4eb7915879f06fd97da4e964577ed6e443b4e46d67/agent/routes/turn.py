"""
POST /turn — replaces mid-call.ts Lambda handler.

Receives webhook from Vapi/Retell with transcript text,
runs the full CascadeProcessor pipeline, executes tool calls
(WhatsApp portfolio send) asynchronously, returns spoken response.
"""
import asyncio
import os
import time
import hmac
import hashlib
import json
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

async def _fetch_tenant_context(tenant_id: str) -> dict:
    fastify_url = os.environ.get("FASTIFY_INTERNAL_URL", "http://localhost:3001")
    try:
        async with __import__("httpx").AsyncClient() as client:
            r = await client.get(
                f"{fastify_url}/tenant/{tenant_id}/context",
                headers={"x-internal-key": os.environ.get("INTERNAL_API_KEY", "")},
                timeout=3.0,
            )
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        log.warning("tenant_context_fetch_failed", tenant_id=tenant_id, error=str(e))
    return {}

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
async def handle_turn(request: Request):
    webhook_secret = os.environ.get("VAPI_WEBHOOK_SECRET", "")
    if webhook_secret:
        body_bytes = await request.body()
        sig = request.headers.get("x-vapi-signature", "")
        expected = hmac.new(
            webhook_secret.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        req_data = json.loads(body_bytes)
        req = TurnRequest(**req_data)
    else:
        req = TurnRequest(**(await request.json()))

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

    tenant_context = await _fetch_tenant_context(req.tenant_id)

    turn = TurnInput(
        text=text,
        contact_id=req.contact_id,
        tenant_id=req.tenant_id,
        call_sid=req.call_sid,
        turn_index=req.turn_index,
        language=req.language,
        history=history,
        tenant_context=tenant_context,
    )

    processor = create_processor(req.tenant_id)

    with span("turn.total", {"tenant": req.tenant_id, "turn": req.turn_index}):
        output = await processor.process_turn(turn)

    # Execute tool calls fire-and-forget (never block voice response)
    asset_sent = False
    for tool in output.tool_calls:
        if tool.name == "send_asset" and not asset_sent:
            asset_sent = True
            asyncio.create_task(
                _send_asset(
                    tenant_id=req.tenant_id,
                    contact_id=req.contact_id,
                    asset_key=tool.input.get("asset_key", "brochure"),
                    tenant_context=tenant_context,
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

async def _send_asset(
    tenant_id: str, contact_id: str, asset_key: str, tenant_context: dict
):
    """
    Fetch contact phone from Fastify API then send WA asset.
    Falls back gracefully if phone unavailable.
    """
    from voxa.models import TenantContext
    try:
        ctx = TenantContext(**tenant_context)
    except Exception as e:
        log.warning("invalid_tenant_context", error=str(e))
        return

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
        log.warning("asset_send_skipped",
                    reason="phone_unavailable", contact_id=contact_id)
        return

    portfolio_url = ctx.media_map.get(asset_key)
    if not portfolio_url:
        log.warning("asset_url_not_found", asset_key=asset_key, contact_id=contact_id)
        return

    try:
        caption = f"Here is the {asset_key.replace('-', ' ')} details you requested!"
        if portfolio_url.endswith(".pdf"):
            await wa.send_document(
                to=phone,
                url=portfolio_url,
                filename=f"{asset_key}.pdf",
                caption=caption
            )
        else:
            await wa.send_image(
                to=phone,
                url=portfolio_url,
                caption=caption
            )
        log.info("asset_sent", contact_id=contact_id, asset_key=asset_key)
    except Exception as e:
        log.warning("asset_send_failed", error=str(e))
