"""
SQS consumer. Replaces post-call.ts.
Key fixes from TypeScript version:
  - No file system fallback (broken in Lambda)
  - No dual-model complexity — single extract_lead_data() call
  - Google Calendar replaces broken Calendly
  - WhatsApp bundle replaces single template call
  - Pydantic validation on all external data
"""
import asyncio, json, os
from datetime import datetime, timezone, timedelta
import structlog
import boto3

from voxa.models import CallEvent, ExtractedLeadData, TenantContext
from voxa.pii import mask_pii
from voxa.llm import extract_lead_data
from voxa.memory import append_event, build_context
from voxa.whatsapp import WhatsAppService
from voxa.calendar import GoogleCalendarService
from voxa.secrets import get_secrets
from voxa.telemetry import span

log = structlog.get_logger()

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

def handler(event: dict, context) -> None:
    """AWS Lambda entry point for SQS batch."""
    asyncio.run(_process_batch(event["Records"]))

async def _process_batch(records: list[dict]) -> None:
    secrets = get_secrets()

    wa = WhatsAppService(
        phone_number_id=secrets.get("WHATSAPP_PHONE_ID", ""),
        access_token=secrets.get("WHATSAPP_TOKEN", ""),
    )
    google_sa_json = secrets.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    calendar_available = bool(google_sa_json)
    try:
        calendar = GoogleCalendarService(service_account_json=google_sa_json) \
            if calendar_available else None
    except RuntimeError as e:
        log.warning("calendar_init_failed", error=str(e))
        calendar = None

    tasks = [_process_record(r, wa, calendar) for r in records]
    await asyncio.gather(*tasks, return_exceptions=True)

