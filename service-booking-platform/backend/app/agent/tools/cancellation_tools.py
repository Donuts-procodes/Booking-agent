from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.booking_service import cancel_booking_record, verify_booking_ownership


# Queries reservation status matching provided booking ID and verified customer phone
async def tool_status_check(db: AsyncSession, booking_id: str, phone: str) -> dict[str, Any]:
    booking = await verify_booking_ownership(db, booking_id=booking_id, phone=phone)
    if not booking:
        return {"found": False, "message": "No matching booking found for provided ID and phone."}
    return {
        "found": True,
        "booking_id": booking.id,
        "status": booking.status.value,
        "customer_name": booking.customer_name,
        "note": booking.note,
    }


# Verifies customer reservation credentials and executes booking cancellation
async def tool_cancel_booking(
    db: AsyncSession,
    booking_id: str,
    phone: str,
    reason: str | None = None,
) -> dict[str, Any]:
    booking = await verify_booking_ownership(db, booking_id=booking_id, phone=phone)
    if not booking:
        return {"success": False, "message": "Verification failed. Cannot cancel booking."}
    updated = await cancel_booking_record(db, booking=booking, reason=reason)
    return {"success": True, "booking_id": updated.id, "status": updated.status.value}
