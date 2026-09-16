import uuid
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class BookingStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    FINALIZED = "finalized"
    CANCELLED = "cancelled"


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, index=True)
    merchant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.id"), index=True, nullable=False)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    staff_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=True)

    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    channel: Mapped[str] = mapped_column(String(32), default="web", nullable=False)

    status: Mapped[BookingStatus] = mapped_column(String(24), default=BookingStatus.PENDING, nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    offline_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
