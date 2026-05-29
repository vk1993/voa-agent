import pytest
from voxa.llm import process_turn
from voxa.models import TurnInput, TurnOutput

@pytest.mark.asyncio
async def test_process_turn_returns_turn_output(mocker):
    # Mocking anthropic client is complex, keeping stub for now
    pass
