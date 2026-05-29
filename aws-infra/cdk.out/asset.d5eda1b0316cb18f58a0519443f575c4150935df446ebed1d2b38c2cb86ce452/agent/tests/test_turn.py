import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_turn_empty():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/turn", json={"transcript": ""})
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_turn_valid(mocker):
    # Setup mocks for processor to avoid actual LLM calls
    pass
