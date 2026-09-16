import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ServiceStaff(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "service_staff"
    __table_args__ = (
        UniqueConstraint("service_id", "staff_id", name="uq_service_staff"),
    )

    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    staff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False)

    service: Mapped["Service"] = relationship("Service", back_populates="staff_assignments")
    staff: Mapped["Staff"] = relationship("Staff", back_populates="service_assignments")
