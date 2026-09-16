import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.service_staff import ServiceStaff
from app.models.staff import Staff


# Selects the active staff member with the lowest load assigned to a service and increments load counter
async def assign_staff_round_robin(db: AsyncSession, service_id: uuid.UUID) -> uuid.UUID | None:
    """Assigns a staff member to a booking using round-robin on least-loaded active staff.

    Returns the assigned staff ID, or None if no staff are assigned to this service.
    """
    stmt = (
        select(Staff)
        .join(ServiceStaff, ServiceStaff.staff_id == Staff.id)
        .where(ServiceStaff.service_id == service_id, Staff.is_active.is_(True))
        .order_by(Staff.current_load.asc())
    )
    result = await db.execute(stmt)
    staff = result.scalars().first()

    if not staff:
        return None

    staff.current_load += 1
    await db.flush()
    return staff.id


# Cascades a rejected booking to the next available specialist, or marks it unassigned if pool is exhausted
async def cascade_staff_rejection(
    db: AsyncSession,
    booking: Booking,
    rejecting_staff_id: uuid.UUID,
    reason: str | None,
) -> bool:
    """Attempts to reassign a rejected booking to the next eligible staff member.

    Returns True if reassigned, False if the pool is exhausted.
    """
    stmt = (
        select(Staff)
        .join(ServiceStaff, ServiceStaff.staff_id == Staff.id)
        .where(
            ServiceStaff.service_id == booking.service_id,
            Staff.is_active.is_(True),
            Staff.id != rejecting_staff_id,
        )
        .order_by(Staff.current_load.asc())
    )
    result = await db.execute(stmt)
    next_staff = result.scalars().first()

    if next_staff:
        booking.staff_id = next_staff.id
        booking.status = BookingStatus.PENDING
        next_staff.current_load += 1
        await db.commit()
        return True

    booking.staff_id = None
    booking.status = BookingStatus.REJECTED
    booking.rejection_reason = reason
    await db.commit()
    return False


# Convenience wrapper assigning the first qualified staff member upon initial booking creation
async def assign_initial_staff(
    db: AsyncSession,
    booking_id: str,
    service_id: uuid.UUID,
    merchant_id: uuid.UUID,
) -> uuid.UUID | None:
    """Convenience wrapper for initial assignment on booking creation."""
    return await assign_staff_round_robin(db, service_id)
