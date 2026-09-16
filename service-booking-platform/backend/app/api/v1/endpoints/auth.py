from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import create_staff_token
from app.schemas.staff import StaffLoginRequest, StaffLoginResponse
from app.services.staff_service import authenticate_staff

router = APIRouter()


# Authenticates staff member credentials and returns an 8-hour session JWT
@router.post("/staff/login", response_model=StaffLoginResponse)
async def staff_login(payload: StaffLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticates staff credentials and returns a session JWT."""
    staff = await authenticate_staff(db, payload.email, payload.password)
    if not staff:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_staff_token(str(staff.id))
    return StaffLoginResponse(access_token=token, staff_name=staff.name)
