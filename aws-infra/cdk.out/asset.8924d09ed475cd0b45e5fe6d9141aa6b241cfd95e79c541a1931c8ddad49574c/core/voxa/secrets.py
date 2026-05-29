"""
AWS Secrets Manager with module-level cache.
Replaces the scattered getSecrets() pattern in post-call.ts.
"""
import json
import os
import boto3
import structlog

log = structlog.get_logger()
_cache: dict | None = None

def get_secrets() -> dict:
    """Return secrets dict. Cached after first call for Lambda container reuse."""
    global _cache
    if _cache is not None:
        return _cache

    arn = os.environ.get("VOXA_SECRETS_ARN")
    if not arn:
        log.warning("secrets_arn_missing", fallback="env vars")
        _cache = {
            k: os.environ.get(k, "")
            for k in [
                "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID",
                "PINECONE_API_KEY", "TWILIO_AUTH_TOKEN",
                "TWILIO_ACCOUNT_SID", "OPENAI_API_KEY",
                "GOOGLE_SERVICE_ACCOUNT_JSON",
            ]
        }
        return _cache

    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=arn)
    _cache = json.loads(response["SecretString"])
    log.info("secrets_loaded", key_count=len(_cache))
    return _cache
