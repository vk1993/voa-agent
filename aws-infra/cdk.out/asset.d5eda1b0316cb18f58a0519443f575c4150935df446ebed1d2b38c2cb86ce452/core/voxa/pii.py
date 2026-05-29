"""
PII masking using Microsoft Presidio NER.
Eliminates the regex-only approach from pii-service.ts.
LOCATION entities are kept (needed for showroom routing).
"""
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine, OperatorConfig
import structlog

log = structlog.get_logger()

# Initialise once at module level — Lambda/container reuse keeps this warm
_analyzer = AnalyzerEngine()
_anonymizer = AnonymizerEngine()

ENTITIES = [
    "PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS",
    "CREDIT_CARD", "IN_AADHAAR", "IN_PAN", "LOCATION",
]

OPERATORS: dict[str, OperatorConfig] = {
    "PERSON":       OperatorConfig("replace", {"new_value": "<PERSON>"}),
    "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "<PHONE>"}),
    "EMAIL_ADDRESS":OperatorConfig("replace", {"new_value": "<EMAIL>"}),
    "CREDIT_CARD":  OperatorConfig("replace", {"new_value": "<CARD>"}),
    "IN_AADHAAR":   OperatorConfig("replace", {"new_value": "<AADHAAR>"}),
    "IN_PAN":       OperatorConfig("replace", {"new_value": "<PAN>"}),
    "LOCATION":     OperatorConfig("keep", {}),   # keep for routing
}

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "forget previous instructions",
    "system prompt",
    "developer mode",
    "dan mode",
    "new instructions",
]

def mask_pii(text: str, language: str = "en") -> str:
    """Redact PII using Presidio NER. Keeps LOCATION for showroom routing."""
    if not text:
        return ""
    lang = "en"   # Presidio supports en; hi via spaCy model if installed
    results = _analyzer.analyze(text=text, entities=ENTITIES, language=lang)
    anonymized = _anonymizer.anonymize(
        text=text, analyzer_results=results, operators=OPERATORS
    )
    redacted = _sanitize_injection(anonymized.text)
    log.debug(
        "pii_masked",
        entity_count=len(results),
        original_len=len(text),
        redacted_len=len(redacted),
    )
    return redacted

def _sanitize_injection(text: str) -> str:
    clean = text
    for pattern in INJECTION_PATTERNS:
        clean = clean.replace(pattern, "[REDACTED]")
        clean = clean.replace(pattern.title(), "[REDACTED]")
    return clean
