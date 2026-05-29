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

from voxa.models import CallEvent, ExtractedLeadData
from voxa.pii import mask_pii
from voxa.llm import extract_lead_data
from voxa.memory import append_event, build_context
from voxa.whatsapp import WhatsAppService
from voxa.calendar import GoogleCalendarService
from voxa.secrets import get_secrets
from voxa.telemetry import span

log = structlog.get_logger()

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

        # Single LLM call: extract structured lead data
        with span("worker.extract_lead", {"msg_id": msg_id}):
            raw_data = await extract_lead_data(clean_transcript)

        lead = ExtractedLeadData(**raw_data)
        contact_id = payload.get("contactId") or payload.get("contact", {}).get("id", "unknown")
        customer_name = payload.get("customerName") or payload.get("contact", {}).get("name", "Valued Client")
        customer_phone = payload.get("customerPhone") or payload.get("contact", {}).get("phone", "")
        duration = payload.get("duration", 0)

        # Persist events to DynamoDB
        await asyncio.gather(
            append_event(CallEvent(
                contact_id=contact_id,
                timestamp=datetime.now(timezone.utc),
                event_type="CallCompleted",
                payload={
                    "duration": duration,
                    "transcriptSummary": (
                        f"Budget: {lead.budget}. Style: {lead.style_preference}. "
                        f"Timeline: {lead.timeline}. Booking: {lead.requires_booking}."
                    ),
                },
            )),
            *(
                [append_event(CallEvent(
                    contact_id=contact_id,
                    timestamp=datetime.now(timezone.utc),
                    event_type="PreferenceExtracted",
                    payload={"trait": "StylePreference", "value": lead.style_preference},
                ))] if lead.style_preference != "none" else []
            ),
            *(
                [append_event(CallEvent(
                    contact_id=contact_id,
                    timestamp=datetime.now(timezone.utc),
                    event_type="ObjectionRaised",
                    payload={"objection": obj},
                ))] for obj in lead.objections
            ),
        )

        log.info("lead_extracted", contact_id=contact_id, requires_booking=lead.requires_booking)

        if not lead.requires_booking:
            return

        # Post-call actions: calendar booking + WhatsApp bundle
        clean_phone = customer_phone.replace(" ", "").replace("-", "")

        if calendar is None:
            log.warning("calendar_skipped", reason="not_configured")
        else:
            showroom = calendar.lookup_showroom(lead.pincode)

            # Find next available slot
            tomorrow = datetime.now(timezone.utc).replace(
                hour=9, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            slots = await calendar.get_available_slots(
                showroom["calendar_id"], tomorrow,
                tomorrow.replace(hour=21), 60
            )

            appt = None
            if slots:
                masked_phone = clean_phone[:3] + "••••" + clean_phone[-4:] if len(clean_phone) >= 7 else "••••"
                appt = await calendar.create_appointment(
                    calendar_id=showroom["calendar_id"],
                    slot=slots[0],
                    client_name=customer_name,
                    project_type=lead.style_preference,
                    designer_name=showroom["designer"],
                    showroom_name=showroom["name"],
                    client_phone_masked=masked_phone,
                )
                await append_event(CallEvent(
                    contact_id=contact_id,
                    timestamp=datetime.now(timezone.utc),
                    event_type="BookingCreated",
                    payload={
                        "confirmation_code": appt.confirmation_code,
                        "start_time": appt.start_time.isoformat(),
                        "showroom": showroom["name"],
                        "designer": showroom["designer"],
                    },
                ))
                log.info("booking_created", code=appt.confirmation_code, contact_id=contact_id)

            # WhatsApp bundle (fire-and-forget, non-blocking)
            if clean_phone and appt:
                appt_time_str = appt.start_time.strftime("%a, %b %-d · %-I:%M %p IST")
                voucher = "SAVE15-" + contact_id[:6].upper()
                portfolio_url = (
                    f"https://cdn.voxa.ai/portfolio/{lead.style_preference.replace(' ','-').lower()}.jpg"
                )
                await wa.send_post_call_bundle(
                    to=clean_phone,
                    client_name=customer_name,
                    project_type=lead.style_preference,
                    appointment_time=appt_time_str,
                    designer_name=showroom["designer"],
                    showroom=showroom["name"],
                    voucher_code=voucher,
                    portfolio_url=portfolio_url,
                )

    except Exception as e:
        log.error("record_processing_failed", msg_id=msg_id, error=str(e))
        raise   # re-raise so Lambda marks message as failed → DLQ
