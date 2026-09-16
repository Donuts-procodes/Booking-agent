import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Feedback(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feedback"

    merchant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    booking_id: Mapped[str | None] = mapped_column(String(16), ForeignKey("bookings.id"), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    flow_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
