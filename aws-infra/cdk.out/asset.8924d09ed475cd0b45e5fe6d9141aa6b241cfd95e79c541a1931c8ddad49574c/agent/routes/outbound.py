"""POST /outbound — trigger an outbound call via Twilio/Vapi."""
import os, httpx, structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = structlog.get_logger()
router = APIRouter()

class OutboundRequest(BaseModel):
    contact_id: str
    phone: str            # E.164
    tenant_id: str
    script_id: str = "default"

@router.post("/outbound")
async def trigger_outbound(req: OutboundRequest):
    vapi_key = os.environ.get("VAPI_API_KEY", "")
    if not vapi_key:
        raise HTTPException(503, "VAPI_API_KEY not configured")

    payload = {
        "assistant": {"firstMessage": "Hi, this is VOXA calling!"},
        "phoneNumber": {"twilioPhoneNumber": os.environ.get("TWILIO_DID", "")},
        "customer": {"number": req.phone},
        "metadata": {"contact_id": req.contact_id, "tenant_id": req.tenant_id},
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.vapi.ai/call/phone",
            json=payload,
            headers={"Authorization": f"Bearer {vapi_key}"},
            timeout=10.0,
        )
        r.raise_for_status()

    log.info("outbound_triggered", contact_id=req.contact_id, phone=req.phone)
    return {"success": True, "call_id": r.json().get("id")}