async def _process_record(
    record: dict,
    wa: WhatsAppService,
    calendar: GoogleCalendarService,
) -> None:
    msg_id = record.get("messageId", "?")
    try:
        wrapper = json.loads(record["body"])
        payload = wrapper.get("payload", {})

        # Build transcript text
        raw = (
            payload.get("transcript") or
            payload.get("message", {}).get("transcript") or
            payload.get("call", {}).get("transcript") or ""
        )
        if isinstance(raw, list):
            transcript_text = "\n".join(
                f"{line.get('role','?')}: {line.get('text','')}"
                for line in raw
            )
        else:
            transcript_text = str(raw)

        if not transcript_text.strip():
            log.warning("empty_transcript", msg_id=msg_id)
            return

        # PII mask before any storage or LLM call
        clean_transcript = mask_pii(transcript_text)

        tenant_id = payload.get("tenantId") or payload.get("tenant", {}).get("id", "default")
        tenant_context = await _fetch_tenant_context(tenant_id)
        ctx = TenantContext(**tenant_context)

        # Single LLM call: extract structured lead data
        with span("worker.extract_lead", {"msg_id": msg_id}):
            raw_data = await extract_lead_data(
                clean_transcript,
                extraction_fields=[f.model_dump() for f in ctx.extraction_fields] if ctx.extraction_fields else None
            )

        lead = ExtractedLeadData(**raw_data)
        contact_id = payload.get("contactId") or payload.get("contact", {}).get("id", "unknown")
        customer_name = payload.get("customerName") or payload.get("contact", {}).get("name", "Valued Client")
        customer_phone = payload.get("customerPhone") or payload.get("contact", {}).get("phone", "")
        duration = payload.get("duration", 0)

        # Persist events to DynamoDB
        tasks = []
        tasks.append(append_event(CallEvent(
            contact_id=contact_id,
            timestamp=datetime.now(timezone.utc),
            event_type="CallCompleted",
            payload={
                "duration": duration,
                "transcriptSummary": (
                    f"Budget: {lead.budget}. Style: {lead.style_preference}. "
                    f"Timeline: {lead.timeline}. Booking: {lead.requires_booking}."
                ),
                "transcriptLines": clean_transcript,
                "lead_data": lead.model_dump(),
                "tenant_id": tenant_id,
            },
        )))

        if lead.domain_qualifier != "none":
            tasks.append(append_event(CallEvent(
                contact_id=contact_id,
                timestamp=datetime.now(timezone.utc),
                event_type="PreferenceExtracted",
                payload={"trait": "DomainQualifier", "value": lead.domain_qualifier},
            )))

        for obj in lead.objections:
            tasks.append(append_event(CallEvent(
                contact_id=contact_id,
                timestamp=datetime.now(timezone.utc),
                event_type="ObjectionRaised",
                payload={"objection": obj},
            )))

        await asyncio.gather(*tasks)

        recording_url = payload.get("recordingUrl", "")
        recording_s3_path = ""
        if recording_url:
            try:
                import httpx, boto3
                bucket = os.environ.get("RECORDINGS_BUCKET", "")
                if bucket:
                    s3_key = f"tenants/{tenant_id}/recordings/{contact_id}-{int(datetime.now().timestamp())}.mp3"
                    async with httpx.AsyncClient() as http:
                        r = await http.get(recording_url, timeout=30.0)
                        r.raise_for_status()
                        audio_bytes = r.content
                    s3 = boto3.client("s3")
                    s3.put_object(
                        Bucket=bucket, Key=s3_key,
                        Body=audio_bytes, ContentType="audio/mpeg",
                        ServerSideEncryption="AES256",
                    )
                    recording_s3_path = s3_key
                    log.info("recording_stored", s3_key=s3_key)
            except Exception as e:
                log.warning("recording_download_failed", error=str(e))

        # Map next_action to CallOutcome
        OUTCOME_MAP = {
            "book_visit":     "BOOKED",
            "send_quote":     "CALLBACK_REQUESTED",
            "schedule_call":  "CALLBACK_REQUESTED",
            "send_asset":     "THINKING",
            "no_action":      "NOT_INTERESTED",
            "dnd":            "DND",
        }
        outcome_type = OUTCOME_MAP.get(lead.next_action, "NO_ANSWER")

        # Compute sentiment: ratio of non-objection turns (simple heuristic)
        total_turns = max(len(clean_transcript.split("\n")), 1)
        objection_turns = len(lead.objections)
        sentiment_score = round(1.0 - (objection_turns / total_turns), 2)
        sentiment_score = max(0.0, min(1.0, sentiment_score))

        # Write CallLog to Postgres via Fastify internal API
        fastify_url = os.environ.get("FASTIFY_INTERNAL_URL", "http://fastify:3001")
        try:
            async with __import__("httpx").AsyncClient() as client:
                await client.post(
                    f"{fastify_url}/contacts/calls",
                    json={
                        "tenantId":        tenant_id,
                        "contactId":       contact_id,
                        "callSid":         payload.get("callSid") or payload.get("vapiCallId", ""),
                        "durationSeconds": int(duration),
                        "sentimentScore":  sentiment_score,
                        "outcomeType":     outcome_type,
                        "transcript":      clean_transcript,
                        "transcriptSummary": f"Budget:{lead.budget} Qualifier:{lead.domain_qualifier} Timeline:{lead.timeline} Next:{lead.next_action}",
                        "extractedEntities": lead.model_dump(),
                        "objectionsRaised":  {"objections": lead.objections},
                        "recordingS3Path":   recording_s3_path,
                    },
                    headers={"x-internal-key": os.environ.get("INTERNAL_API_KEY", "")},
                    timeout=5.0,
                )
        except Exception as e:
            log.warning("call_log_write_failed", error=str(e), contact_id=contact_id)
            # Non-fatal — continue with calendar/WhatsApp

        # Update contact status in Postgres
        STATUS_MAP = {
            "book_visit":    "BOOKED",
            "send_quote":    "CALLED",
            "schedule_call": "CALLED",
            "send_asset":    "CALLED",
            "no_action":     "CALLED",
        }
        new_status = STATUS_MAP.get(lead.next_action, "CALLED")
        try:
            async with __import__("httpx").AsyncClient() as client:
                await client.patch(
                    f"{fastify_url}/contacts/{contact_id}/status",
                    json={"status": new_status},
                    headers={"x-internal-key": os.environ.get("INTERNAL_API_KEY", "")},
                    timeout=5.0,
                )
        except Exception as e:
            log.warning("contact_status_update_failed", error=str(e))

        log.info("lead_extracted", contact_id=contact_id, next_action=lead.next_action)

        next_action_required = (lead.next_action == ctx.next_action_type)
        if not next_action_required:
            return

        # Post-call actions: calendar booking + WhatsApp bundle
        clean_phone = customer_phone.replace(" ", "").replace("-", "")

        if calendar is None:
            log.warning("calendar_skipped", reason="not_configured")
        else:
            location = ctx.lookup_location(lead.pincode)
            if not location:
                log.warning("location_not_found", pincode=lead.pincode)
                return

            # Find next available slot
            tomorrow = datetime.now(timezone.utc).replace(
                hour=9, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            slots = await calendar.get_available_slots(
                location.calendar_id, tomorrow,
                tomorrow.replace(hour=21), 60
            )

            appt = None
            if slots:
                masked_phone = clean_phone[:3] + "••••" + clean_phone[-4:] if len(clean_phone) >= 7 else "••••"
                appt = await calendar.create_appointment(
                    calendar_id=location.calendar_id,
                    slot=slots[0],
                    client_name=customer_name,
                    domain_qualifier=lead.domain_qualifier,
                    contact_name=location.contact_name,
                    contact_role=location.contact_role,
                    location_name=location.name,
                    client_phone_masked=masked_phone,
                )
                await append_event(CallEvent(
                    contact_id=contact_id,
                    timestamp=datetime.now(timezone.utc),
                    event_type="BookingCreated",
                    payload={
                        "confirmation_code": appt.confirmation_code,
                        "start_time": appt.start_time.isoformat(),
                        "location_name": location.name,
                        "contact_name": location.contact_name,
                    },
                ))
                log.info("booking_created", code=appt.confirmation_code, contact_id=contact_id)

            # WhatsApp bundle (fire-and-forget, non-blocking)
            if clean_phone and appt:
                appt_time_str = appt.start_time.strftime("%a, %b %-d · %-I:%M %p IST")
                voucher = "SAVE15-" + contact_id[:6].upper()
                portfolio_url = ctx.media_map.get(lead.domain_qualifier) or (list(ctx.media_map.values())[0] if ctx.media_map else "")
                await wa.send_post_call_bundle(
                    to=clean_phone,
                    client_name=customer_name,
                    project_type=lead.domain_qualifier,
                    appointment_time=appt_time_str,
                    designer_name=location.contact_name,
                    showroom=location.name,
                    voucher_code=voucher,
                    portfolio_url=portfolio_url,
                    template_name=ctx.whatsapp_template,
                )

        try:
            duration_minutes = round(duration / 60, 3)
            async with __import__("httpx").AsyncClient() as client:
                await client.post(
                    f"{fastify_url}/tenant/{tenant_id}/usage",
                    json={
                        "callMinutes":   duration_minutes,
                        "whatsappSent":  1 if (clean_phone and appt) else 0,
                        "inputTokens":   0,   # populated later from LLM telemetry
                        "outputTokens":  0,
                    },
                    headers={"x-internal-key": os.environ.get("INTERNAL_API_KEY", "")},
                    timeout=5.0,
                )
        except Exception as e:
            log.warning("usage_write_failed", error=str(e))

    except Exception as e:
        log.error("record_processing_failed", msg_id=msg_id, error=str(e))
        raise   # re-raise so Lambda marks message as failed → DLQ
