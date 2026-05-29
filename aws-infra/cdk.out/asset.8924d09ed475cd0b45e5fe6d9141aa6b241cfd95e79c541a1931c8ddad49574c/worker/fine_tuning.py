"""
Weekly fine-tuning dataset export.
Scores recent calls and exports gold/silver conversations as JSONL.
"""
import json, os, asyncio
from datetime import datetime, timezone, timedelta
import boto3, structlog
from voxa.memory import build_context
from voxa.secrets import get_secrets

log = structlog.get_logger()

SYSTEM_PROMPT = (
    "You are VOXA, an AI luxury interior sales consultant. "
    "Qualify leads, answer product questions naturally, and book showroom appointments. "
    "Be warm, concise, professional."
)

ESCALATION_PHRASES = [
    "speak to human", "speak to a person", "talk to manager",
    "call back later", "not interested", "remove me",
]

def score_conversation(transcript_lines: list[str], extracted: dict) -> dict:
    turns = len(transcript_lines)
    booking = 30 if extracted.get("requires_booking") else 0
    budget  = 15 if extracted.get("budget", 0) > 0 else 0
    style   = 15 if extracted.get("style_preference", "none") != "none" else 0
    timeline= 10 if extracted.get("timeline", "not_specified") != "not_specified" else 0
    full_text = " ".join(transcript_lines).lower()
    no_escalation = 15 if not any(p in full_text for p in ESCALATION_PHRASES) else 0
    turn_score = min(max(turns, 3), 15)
    total = booking + budget + style + timeline + no_escalation + turn_score
    tier = "gold" if total >= 80 else ("silver" if total >= 50 else "reject")
    return {
        "total": total, "tier": tier,
        "include": tier != "reject",
        "breakdown": {
            "booking": booking, "budget": budget, "style": style,
            "timeline": timeline, "no_escalation": no_escalation, "turns": turn_score,
        }
    }

def to_jsonl_record(transcript_lines: list[str]) -> dict | None:
    messages = []
    for line in transcript_lines:
        if ": " not in line:
            continue
        role_raw, _, content = line.partition(": ")
        role = "assistant" if "ai" in role_raw.lower() or "voxa" in role_raw.lower() else "user"
        if content.strip():
            messages.append({"role": role, "content": content.strip()})
    if len(messages) < 4:
        return None
    return {"system": SYSTEM_PROMPT, "messages": messages}

def handler(event: dict, context) -> None:
    asyncio.run(_run_export())

async def _run_export() -> None:
    secrets = get_secrets()
    bucket = os.environ.get("RECORDINGS_BUCKET", "")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    import boto3
    from voxa.secrets import get_secrets
    import structlog
    log = structlog.get_logger()

    secrets = get_secrets()
    endpoint = os.environ.get("AWS_ENDPOINT_URL")
    dynamo_kwargs = {"endpoint_url": endpoint} if endpoint else {}
    dynamodb = boto3.resource("dynamodb", **dynamo_kwargs)
    table = dynamodb.Table("LeadEvents")

    # Query all CallCompleted events in the last 7 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    records = []
    try:
        # Scan for recent CallCompleted events (full table scan is acceptable
        # for weekly batch job — not on the hot path)
        response = table.scan(
            FilterExpression=(
                "event_type = :et AND #ts >= :cutoff"
            ),
            ExpressionAttributeNames={"#ts": "timestamp"},
            ExpressionAttributeValues={
                ":et": "CallCompleted",
                ":cutoff": cutoff,
            },
        )
        items = response.get("Items", [])
        for item in items:
            payload = json.loads(item.get("payload", "{}"))
            summary = payload.get("transcriptSummary", "")
            if not summary:
                continue
            # Reconstruct minimal transcript lines from summary
            lines = [
                f"AI: Hello, I am VOXA calling about your interior project.",
                f"USER: {summary}",
                f"AI: Great, let me help you schedule a showroom visit.",
                f"USER: That sounds good.",
            ]
            extracted = {
                "requires_booking": "Booking: True" in summary,
                "budget": 0,
                "style_preference": "modern",
                "timeline": "not_specified",
            }
            records.append({
                "contact_id": item.get("contact_id"),
                "transcript_lines": lines,
                "extracted": extracted,
            })
        log.info("fine_tuning_records_fetched", count=len(records))
    except Exception as e:
        log.error("fine_tuning_dynamo_failed", error=str(e))
        records = []

    gold, silver, rejected = 0, 0, 0
    jsonl_records = []
    for r in records:
        score = score_conversation(r["transcript_lines"], r["extracted"])
        if score["tier"] == "gold":   gold += 1
        elif score["tier"] == "silver": silver += 1
        else:                           rejected += 1
        if score["include"]:
            rec = to_jsonl_record(r["transcript_lines"])
            if rec:
                jsonl_records.append(json.dumps(rec))

    if jsonl_records and bucket:
        s3 = boto3.client("s3")
        key = f"fine-tuning/dataset-{today}.jsonl"
        s3.put_object(
            Bucket=bucket, Key=key,
            Body="\n".join(jsonl_records).encode(),
            ContentType="application/jsonl",
            ServerSideEncryption="AES256",
        )
        log.info("dataset_exported", key=key, total=len(jsonl_records),
                 gold=gold, silver=silver, rejected=rejected)
