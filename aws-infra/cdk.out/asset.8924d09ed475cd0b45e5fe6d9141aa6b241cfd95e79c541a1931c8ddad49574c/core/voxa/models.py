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

class ExtractedLeadData(BaseModel):
    budget: int = 0          # in INR paise
    timeline: str = "not_specified"
    style_preference: str = "none"
    requires_booking: bool = False
    pincode: str = ""
    objections: list[str] = []

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
