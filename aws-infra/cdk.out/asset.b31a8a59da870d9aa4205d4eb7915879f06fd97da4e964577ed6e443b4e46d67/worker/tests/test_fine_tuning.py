import pytest
import json
from unittest.mock import MagicMock, AsyncMock
from worker.fine_tuning import score_conversation, to_jsonl_record, _run_export
from tests.conftest import SAMPLE_TENANT_CONTEXT, SAMPLE_PROPERTY_CONTEXT

def test_score_conversation_default_gold():
    extracted = {
        "requires_booking": True,
        "budget": 100000,
        "style_preference": "modern",
        "timeline": "urgent"
    }
    lines = [
        "User: Hello",
        "AI: Hi",
        "User: I want a modern kitchen",
        "AI: Great, let's book a showroom"
    ]
    score = score_conversation(lines, extracted)
    assert score["tier"] == "gold"
    assert score["breakdown"]["requires_booking"] == 30
    assert score["breakdown"]["budget"] == 15
    assert score["breakdown"]["style_preference"] == 15
    assert score["breakdown"]["timeline"] == 10
    assert score["breakdown"]["escalation"] == 15

def test_score_conversation_custom_property_signals():
    # Test real estate vertical signals
    extracted = {
        "next_action": "book_visit",
        "budget": 5000000,
        "domain_qualifier": "villa",
        "timeline": "2 months"
    }
    lines = [
        "User: I want a villa in Devanahalli",
        "AI: We have premium villas",
        "User: Cool, let's book a visit",
        "AI: Sure"
    ]
    # Apex Properties signals
    signals = SAMPLE_PROPERTY_CONTEXT["quality_signals"]
    score = score_conversation(lines, extracted, quality_signals=signals)
    assert score["total"] >= 50
    assert score["breakdown"]["next_action"] == 30
    assert score["breakdown"]["budget"] == 20
    assert score["breakdown"]["domain_qualifier"] == 10

def test_score_conversation_escalation():
    extracted = {
        "requires_booking": True,
        "budget": 100000,
        "style_preference": "modern",
        "timeline": "urgent"
    }
    lines = ["User: Hello", "AI: Hi", "User: speak to human manager please", "AI: Okay"]
    score = score_conversation(lines, extracted)
    assert score["breakdown"]["escalation"] == 0

def test_to_jsonl_record_roles():
    lines = ["User: Hi", "VOXA: Hello", "User: Yes", "AI: Okay"]
    record = to_jsonl_record(lines, system_prompt="Test System")
    assert record["system"] == "Test System"
    assert record["messages"][0]["role"] == "user"
    assert record["messages"][1]["role"] == "assistant"
    assert record["messages"][2]["role"] == "user"
    assert record["messages"][3]["role"] == "assistant"

def test_to_jsonl_record_too_short():
    lines = ["User: Hi", "VOXA: Hello"]
    assert to_jsonl_record(lines) is None

@pytest.mark.asyncio
async def test_run_export_s3_upload(mocker):
    # Mock boto3 DynamoDB
    mock_table = MagicMock()
    mock_table.scan.return_value = {
        "Items": [
            {
                "contact_id": "c1",
                "timestamp": "2026-05-30T12:00:00Z",
                "payload": json.dumps({
                    "transcriptSummary": "Budget: 1000000. Style: kitchen.",
                    "transcriptLines": "User: Hi\nVOXA: Hello\nUser: Book a visit\nVOXA: Done",
                    "lead_data": {
                        "requires_booking": True,
                        "budget": 1000000,
                        "style_preference": "kitchen",
                        "domain_qualifier": "kitchen",
                        "timeline": "immediate",
                        "next_action": "book_visit"
                    },
                    "tenant_id": "t1"
                })
            }
        ]
    }
    mock_db = MagicMock()
    mock_db.Table.return_value = mock_table
    mocker.patch("boto3.resource", return_value=mock_db)

    # Mock S3 Client
    mock_s3 = MagicMock()
    mocker.patch("boto3.client", return_value=mock_s3)

    # Mock Tenant Context Fastify API
    mocker.patch("worker.fine_tuning._fetch_tenant_context", AsyncMock(return_value=SAMPLE_TENANT_CONTEXT))

    # Mock environment variable
    mocker.patch.dict("os.environ", {"RECORDINGS_BUCKET": "test-bucket"})

    await _run_export()

    mock_s3.put_object.assert_called_once()
    kwargs = mock_s3.put_object.call_args[1]
    assert kwargs["Bucket"] == "test-bucket"
    assert "fine-tuning/dataset" in kwargs["Key"]
    assert b"Test System" not in kwargs["Body"]
