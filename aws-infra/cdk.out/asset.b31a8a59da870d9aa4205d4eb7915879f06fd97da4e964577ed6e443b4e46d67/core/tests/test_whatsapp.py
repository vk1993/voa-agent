import pytest
import respx
from voxa.whatsapp import WhatsAppService

@pytest.mark.asyncio
@respx.mock
async def test_send_post_call_bundle():
    respx.post("https://graph.facebook.com/v20.0/123/messages").mock(
        return_value=respx.MockResponse(200, json={"messages": [{"id": "msg_123"}]})
    )
    svc = WhatsAppService("123", "token")
    await svc.send_post_call_bundle(
        to="9876543210", client_name="John", project_type="Kitchen",
        appointment_time="10 AM", designer_name="Aarav", showroom="HSR",
        voucher_code="V123", portfolio_url="http://img",
        template_name="custom_template"
    )
