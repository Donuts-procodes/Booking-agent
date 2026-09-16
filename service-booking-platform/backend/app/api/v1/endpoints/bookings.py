import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import create_cancellation_token, verify_cancellation_token
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    CancelExecutionRequest,
    StatusCheckRequest,
    StatusCheckResponse,
    VerifyCancellationRequest,
    VerifyCancellationResponse,
)
from app.services.booking_service import create_booking_record, get_verified_booking
from app.services.router_service import assign_staff_round_robin

logger = logging.getLogger("app.bookings")
router = APIRouter()


# Creates a new customer booking, assigns specialist via router, and logs the created reservation ID
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, db: AsyncSession = Depends(get_db)):
    """Creates a booking record with status 'pending' and routes to assigned staff."""
    logger.info("Initiating booking creation: merchant=%s, service=%s", payload.merchant_id, payload.service_id)
    service = await db.get(Service, payload.service_id)
    if not service or not service.is_active:
        logger.warning("Booking failed: service=%s not found or inactive", payload.service_id)
        raise HTTPException(status_code=404, detail="Service not found or currently inactive")

    assigned_staff_id = await assign_staff_round_robin(db, service.id)
    booking = await create_booking_record(db=db, service=service, assigned_staff_id=assigned_staff_id, payload=payload)
    logger.info(
        "Booking created: booking_id=%s, customer=%s, assigned_staff=%s",
        booking.id,
        booking.customer_name,
        booking.staff_id,
    )

    return BookingResponse(
        booking_id=booking.id,
        status=booking.status,
        assigned_staff_id=booking.staff_id,
        created_at=booking.created_at,
    )


# Checks booking status by verified customer phone and logs status query
@router.post("/status-check", response_model=StatusCheckResponse)
async def check_booking_status(payload: StatusCheckRequest, db: AsyncSession = Depends(get_db)):
    """Verifies phone number against the booking ID and returns the real-time status."""
    logger.info("Status check requested for booking_id=%s", payload.booking_id)
    stmt = (
        select(Booking, Service.name)
        .join(Service, Booking.service_id == Service.id)
        .where(Booking.id == payload.booking_id, Booking.customer_phone == payload.phone)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        logger.warning("Status check failed: booking_id=%s not found or phone mismatch", payload.booking_id)
        raise HTTPException(status_code=404, detail="Booking ID not found or details mismatch")

    booking, service_name = row
    logger.info("Status check succeeded for booking_id=%s, status=%s", booking.id, booking.status)
    return StatusCheckResponse(
        booking_id=booking.id,
        status=booking.status,
        service_name=service_name,
        created_at=booking.created_at,
    )


# Validates booking ownership, verifies eligibility, issues 15-minute token, and logs verification attempt
@router.post("/verify", response_model=VerifyCancellationResponse)
async def verify_cancellation_eligibility(payload: VerifyCancellationRequest, db: AsyncSession = Depends(get_db)):
    """Validates booking ownership and terminal status for cancellations."""
    logger.info("Cancellation verification requested for booking_id=%s", payload.booking_id)
    booking = await get_verified_booking(db, payload.booking_id, payload.phone_or_name)
    if not booking:
        logger.warning("Cancellation verify failed: booking_id=%s unauthorized", payload.booking_id)
        raise HTTPException(status_code=404, detail="Reservation not found or unauthorized")

    if booking.status == BookingStatus.CANCELLED:
        logger.info("Booking %s already cancelled", booking.id)
        return VerifyCancellationResponse(
            is_valid=True,
            cancellation_eligible=False,
            reason="ALREADY_CANCELLED",
            message="This reservation is already cancelled.",
        )

    if booking.status == BookingStatus.FINALIZED:
        logger.info("Booking %s is finalized; cancellation locked", booking.id)
        return VerifyCancellationResponse(
            is_valid=True,
            cancellation_eligible=False,
            reason="ALREADY_FINALIZED",
            message="Booking is finalized/paid. Self-cancellation locked. Please contact staff directly.",
        )

    token = create_cancellation_token(booking.id, booking.customer_phone)
    service = await db.get(Service, booking.service_id)
    logger.info("Cancellation token issued for booking_id=%s", booking.id)
    return VerifyCancellationResponse(
        is_valid=True,
        cancellation_eligible=True,
        booking_id=booking.id,
        service_name=service.name if service else "Unknown Service",
        customer_name=booking.customer_name,
        verification_token=token,
    )


# Validates ephemeral cancellation token and marks booking as cancelled in PostgreSQL
@router.post("/{booking_id}/cancel", status_code=status.HTTP_200_OK)
async def execute_cancellation(
    booking_id: str,
    payload: CancelExecutionRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Cancels the reservation upon explicit user confirmation."""
    logger.info("Executing cancellation for booking_id=%s", booking_id)
    token = authorization.replace("Bearer ", "").strip()
    if not verify_cancellation_token(token, booking_id):
        logger.warning("Cancellation rejected: invalid or expired token for booking_id=%s", booking_id)
        raise HTTPException(status_code=401, detail="Invalid or expired verification session")

    booking = await db.get(Booking, booking_id)
    if not booking or booking.status not in (BookingStatus.PENDING, BookingStatus.ACCEPTED):
        logger.warning("Cancellation invalid state: booking_id=%s status=%s", booking_id, booking.status if booking else None)
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled in its current state")

    booking.status = BookingStatus.CANCELLED
    booking.rejection_reason = payload.cancellation_reason
    await db.commit()
    logger.info("Booking successfully cancelled: booking_id=%s, reason=%s", booking_id, payload.cancellation_reason)
    return {"booking_id": booking.id, "status": BookingStatus.CANCELLED, "message": "Successfully cancelled"}
