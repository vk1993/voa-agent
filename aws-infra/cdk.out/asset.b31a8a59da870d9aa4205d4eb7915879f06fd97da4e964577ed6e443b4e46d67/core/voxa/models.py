from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, ConfigDict

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime

class TurnInput(BaseModel):
    model_config = ConfigDict(frozen=True)
    text: str
    contact_id: str
    tenant_id: str
    history: list[ConversationTurn] = []
    language: Literal["en", "hi", "hinglish"] = "en"
    call_sid: str
    turn_index: int = 0
    tenant_context: dict = {}   # Raw dict, parsed to TenantContext in processor

class LatencyBreakdown(BaseModel):
    pii_ms: float = 0.0
    rag_ms: float = 0.0
    llm_ms: float = 0.0
    total_ms: float = 0.0

class ToolCall(BaseModel):
    name: str
    input: dict[str, Any]
    executed_at: datetime

class TurnOutput(BaseModel):
    response_text: str
    tool_calls: list[ToolCall] = []
    intent: str = "unknown"
    latency: LatencyBreakdown

class ExtractionFieldDef(BaseModel):
    """Definition of a field to extract from a call transcript."""
    key: str
    type: Literal["number", "string", "boolean", "array", "enum"]
    prompt: str = ""
    values: list[str] = []   # for enum type

class ExtractedLeadData(BaseModel):
    """
    Domain-agnostic extracted lead data.
    Fields are dynamically keyed — whatever extraction_fields defines.
    Always contains these universal baseline keys:
      budget (int, INR), timeline (str), domain_qualifier (str),
      next_action (str), objections (list[str])
    Plus any domain-specific keys the tenant configured.
    """
    model_config = ConfigDict(extra="allow")

    budget: int = 0
    timeline: str = "not_specified"
    domain_qualifier: str = "none"   # replaces style_preference and bhkType
    next_action: str = "no_action"   # replaces requires_booking bool
    pincode: str = ""
    objections: list[str] = []

    @property
    def requires_booking(self) -> bool:
        """Backward-compat shim for code that checks requires_booking."""
        return self.next_action == "book_visit"

    @property
    def style_preference(self) -> str:
        """Backward-compat shim for code that checks style_preference."""
        return self.domain_qualifier

class TenantContext(BaseModel):
    """Full tenant configuration. Loaded from Tenant.config JSON."""
    model_config = ConfigDict(extra="allow")

    class Persona(BaseModel):
        agent_name: str = "VOXA"
        company_name: str = "VOXA"
        role_description: str = "AI sales consultant"
        primary_goal: str = "qualify leads and book a meeting"
        call_to_action: str = "Can I schedule a meeting for you?"
        language: str = "en"
        fallback_lang: str = "hinglish"

    class Service(BaseModel):
        name: str
        range_inr: list[int] = [0, 0]
        lead_days: int = 0

    class Location(BaseModel):
        name: str
        pincodes: list[str] = []
        calendar_id: str = ""
        contact_name: str = ""
        contact_role: str = "advisor"   # designer / site manager / advisor / etc.

    class Promotion(BaseModel):
        text: str
        expires: str = ""

    class FAQ(BaseModel):
        q: str
        a: str

    class QualitySignal(BaseModel):
        field: str
        match: str | None = None    # exact match
        gt: int | None = None       # greater than (for numeric fields)
        not_eq: str | None = None   # not equal
        weight: int = 10

    persona: Persona = Persona()
    services: list[Service] = []
    locations: list[Location] = []
    promotions: list[Promotion] = []
    faqs: list[FAQ] = []
    media_map: dict[str, str] = {}
    next_action_type: str = "book_visit"
    extraction_fields: list[ExtractionFieldDef] = []
    quality_signals: list[QualitySignal] = []
    whatsapp_template: str = "appointment_confirmation"

    def lookup_location(self, pincode: str) -> "TenantContext.Location | None":
        """Find the matching location for a pincode. Returns None if not found."""
        pincode = pincode.strip()
        for loc in self.locations:
            if pincode in loc.pincodes:
                return loc
        return self.locations[0] if self.locations else None

class CallEvent(BaseModel):
    contact_id: str
    timestamp: datetime
    event_type: Literal[
      "CallCompleted", "PreferenceExtracted",
      "ObjectionRaised", "BookingCreated"
    ]
    payload: dict[str, Any]

class AppointmentResult(BaseModel):
    event_id: str
    html_link: str
    start_time: datetime
    confirmation_code: str  # first 8 chars of event_id, upper

class AvailableSlot(BaseModel):
    start_time: datetime
    end_time: datetime
