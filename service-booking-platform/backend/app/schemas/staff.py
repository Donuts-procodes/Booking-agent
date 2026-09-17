from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StaffLoginRequest(BaseModel):
    email: str
    password: str


class StaffLoginResponse(BaseModel):
    access_token: str
    staff_name: str


class StaffDecisionRequest(BaseModel):
    action: str = Field(pattern="^(accept|reject)$")
    reason: str | None = None


class StaffFinalizeRequest(BaseModel):
    scheduled_date: str
    payment_status: str = "pending"
    notes: str | None = None


class StaffQueueItemResponse(BaseModel):
    booking_id: str
    service_name: str
    customer_name: str
    customer_phone: str
    customer_email: str | None
    note: str | None
    status: str
    created_at: datetime
    assigned_staff_id: str | None = None

    model_config = ConfigDict(from_attributes=True)
