import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookingCreate(BaseModel):
    merchant_id: uuid.UUID
    service_id: uuid.UUID
    customer_name: str = Field(min_length=1, max_length=120)
    customer_phone: str = Field(min_length=7, max_length=32)
    customer_email: str | None = None
    note: str | None = None
    channel: str = "web"


class BookingResponse(BaseModel):
    booking_id: str
    status: str
    assigned_staff_id: uuid.UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatusCheckRequest(BaseModel):
    booking_id: str
    phone: str


class StatusCheckResponse(BaseModel):
    booking_id: str
    status: str
    service_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerifyCancellationRequest(BaseModel):
    booking_id: str
    phone_or_name: str


class VerifyCancellationResponse(BaseModel):
    is_valid: bool
    cancellation_eligible: bool
    reason: str | None = None
    message: str | None = None
    booking_id: str | None = None
    service_name: str | None = None
    customer_name: str | None = None
    verification_token: str | None = None


class CancelExecutionRequest(BaseModel):
    cancellation_reason: str | None = None
