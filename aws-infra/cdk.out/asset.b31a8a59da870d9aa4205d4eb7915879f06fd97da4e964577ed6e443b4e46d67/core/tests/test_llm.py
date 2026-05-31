import pytest
from unittest.mock import AsyncMock, MagicMock
from voxa.models import TurnInput, TenantContext, ConversationTurn
from voxa.llm import (
    _build_system_prompt,
    _build_send_asset_tool,
    process_turn,
    extract_lead_data,
)
from tests.conftest import SAMPLE_TENANT_CONTEXT, SAMPLE_PROPERTY_CONTEXT

def test_build_system_prompt_interior():
    ctx = TenantContext(**SAMPLE_TENANT_CONTEXT)
    prompt = _build_system_prompt(ctx, rag_context="Catalog: premium wood styles", memory="Prior: wants blue kitchen")
    assert "Priya" in prompt
    assert "Prestige Interiors" in prompt
    assert "Catalog: premium wood styles" in prompt
    assert "Prior: wants blue kitchen" in prompt
    assert "15% off kitchens" in prompt
    assert "Do you provide EMI?" in prompt

def test_build_system_prompt_property():
    ctx = TenantContext(**SAMPLE_PROPERTY_CONTEXT)
    prompt = _build_system_prompt(ctx, "", "")
    assert "Rahul" in prompt
    assert "Apex Properties" in prompt
    assert "Devanahalli Site Office" in prompt
    assert "Is RERA approved?" in prompt

def test_build_send_asset_tool_interior():
    ctx = TenantContext(**SAMPLE_TENANT_CONTEXT)
    tool = _build_send_asset_tool(ctx)
    assert tool["name"] == "send_asset"
    assert "kitchen" in tool["input_schema"]["properties"]["asset_key"]["enum"]
    assert "full-home" in tool["input_schema"]["properties"]["asset_key"]["enum"]

def test_build_send_asset_tool_property():
    ctx = TenantContext(**SAMPLE_PROPERTY_CONTEXT)
    tool = _build_send_asset_tool(ctx)
    assert "plot-brochure" in tool["input_schema"]["properties"]["asset_key"]["enum"]
    assert "master-plan" in tool["input_schema"]["properties"]["asset_key"]["enum"]

@pytest.mark.asyncio
async def test_process_turn_anthropic_success(mocker):
    # Setup mock turn input
    turn = TurnInput(
        text="I want to see kitchen designs",
        contact_id="c123",
        tenant_id="default",
        call_sid="sid_123",
        tenant_context=SAMPLE_TENANT_CONTEXT,
    )

    # Mock Anthropic Client
    mock_msg = MagicMock()
    mock_block_tool = MagicMock()
    mock_block_tool.type = "tool_use"
    mock_block_tool.name = "signal_intent"
    mock_block_tool.input = {
        "intent": "Acknowledge",
        "spoken_response": "I can certainly show you some of our modular kitchen designs."
    }
    
    mock_block_asset = MagicMock()
    mock_block_asset.type = "tool_use"
    mock_block_asset.name = "send_asset"
    mock_block_asset.input = {"asset_key": "kitchen"}

    mock_msg.content = [mock_block_tool, mock_block_asset]
    
    mock_client = MagicMock()
    mock_client.messages.create = AsyncMock(return_value=mock_msg)
    mocker.patch("voxa.llm._client", mock_client)

    out = await process_turn(turn, rag_context="", memory="")
    assert out.intent == "Acknowledge"
    assert out.response_text == "I can certainly show you some of our modular kitchen designs."
    assert len(out.tool_calls) == 1
    assert out.tool_calls[0].name == "send_asset"
    assert out.tool_calls[0].input == {"asset_key": "kitchen"}

@pytest.mark.asyncio
async def test_extract_lead_data_success(mocker):
    # Mock Anthropic Response for extraction
    mock_msg = MagicMock()
    mock_block = MagicMock()
    mock_block.type = "text"
    mock_block.text = '{"budget": 500000, "timeline": "3 months", "domain_qualifier": "kitchen", "next_action": "book_visit", "pincode": "560038", "objections": []}'
    mock_msg.content = [mock_block]

    mock_client = MagicMock()
    mock_client.messages.create = AsyncMock(return_value=mock_msg)
    mocker.patch("voxa.llm._client", mock_client)

    transcript = "User: I need a kitchen within 5 lakhs next quarter, at Indiranagar 560038."
    extracted = await extract_lead_data(transcript, extraction_fields=SAMPLE_TENANT_CONTEXT["extraction_fields"])
    
    assert extracted["budget"] == 500000
    assert extracted["pincode"] == "560038"
    assert extracted["next_action"] == "book_visit"
    assert extracted["domain_qualifier"] == "kitchen"
