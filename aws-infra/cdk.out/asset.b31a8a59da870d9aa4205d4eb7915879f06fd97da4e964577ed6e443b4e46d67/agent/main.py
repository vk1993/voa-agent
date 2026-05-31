import os
import structlog
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager

from voxa.secrets import get_secrets
from voxa.telemetry import span

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load secrets once at startup — warm container reuse
    secrets = get_secrets()
    os.environ.update({k: v for k, v in secrets.items() if v})
    log.info("agent_startup", secrets_loaded=len(secrets))
    yield

app = FastAPI(title="VOXA Voice Agent", lifespan=lifespan)

from routes.turn import router as turn_router
from routes.outbound import router as outbound_router
from routes.webhook import router as webhook_router

app.include_router(turn_router)
app.include_router(outbound_router)
app.include_router(webhook_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "voxa-agent"}
