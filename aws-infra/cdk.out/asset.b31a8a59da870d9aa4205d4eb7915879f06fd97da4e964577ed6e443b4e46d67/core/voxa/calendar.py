"""
Google Calendar API. Replaces broken calendly.ts.
Uses service account JWT auth — no OAuth flow needed.
"""
import json, time, os, hashlib, asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
import httpx
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
import base64, structlog
from .models import AvailableSlot, AppointmentResult

log = structlog.get_logger()

SCOPES = "https://www.googleapis.com/auth/calendar"
TOKEN_URL = "https://oauth2.googleapis.com/token"
CALENDAR_BASE = "https://www.googleapis.com/calendar/v3"

IN_PUBLIC_HOLIDAYS_2026 = {
    "2026-01-26", "2026-03-14", "2026-04-14", "2026-04-18",
    "2026-05-01", "2026-08-15", "2026-10-02", "2026-10-20",
    "2026-12-25",
}

class GoogleCalendarService:
    def __init__(self, service_account_json: str):
        try:
            sa = json.loads(service_account_json)
            if not sa.get("client_email") or not sa.get("private_key"):
                raise ValueError("Missing client_email or private_key")
        except (json.JSONDecodeError, ValueError) as e:
            raise RuntimeError(
                f"GoogleCalendarService: invalid service account JSON: {e}. "
                "Set GOOGLE_SERVICE_ACCOUNT_JSON in Secrets Manager."
            ) from e
        self._email = sa["client_email"]
        self._key_pem = sa["private_key"].encode()
        self._token: str | None = None
        self._token_exp: float = 0.0

    async def _get_token(self) -> str:
        if self._token and time.time() < self._token_exp - 60:
            return self._token
        now = int(time.time())
        header = base64.urlsafe_b64encode(
            json.dumps({"alg":"RS256","typ":"JWT"}).encode()
        ).rstrip(b"=")
        claim = base64.urlsafe_b64encode(json.dumps({
            "iss": self._email, "scope": SCOPES,
            "aud": TOKEN_URL, "iat": now, "exp": now + 3600,
        }).encode()).rstrip(b"=")
        signing_input = header + b"." + claim
        key = serialization.load_pem_private_key(self._key_pem, password=None)
        sig = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
        jwt = signing_input + b"." + base64.urlsafe_b64encode(sig).rstrip(b"=")
        async with httpx.AsyncClient() as client:
            r = await client.post(TOKEN_URL, data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": jwt.decode(),
            })
            r.raise_for_status()
            data = r.json()
        self._token = data["access_token"]
        self._token_exp = time.time() + data["expires_in"]
        return self._token

    async def get_available_slots(
        self, calendar_id: str, date_min: datetime,
        date_max: datetime, duration_minutes: int = 60
    ) -> list[AvailableSlot]:
        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{CALENDAR_BASE}/calendars/{calendar_id}/events",
                params={
                    "timeMin": date_min.isoformat(),
                    "timeMax": date_max.isoformat(),
                    "singleEvents": "true", "orderBy": "startTime",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            r.raise_for_status()
        busy = [
            (datetime.fromisoformat(e["start"]["dateTime"]),
             datetime.fromisoformat(e["end"]["dateTime"]))
            for e in r.json().get("items", [])
        ]
        slots = []
        candidate = date_min.replace(minute=0, second=0, microsecond=0)
        while candidate + timedelta(minutes=duration_minutes) <= date_max:
            end = candidate + timedelta(minutes=duration_minutes)
            date_str = candidate.strftime("%Y-%m-%d")
            hour = candidate.hour
            is_holiday = date_str in IN_PUBLIC_HOLIDAYS_2026
            in_hours = 9 <= hour < 21
            overlaps = any(s < end and e > candidate for s, e in busy)
            if in_hours and not is_holiday and not overlaps:
                slots.append(AvailableSlot(start_time=candidate, end_time=end))
            candidate += timedelta(minutes=30)
            if len(slots) >= 5:
                break
        return slots

    async def create_appointment(
        self, calendar_id: str, slot: AvailableSlot,
        client_name: str, domain_qualifier: str,
        contact_name: str, contact_role: str,
        location_name: str, client_phone_masked: str,
    ) -> AppointmentResult:
        # Re-check conflict before writing
        existing = await self.get_available_slots(
            calendar_id, slot.start_time, slot.end_time, 60
        )
        if not existing:
            raise ValueError(f"Slot {slot.start_time} is no longer available")
        token = await self._get_token()
        body = {
            "summary": f"{client_name} — {domain_qualifier} consultation",
            "description": (
                f"{contact_role.capitalize()}: {contact_name}\n"
                f"Location: {location_name}\n"
                f"Contact: {client_phone_masked}\n"
                "Booked via VOXA AI"
            ),
            "start": {"dateTime": slot.start_time.isoformat(), "timeZone": "Asia/Kolkata"},
            "end":   {"dateTime": slot.end_time.isoformat(),   "timeZone": "Asia/Kolkata"},
            "reminders": {"useDefault": False, "overrides": [
                {"method": "email", "minutes": 1440},
                {"method": "popup", "minutes": 60},
            ]},
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{CALENDAR_BASE}/calendars/{calendar_id}/events",
                json=body, headers={"Authorization": f"Bearer {token}"},
            )
            r.raise_for_status()
            evt = r.json()
        return AppointmentResult(
            event_id=evt["id"],
            html_link=evt["htmlLink"],
            start_time=datetime.fromisoformat(evt["start"]["dateTime"]),
            confirmation_code=evt["id"][:8].upper(),
        )
