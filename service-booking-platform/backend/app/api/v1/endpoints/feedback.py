from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter()


@router.post("", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
async def submit_feedback(payload: FeedbackCreate, db: AsyncSession = Depends(get_db)) -> FeedbackRead:
    """Captures customer interaction feedback (1-5 rating + comments)."""
    booking_id = payload.booking_id.strip() if payload.booking_id and payload.booking_id.strip() else None
    feedback = Feedback(
        merchant_id=payload.merchant_id,
        booking_id=booking_id,
        session_id=payload.session_id,
        rating=payload.rating,
        comment=payload.comment,
        flow_type=payload.flow_type,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackRead.model_validate(feedback)
