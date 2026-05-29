import pytest
from worker.fine_tuning import score_conversation, to_jsonl_record

def test_score_conversation_gold():
    extracted = {"requires_booking": True, "budget": 100000, "style_preference": "modern", "timeline": "urgent"}
    lines = ["User: Hello", "AI: Hi", "User: I want a modern kitchen", "AI: Great, let's book a showroom"]
    score = score_conversation(lines, extracted)
    assert score["tier"] == "gold"

def test_score_conversation_escalation():
    extracted = {"requires_booking": True, "budget": 100000, "style_preference": "modern", "timeline": "urgent"}
    lines = ["User: Hello", "AI: Hi", "User: speak to a person", "AI: Okay"]
    score = score_conversation(lines, extracted)
    assert score["breakdown"]["no_escalation"] == 0

def test_to_jsonl_record_roles():
    lines = ["User: Hi", "VOXA: Hello", "User: Yes", "AI: Okay"]
    record = to_jsonl_record(lines)
    assert record["messages"][0]["role"] == "user"
    assert record["messages"][1]["role"] == "assistant"
    assert record["messages"][2]["role"] == "user"
    assert record["messages"][3]["role"] == "assistant"

def test_to_jsonl_record_too_short():
    lines = ["User: Hi", "VOXA: Hello"]
    assert to_jsonl_record(lines) is None
