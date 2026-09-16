import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff, get_db
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.models.staff import Staff
from app.schemas.staff import StaffDecisionRequest, StaffFinalizeRequest, StaffQueueItemResponse
from app.services.router_service import cascade_staff_rejection

logger = logging.getLogger("app.staff")
router = APIRouter()


# Retrieves assigned booking queue for the authenticated staff specialist and logs queue size
@router.get("/bookings", response_model=list[StaffQueueItemResponse])
async def list_assigned_bookings(
    status_filter: BookingStatus | None = None,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[StaffQueueItemResponse]:
    """Retrieves real-time assigned reservation queue for the authenticated staff member."""
    logger.info("Fetching queue for staff_id=%s, filter=%s", current_staff.id, status_filter)
    stmt = (
        select(Booking, Service.name)
        .join(Service, Booking.service_id == Service.id)
        .where(Booking.staff_id == current_staff.id)
    )
    if status_filter:
        stmt = stmt.where(Booking.status == status_filter)
    stmt = stmt.order_by(Booking.created_at.desc())

    result = await db.execute(stmt)
    records = []
    for booking, srv_name in result.all():
        records.append(
            StaffQueueItemResponse(
                booking_id=booking.id,
                service_name=srv_name,
                customer_name=booking.customer_name,
                customer_phone=booking.customer_phone,
                customer_email=booking.customer_email,
                note=booking.note,
                status=booking.status,
                created_at=booking.created_at,
            )
        )
    logger.info("Retrieved %d queue items for staff_id=%s", len(records), current_staff.id)
    return records


# Records specialist decision (accept or cascade reject) and logs routing outcome
@router.patch("/bookings/{booking_id}/decision")
async def update_staff_decision(
    booking_id: str,
    payload: StaffDecisionRequest,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Records staff decision (accept/reject). Rejection triggers round-robin cascading."""
    logger.info(
        "Staff decision: staff_id=%s, booking_id=%s, action=%s",
        current_staff.id,
        booking_id,
        payload.action,
    )
    booking = await db.get(Booking, booking_id)
    if not booking or booking.staff_id != current_staff.id:
        logger.warning("Staff decision rejected: booking_id=%s not assigned to staff_id=%s", booking_id, current_staff.id)
        raise HTTPException(status_code=404, detail="Booking not found in staff queue")

    if payload.action == "accept":
        booking.status = BookingStatus.ACCEPTED
        await db.commit()
        logger.info("Booking %s accepted by staff_id=%s", booking.id, current_staff.id)
        return {"booking_id": booking.id, "status": BookingStatus.ACCEPTED, "re_routed": False}

    elif payload.action == "reject":
        re_routed = await cascade_staff_rejection(db, booking, current_staff.id, payload.reason)
        logger.info(
            "Booking %s rejected by staff_id=%s, re_routed=%s, reason=%s",
            booking.id,
            current_staff.id,
            re_routed,
            payload.reason,
        )
        return {
            "booking_id": booking.id,
            "status": booking.status,
            "re_routed": re_routed,
            "message": "Reassigned to alternate staff" if re_routed else "Rejected. Customer notified.",
        }

    raise HTTPException(status_code=400, detail="Invalid action")


# Completes booking after in-person service delivery and logs final billing/notes
@router.patch("/bookings/{booking_id}/finalize")
async def finalize_offline_booking(
    booking_id: str,
    payload: StaffFinalizeRequest,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Finalizes booking after offline formalities (dates, payments, paperwork) are completed."""
    logger.info("Finalizing booking: staff_id=%s, booking_id=%s", current_staff.id, booking_id)
    booking = await db.get(Booking, booking_id)
    if not booking or booking.staff_id != current_staff.id:
        logger.warning("Finalize failed: booking_id=%s not in staff_id=%s queue", booking_id, current_staff.id)
        raise HTTPException(status_code=404, detail="Booking not found in staff queue")

    booking.status = BookingStatus.FINALIZED
    booking.offline_notes = f"Scheduled: {payload.scheduled_date} | Notes: {payload.notes} | PayStatus: {payload.payment_status}"
    await db.commit()
    logger.info("Booking %s successfully finalized by staff_id=%s", booking.id, current_staff.id)
    return {"booking_id": booking.id, "status": BookingStatus.FINALIZED, "finalized_at": booking.updated_at}
