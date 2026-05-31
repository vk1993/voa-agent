import pytest
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from worker.post_call import _process_record
from voxa.models import AvailableSlot, AppointmentResult
from tests.conftest import SAMPLE_TENANT_CONTEXT, SAMPLE_PROPERTY_CONTEXT

@pytest.mark.asyncio
async def test_process_record_empty_transcript(mocker):
    wa = MagicMock()
    calendar = MagicMock()
    record = {
        "messageId": "msg_empty",
        "body": json.dumps({"payload": {"transcript": ""}})
    }
    
    # Verify it returns early and does not call LLM or WhatsApp
    mock_extract = mocker.patch("worker.post_call.extract_lead_data")
    await _process_record(record, wa, calendar)
    mock_extract.assert_not_called()

@pytest.mark.asyncio
async def test_process_record_happy_path_interior(mocker):
    # Setup mocks
    mock_extract = mocker.patch("worker.post_call.extract_lead_data", AsyncMock(return_value={
        "budget": 350000,
        "timeline": "60 days",
        "domain_qualifier": "kitchen",
        "next_action": "book_visit",
        "pincode": "560038",
        "objections": ["pricing"]
    }))

    mock_append = mocker.patch("worker.post_call.append_event", AsyncMock())
    mocker.patch("worker.post_call._fetch_tenant_context", AsyncMock(return_value=SAMPLE_TENANT_CONTEXT))
    
    # Mock WhatsApp Service
    wa = MagicMock()
    wa.send_post_call_bundle = AsyncMock()

    # Mock Google Calendar Service
    calendar = MagicMock()
    slot = AvailableSlot(
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc)
    )
    calendar.get_available_slots = AsyncMock(return_value=[slot])
    
    appt = AppointmentResult(
        event_id="evt_123",
        html_link="http://link",
        start_time=datetime.now(timezone.utc),
        confirmation_code="CONF123"
    )
    calendar.create_appointment = AsyncMock(return_value=appt)

    # AWS SQS record input
    record = {
        "messageId": "msg_ok",
        "body": json.dumps({
            "payload": {
                "transcript": "User: I want to book a kitchen visit, pincode is 560038.",
                "contactId": "c1",
                "customerName": "Jane Doe",
                "customerPhone": "+91 98765 43210",
                "tenantId": "t_interior"
            }
        })
    }

    await _process_record(record, wa, calendar)

    # Assertions
    mock_extract.assert_called_once()
    wa.send_post_call_bundle.assert_called_once()
    kwargs = wa.send_post_call_bundle.call_args[1]
    assert kwargs["client_name"] == "Jane Doe"
    assert kwargs["project_type"] == "kitchen"
    assert kwargs["designer_name"] == "Arjun Reddy"  # Loaded Indiranagar context contact
    assert kwargs["showroom"] == "Indiranagar"
    assert kwargs["template_name"] == "appointment_confirmation"

@pytest.mark.asyncio
async def test_process_record_happy_path_property(mocker):
    # Setup mocks for property vertical
    mock_extract = mocker.patch("worker.post_call.extract_lead_data", AsyncMock(return_value={
        "budget": 5000000,
        "timeline": "immediate",
        "domain_qualifier": "villa",
        "next_action": "book_visit",
        "pincode": "562110",
        "objections": []
    }))

    mock_append = mocker.patch("worker.post_call.append_event", AsyncMock())
    mocker.patch("worker.post_call._fetch_tenant_context", AsyncMock(return_value=SAMPLE_PROPERTY_CONTEXT))
    
    # Mock WhatsApp Service
    wa = MagicMock()
    wa.send_post_call_bundle = AsyncMock()

    # Mock Google Calendar Service
    calendar = MagicMock()
    slot = AvailableSlot(
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc)
    )
    calendar.get_available_slots = AsyncMock(return_value=[slot])
    
    appt = AppointmentResult(
        event_id="evt_456",
        html_link="http://link",
        start_time=datetime.now(timezone.utc),
        confirmation_code="CONF456"
    )
    calendar.create_appointment = AsyncMock(return_value=appt)

    # AWS SQS record input
    record = {
        "messageId": "msg_prop",
        "body": json.dumps({
            "payload": {
                "transcript": "User: Interested in villas at Devanahalli, pincode 562110.",
                "contactId": "c2",
                "customerName": "Bob Villa",
                "customerPhone": "+91 99999 88888",
                "tenantId": "t_property"
            }
        })
    }

    await _process_record(record, wa, calendar)

    # Assertions
    mock_extract.assert_called_once()
    wa.send_post_call_bundle.assert_called_once()
    kwargs = wa.send_post_call_bundle.call_args[1]
    assert kwargs["client_name"] == "Bob Villa"
    assert kwargs["project_type"] == "villa"
    assert kwargs["designer_name"] == "Sneha Rao"  # Devanahalli context contact_name
    assert kwargs["showroom"] == "Devanahalli Site Office"
    assert kwargs["template_name"] == "site_visit_confirmation"
