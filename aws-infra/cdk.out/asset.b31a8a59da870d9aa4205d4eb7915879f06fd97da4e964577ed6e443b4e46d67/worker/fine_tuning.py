"""
Weekly fine-tuning dataset export.
Scores recent calls and exports gold/silver conversations as JSONL.
"""
import json, os, asyncio
from datetime import datetime, timezone, timedelta
import boto3, structlog
from voxa.models import TenantContext
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

def score_conversation(
    transcript_lines: list[str],
    extracted: dict,
    quality_signals: list[dict] | None = None,
) -> dict:
    if not quality_signals:
        quality_signals = [
            {"field": "requires_booking", "match": True, "weight": 30},
            {"field": "budget", "gt": 0, "weight": 15},
            {"field": "style_preference", "not_eq": "none", "weight": 15},
            {"field": "timeline", "not_eq": "not_specified", "weight": 10},
            {"field": "escalation", "match": False, "weight": 15},
        ]

    total = 0
    breakdown = {}
    full_text = " ".join(transcript_lines).lower()

    for signal in quality_signals:
        field = signal.get("field")
        weight = signal.get("weight", 10)
        matched = False

        if field == "escalation":
            has_escalation = any(p in full_text for p in ESCALATION_PHRASES)
            target = signal.get("match", False)
            if has_escalation == target:
                matched = True
        elif field in extracted:
            val = extracted[field]
            if "match" in signal and signal["match"] is not None:
                matched = (val == signal["match"])
            elif "gt" in signal and signal["gt"] is not None:
                try:
                    matched = (float(val) > float(signal["gt"]))
                except (ValueError, TypeError):
                    matched = False
            elif "not_eq" in signal and signal["not_eq"] is not None:
                matched = (val != signal["not_eq"])

        sig_score = weight if matched else 0
        total += sig_score
        breakdown[field] = sig_score

    # Include turn count score
    turns = len(transcript_lines)
    turn_score = min(max(turns, 3), 15)
    total += turn_score
    breakdown["turns"] = turn_score

    tier = "gold" if total >= 80 else ("silver" if total >= 50 else "reject")
    return {
        "total": total,
        "tier": tier,
        "include": tier != "reject",
        "breakdown": breakdown,
    }

def to_jsonl_record(transcript_lines: list[str], system_prompt: str = SYSTEM_PROMPT) -> dict | None:
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
    return {"system": system_prompt, "messages": messages}

def handler(event: dict, context) -> None:
    asyncio.run(_run_export())

async def _run_export() -> None:
    secrets = get_secrets()
    bucket = os.environ.get("RECORDINGS_BUCKET", "")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    endpoint = os.environ.get("AWS_ENDPOINT_URL")
    dynamo_kwargs = {"endpoint_url": endpoint} if endpoint else {}
    dynamodb = boto3.resource("dynamodb", **dynamo_kwargs)
    table = dynamodb.Table("LeadEvents")

    # Query all CallCompleted events in the last 7 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    records = []
    
    tenant_cache = {}
    async def get_cached_ctx(tid: str) -> TenantContext:
        if tid not in tenant_cache:
            raw_ctx = await _fetch_tenant_context(tid)
            tenant_cache[tid] = TenantContext(**raw_ctx)
        return tenant_cache[tid]

    try:
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
            raw_lines_str = payload.get("transcriptLines", "")
            if raw_lines_str:
                lines = raw_lines_str.split("\n")
            else:
                continue

            tenant_id = payload.get("tenant_id") or item.get("tenant_id") or "default"
            try:
                ctx = await get_cached_ctx(tenant_id)
            except Exception as ctx_err:
                log.warning("ctx_load_failed", tenant_id=tenant_id, error=str(ctx_err))
                ctx = TenantContext()

            lead_data = payload.get("lead_data") or {}
            extracted = {
                "requires_booking": lead_data.get("requires_booking") or payload.get("requires_booking") or False,
                "budget": lead_data.get("budget") or payload.get("budget") or 0,
                "style_preference": lead_data.get("style_preference") or lead_data.get("domain_qualifier") or payload.get("style_preference") or "none",
                "domain_qualifier": lead_data.get("domain_qualifier") or lead_data.get("style_preference") or payload.get("style_preference") or "none",
                "timeline": lead_data.get("timeline") or payload.get("timeline") or "not_specified",
                "next_action": lead_data.get("next_action") or ("book_visit" if lead_data.get("requires_booking") or payload.get("requires_booking") else "no_action"),
            }
            # Merge extra keys
            for k, v in lead_data.items():
                if k not in extracted:
                    extracted[k] = v

            records.append({
                "contact_id": item.get("contact_id"),
                "transcript_lines": lines,
                "extracted": extracted,
                "ctx": ctx,
            })
        log.info("fine_tuning_records_fetched", count=len(records))
    except Exception as e:
        log.error("fine_tuning_dynamo_failed", error=str(e))
        records = []

    gold, silver, rejected = 0, 0, 0
    jsonl_records = []
    
    from voxa.llm import _build_system_prompt

    for r in records:
        ctx = r["ctx"]
        quality_signals = [sig.model_dump() for sig in ctx.quality_signals] if ctx.quality_signals else None
        
        score = score_conversation(r["transcript_lines"], r["extracted"], quality_signals=quality_signals)
        if score["tier"] == "gold":   gold += 1
        elif score["tier"] == "silver": silver += 1
        else:                           rejected += 1
        
        if score["include"]:
            try:
                sys_prompt = _build_system_prompt(ctx)
            except Exception:
                sys_prompt = SYSTEM_PROMPT
            
            rec = to_jsonl_record(r["transcript_lines"], system_prompt=sys_prompt)
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
