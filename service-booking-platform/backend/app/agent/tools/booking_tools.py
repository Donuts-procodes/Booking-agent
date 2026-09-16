import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.booking import BookingCreate
from app.services.booking_service import create_booking_record
from app.services.router_service import assign_initial_staff


# Executes database transaction creating booking record and assigning specialist staff
async def tool_commit_booking(
    db: AsyncSession,
    merchant_id: str,
    service_id: str,
    customer_name: str,
    customer_phone: str,
    note: str | None = None,
) -> dict[str, Any]:
    m_id = uuid.UUID(merchant_id)
    s_id = uuid.UUID(service_id)

    payload = BookingCreate(
        merchant_id=m_id,
        service_id=s_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        note=note,
    )

    booking = await create_booking_record(db, payload)
    assigned_staff_id = await assign_initial_staff(db, booking.id, s_id, m_id)

    return {
        "booking_id": booking.id,
        "status": booking.status.value,
        "assigned_staff_id": str(assigned_staff_id) if assigned_staff_id else None,
        "customer_name": booking.customer_name,
    }
