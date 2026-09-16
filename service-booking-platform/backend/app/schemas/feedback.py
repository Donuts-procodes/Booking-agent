import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    merchant_id: uuid.UUID
    booking_id: str | None = None
    session_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    flow_type: str | None = None


class FeedbackRead(BaseModel):
    id: uuid.UUID
    merchant_id: uuid.UUID
    booking_id: str | None
    rating: int
    comment: str | None
    flow_type: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
