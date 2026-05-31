"""
POST /webhook — receives Vapi call lifecycle events.
Handles: call-ended (enqueues to SQS), status-update (logs only).
"""
import json, os, hmac, hashlib, boto3, structlog
from fastapi import APIRouter, Request, HTTPException

log = structlog.get_logger()
router = APIRouter()

def _verify_vapi_signature(secret: str, body: bytes, sig_header: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig_header, expected)

@router.post("/webhook")
async def vapi_webhook(request: Request):
    body_bytes = await request.body()

    webhook_secret = os.environ.get("VAPI_WEBHOOK_SECRET", "")
    if webhook_secret:
        sig = request.headers.get("x-vapi-signature", "")
        if not _verify_vapi_signature(webhook_secret, body_bytes, sig):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    message_type = payload.get("message", {}).get("type") or payload.get("type", "")
    log.info("vapi_webhook_received", type=message_type)

    if message_type in ("end-of-call-report", "call-ended"):
        call_data = payload.get("message") or payload
        tenant_id  = (call_data.get("metadata") or {}).get("tenant_id", "")
        contact_id = (call_data.get("metadata") or {}).get("contact_id", "")

        sqs_payload = {
            "payload": {
                "tenantId":       tenant_id,
                "contactId":      contact_id,
                "customerName":   (call_data.get("customer") or {}).get("name", ""),
                "customerPhone":  (call_data.get("customer") or {}).get("number", ""),
                "duration":       call_data.get("durationSeconds") or
                                  call_data.get("duration", 0),
                "transcript":     call_data.get("transcript", ""),
                "recordingUrl":   call_data.get("recordingUrl", ""),
                "callId":         call_data.get("id", ""),
                "callSid":        call_data.get("callSid", ""),
                "vapiCallId":     call_data.get("id", ""),
            }
        }

        queue_url = os.environ.get("POST_CALL_QUEUE_URL", "")
        if queue_url:
            endpoint = os.environ.get("AWS_ENDPOINT_URL")
            kwargs = {"endpoint_url": endpoint} if endpoint else {}
            sqs = boto3.client("sqs", **kwargs)
            sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(sqs_payload),
            )
            log.info("post_call_enqueued", contact_id=contact_id, tenant_id=tenant_id)
        else:
            log.warning("sqs_queue_url_not_set", skipping="post_call_enqueue")

    return {"received": True}
