from typing import Annotated, Any, Literal
from pydantic import BaseModel, Field


def add_messages(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return left + right


class BookingSlots(BaseModel):
    category_id: str | None = None
    service_id: str | None = None
    service_name: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    note: str | None = None
    is_confirmed: bool = False


class AgentState(BaseModel):
    messages: Annotated[list[dict[str, Any]], add_messages] = Field(default_factory=list)
    merchant_id: str
    channel: str = "web"
    current_intent: Literal["BOOKING", "STATUS_CHECK", "CANCELLATION", "FAQ", "GENERAL"] = "BOOKING"
    slots: BookingSlots = Field(default_factory=BookingSlots)
    missing_slots: list[str] = Field(default_factory=list)
    pending_tool_call: dict[str, Any] | None = None
    response_text: str = ""
    booking_id: str | None = None
    is_completed: bool = False
