"""Shared fixtures for voxa-worker tests."""
import pytest

SAMPLE_TENANT_CONTEXT = {
    "persona": {
        "agent_name": "Priya",
        "company_name": "Prestige Interiors",
        "role_description": "luxury interior design consultant",
        "primary_goal": "book a showroom visit",
        "call_to_action": "Can I book a showroom visit this week?",
        "language": "en",
        "fallback_lang": "hinglish",
    },
    "services": [
        {"name": "Modular kitchen", "range_inr": [150000, 800000], "lead_days": 45},
        {"name": "Full-home interior", "range_inr": [500000, 5000000], "lead_days": 90},
    ],
    "locations": [
        {
            "name": "Indiranagar",
            "pincodes": ["560038", "560008"],
            "calendar_id": "indiranagar@prestige.voxa.ai",
            "contact_name": "Arjun Reddy",
            "contact_role": "designer",
        },
    ],
    "promotions": [{"text": "15% off kitchens until June 30", "expires": "2026-06-30"}],
    "faqs": [
        {"q": "Do you provide EMI?", "a": "Yes, 0% EMI up to 18 months via HDFC."},
    ],
    "media_map": {
        "kitchen": "https://cdn.voxa.ai/prestige/kitchen.jpg",
        "full-home": "https://cdn.voxa.ai/prestige/fullhome.jpg",
    },
    "next_action_type": "book_visit",
    "extraction_fields": [
        {"key": "budget", "type": "number", "prompt": "budget in INR, 0 if unknown"},
        {"key": "timeline", "type": "string", "prompt": "timeline or 'not_specified'"},
        {"key": "domain_qualifier", "type": "string", "prompt": "BHK type or property type"},
        {"key": "next_action", "type": "enum",
         "values": ["book_visit", "send_quote", "schedule_call", "send_asset", "no_action"]},
        {"key": "objections", "type": "array", "prompt": "list of objections raised"},
    ],
    "quality_signals": [
        {"field": "next_action", "match": "book_visit", "weight": 30},
        {"field": "budget", "gt": 0, "weight": 15},
        {"field": "domain_qualifier", "not_eq": "none", "weight": 15},
        {"field": "timeline", "not_eq": "not_specified", "weight": 10},
    ],
    "whatsapp_template": "appointment_confirmation",
}

SAMPLE_PROPERTY_CONTEXT = {
    "persona": {
        "agent_name": "Rahul",
        "company_name": "Apex Properties",
        "role_description": "property sales consultant",
        "primary_goal": "book a site visit",
        "call_to_action": "Can I schedule a site visit for you this weekend?",
        "language": "en",
        "fallback_lang": "hinglish",
    },
    "services": [
        {"name": "Residential plots", "range_inr": [2000000, 15000000], "lead_days": 7},
        {"name": "Villas", "range_inr": [8000000, 50000000], "lead_days": 14},
    ],
    "locations": [
        {
            "name": "Devanahalli Site Office",
            "pincodes": ["562110", "562114"],
            "calendar_id": "devanahalli@apexproperties.com",
            "contact_name": "Sneha Rao",
            "contact_role": "site manager",
        },
    ],
    "promotions": [],
    "faqs": [
        {"q": "Is RERA approved?", "a": "Yes, RERA registration PRM/KA/RERA/2025/001."},
    ],
    "media_map": {
        "plot-brochure": "https://cdn.voxa.ai/apex/brochure.pdf",
        "master-plan": "https://cdn.voxa.ai/apex/masterplan.jpg",
    },
    "next_action_type": "book_visit",
    "extraction_fields": [
        {"key": "budget", "type": "number", "prompt": "budget in INR, 0 if unknown"},
        {"key": "timeline", "type": "string", "prompt": "possession timeline"},
        {"key": "domain_qualifier", "type": "string",
         "prompt": "property type: Residential/Commercial/Industrial"},
        {"key": "next_action", "type": "enum",
         "values": ["book_visit", "send_quote", "schedule_call", "send_asset", "no_action"]},
        {"key": "objections", "type": "array", "prompt": "list of objections raised"},
    ],
    "quality_signals": [
        {"field": "next_action", "match": "book_visit", "weight": 30},
        {"field": "budget", "gt": 0, "weight": 20},
        {"field": "domain_qualifier", "not_eq": "none", "weight": 10},
    ],
    "whatsapp_template": "site_visit_confirmation",
}

__all__ = ["SAMPLE_TENANT_CONTEXT", "SAMPLE_PROPERTY_CONTEXT"]
