"""
Meta WhatsApp Cloud API. Replaces whatsapp.ts.
Adds: sendMediaMessage, sendPostCallBundle.
"""
import asyncio
import structlog
import httpx
from .models import TurnOutput

log = structlog.get_logger()
BASE = "https://graph.facebook.com/v20.0"

class WhatsAppService:
    def __init__(self, phone_number_id: str, access_token: str):
        self._phone_id = phone_number_id
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def send_template(
        self, to: str, template: str, variables: list[str]
    ) -> str:
        """Send pre-approved template. Returns message_id."""
        phone = to.replace("+", "").strip()
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template,
                "language": {"code": "en"},
                "components": [{
                    "type": "body",
                    "parameters": [{"type": "text", "text": v} for v in variables],
                }],
            },
        }
        return await self._post(payload)

    async def send_image(self, to: str, url: str, caption: str = "") -> str:
        phone = to.replace("+", "").strip()
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "image",
            "image": {"link": url, "caption": caption},
        }
        return await self._post(payload)

    async def send_document(
        self, to: str, url: str, filename: str, caption: str = ""
    ) -> str:
        phone = to.replace("+", "").strip()
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "document",
            "document": {"link": url, "filename": filename, "caption": caption},
        }
        return await self._post(payload)

    async def send_post_call_bundle(
        self, to: str, client_name: str, project_type: str,
        appointment_time: str, designer_name: str, showroom: str,
        voucher_code: str, portfolio_url: str,
        floor_plan_url: str | None = None,
    ) -> None:
        """Fire three messages: image → (optional) PDF → appointment template."""
        tasks = []
        # Message 1: portfolio image
        tasks.append(self.send_image(
            to, portfolio_url,
            caption=(
                f"Hi {client_name}! Here are {project_type} designs "
                f"curated by {designer_name} for your budget."
            )
        ))
        # Message 2: floor plan PDF (if provided)
        if floor_plan_url:
            tasks.append(self.send_document(
                to, floor_plan_url,
                filename=f"{project_type.replace(' ', '-')}-floorplan.pdf",
                caption="Sample floor plan for reference",
            ))
        # Message 3: appointment confirmation template
        tasks.append(self.send_template(
            to, "appointment_confirmation",
            [client_name, appointment_time, showroom, designer_name, voucher_code],
        ))
        # Execute with 800ms gap between messages
        for task in tasks:
            try:
                await task
                await asyncio.sleep(0.8)
            except Exception as e:
                log.warning("whatsapp_message_failed", error=str(e), to=to)

    async def _post(self, payload: dict) -> str:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{BASE}/{self._phone_id}/messages",
                json=payload, headers=self._headers, timeout=8.0,
            )
            r.raise_for_status()
            data = r.json()
            msg_id = data.get("messages", [{}])[0].get("id", "")
            log.info("whatsapp_sent", message_id=msg_id)
            return msg_id
