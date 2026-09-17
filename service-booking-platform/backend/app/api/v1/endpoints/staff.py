import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff, get_db
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.models.staff import Staff
from app.schemas.staff import StaffDecisionRequest, StaffFinalizeRequest, StaffQueueItemResponse
from app.services.router_service import cascade_staff_rejection

logger = logging.getLogger("app.staff")
router = APIRouter()


@router.get("/bookings", response_model=list[StaffQueueItemResponse])
async def list_assigned_bookings(
    status_filter: BookingStatus | None = None,
    search: str | None = None,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> list[StaffQueueItemResponse]:
    """Retrieves booking queue for the authenticated staff member, including unassigned merchant bookings."""
    logger.info("Fetching queue for staff_id=%s, filter=%s, search=%s", current_staff.id, status_filter, search)
    from sqlalchemy import or_
    stmt = (
        select(Booking, Service.name)
        .join(Service, Booking.service_id == Service.id)
        .where(
            or_(
                Booking.staff_id == current_staff.id,
                Booking.staff_id.is_(None),
                Booking.merchant_id == current_staff.merchant_id,
            )
        )
    )
    if status_filter:
        stmt = stmt.where(Booking.status == status_filter)

    if search:
        search_term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Booking.customer_name.ilike(search_term),
                Booking.customer_phone.ilike(search_term),
                Booking.id.ilike(search_term),
                Service.name.ilike(search_term),
            )
        )
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
                assigned_staff_id=str(booking.staff_id) if booking.staff_id else None,
            )
        )
    logger.info("Retrieved %d queue items for staff_id=%s", len(records), current_staff.id)
    return records


@router.get("/bookings/counts")
async def get_queue_counts(
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Returns dynamic status counts for the staff dashboard badges."""
    from sqlalchemy import or_, case, literal
    base = (
        select(
            func.count().label("total"),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)), 0).label("pending"),
            func.coalesce(func.sum(case((Booking.status == BookingStatus.ACCEPTED, 1), else_=0)), 0).label("accepted"),
            func.coalesce(func.sum(case((Booking.staff_id.is_(None), 1), else_=0)), 0).label("unassigned"),
        )
        .select_from(Booking)
        .where(
            or_(
                Booking.staff_id == current_staff.id,
                Booking.staff_id.is_(None),
                Booking.merchant_id == current_staff.merchant_id,
            )
        )
    )
    row = (await db.execute(base)).one()
    return {
        "total": row.total or 0,
        "pending": row.pending or 0,
        "accepted": row.accepted,
        "unassigned": row.unassigned,
    }


@router.post("/bookings/{booking_id}/claim")
async def claim_unassigned_booking(
    booking_id: str,
    current_staff: Staff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Allows any active merchant specialist to claim an unassigned booking."""
    logger.info("Staff claim: staff_id=%s, booking_id=%s", current_staff.id, booking_id)
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.merchant_id != current_staff.merchant_id:
        raise HTTPException(status_code=403, detail="Booking belongs to a different merchant")
    if booking.staff_id is not None:
        raise HTTPException(status_code=409, detail="Booking is already assigned to a staff member")

    booking.staff_id = current_staff.id
    booking.status = BookingStatus.ACCEPTED
    await db.commit()
    logger.info("Booking %s claimed by staff_id=%s", booking.id, current_staff.id)
    return {"booking_id": booking.id, "status": BookingStatus.ACCEPTED, "claimed_by": str(current_staff.id)}


# Records specialist decision (accept or cascade reject)
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
    if not booking or (booking.merchant_id != current_staff.merchant_id and booking.staff_id != current_staff.id):
        logger.warning("Staff decision rejected: booking_id=%s not accessible to staff_id=%s", booking_id, current_staff.id)
        raise HTTPException(status_code=404, detail="Booking not found in staff queue")

    # If booking was assigned to another staff member belonging to the same merchant, permit reassignment only if pending
    if booking.staff_id and booking.staff_id != current_staff.id and booking.merchant_id != current_staff.merchant_id:
        raise HTTPException(status_code=403, detail="Booking is assigned to a different staff member")

    if payload.action == "accept":
        booking.staff_id = current_staff.id
        booking.status = BookingStatus.ACCEPTED
        await db.commit()
        logger.info("Booking %s accepted by staff_id=%s", booking.id, current_staff.id)
        return {"booking_id": booking.id, "status": BookingStatus.ACCEPTED, "re_routed": False}

    elif payload.action == "reject":
        # If the booking was assigned to current staff, cascade to next available staff; otherwise mark rejected
        if booking.staff_id == current_staff.id:
            re_routed = await cascade_staff_rejection(db, booking, current_staff.id, payload.reason)
        else:
            booking.status = BookingStatus.REJECTED
            booking.rejection_reason = payload.reason
            await db.commit()
            re_routed = False

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


# Completes booking after in-person service delivery
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
    if not booking or (booking.merchant_id != current_staff.merchant_id and booking.staff_id != current_staff.id):
        logger.warning("Finalize failed: booking_id=%s not accessible to staff_id=%s", booking_id, current_staff.id)
        raise HTTPException(status_code=404, detail="Booking not found in staff queue")

    booking.staff_id = current_staff.id
    booking.status = BookingStatus.FINALIZED
    booking.offline_notes = f"Scheduled: {payload.scheduled_date} | Notes: {payload.notes} | PayStatus: {payload.payment_status}"
    await db.commit()

    logger.info("Booking %s successfully finalized by staff_id=%s", booking.id, current_staff.id)
    return {"booking_id": booking.id, "status": BookingStatus.FINALIZED, "finalized_at": booking.updated_at}
