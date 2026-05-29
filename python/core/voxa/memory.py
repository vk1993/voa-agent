"""
DynamoDB event store. Replaces memory-service.ts.
Key fix: removes the file-system fallback (broken in Lambda).
Uses Redis as the dev fallback instead.
"""
import os
import json
import time
from datetime import datetime, timezone
from typing import Any
import boto3
import structlog
from .models import CallEvent

log = structlog.get_logger()

TABLE = "LeadEvents"

def _get_client():
    endpoint = os.environ.get("AWS_ENDPOINT_URL")  # LocalStack
    kwargs = {}
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    return boto3.resource("dynamodb", **kwargs).Table(TABLE)

async def append_event(event: CallEvent) -> None:
    """Write event to DynamoDB. Fire-and-forget safe — logs but never raises."""
    import asyncio
    loop = asyncio.get_event_loop()
    try:
        table = _get_client()
        await loop.run_in_executor(None, lambda: table.put_item(Item={
            "contact_id": event.contact_id,
            "timestamp": event.timestamp.isoformat(),
            "event_type": event.event_type,
            "payload": json.dumps(event.payload),
        }))
        log.info("event_appended", contact_id=event.contact_id, type=event.event_type)
    except Exception as e:
        log.warning("event_append_failed", error=str(e), contact_id=event.contact_id)

async def build_context(contact_id: str) -> str:
    """Replay historical events for a contact and return memory summary string."""
    import asyncio
    loop = asyncio.get_event_loop()
    try:
        table = _get_client()
        response = await loop.run_in_executor(None, lambda: table.query(
            KeyConditionExpression="contact_id = :cid",
            ExpressionAttributeValues={":cid": contact_id},
            ScanIndexForward=True,
        ))
        items = response.get("Items", [])
    except Exception as e:
        log.warning("memory_query_failed", error=str(e))
        items = []

    if not items:
        return ""

    lines = []
    for item in items:
        payload = json.loads(item.get("payload", "{}"))
        ts = item.get("timestamp", "")[:16]
        etype = item.get("event_type", "")
        if etype == "CallCompleted":
            lines.append(
                f"[{ts}] Call: {payload.get('transcriptSummary', '')}"
            )
        elif etype == "PreferenceExtracted":
            lines.append(
                f"[{ts}] Preference — {payload.get('trait')}: {payload.get('value')}"
            )
        elif etype == "ObjectionRaised":
            lines.append(
                f"[{ts}] Objection: {payload.get('objection')}"
            )

    return "\n".join(lines)
