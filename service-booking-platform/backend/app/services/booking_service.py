import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.schemas.booking import BookingCreate
from app.utils.id_generator import generate_booking_id


# Creates a new pending booking record in PostgreSQL with a collision-resistant #BK reference number
async def create_booking_record(
    db: AsyncSession,
    service: Service,
    assigned_staff_id: uuid.UUID | None,
    payload: BookingCreate,
) -> Booking:
    booking_id = generate_booking_id()

    booking = Booking(
        id=booking_id,
        merchant_id=payload.merchant_id,
        service_id=payload.service_id,
        staff_id=assigned_staff_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        note=payload.note,
        channel=payload.channel,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


# Verifies zero-trust booking ownership by matching booking ID with either customer phone or registered name
async def get_verified_booking(
    db: AsyncSession,
    booking_id: str,
    phone_or_name: str,
) -> Booking | None:
    """Verifies booking ownership by matching phone number or customer name."""
    stmt = select(Booking).where(
        Booking.id == booking_id,
        or_(
            Booking.customer_phone == phone_or_name,
            Booking.customer_name == phone_or_name,
        ),
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
