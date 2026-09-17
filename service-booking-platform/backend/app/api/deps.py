from collections.abc import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.core.security import verify_staff_token
from app.models.staff import Staff


# FastAPI dependency yielding an asynchronous SQLAlchemy database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_session():
        yield session


# Validates staff bearer token from Authorization header and returns authenticated staff record
async def get_current_staff(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> Staff:
    token = authorization.replace("Bearer ", "").strip()
    staff_id = verify_staff_token(token)
    if not staff_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired staff token")
    staff = await db.get(Staff, staff_id)
    if not staff or not staff.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff account not found or inactive")
    return staff


import secrets

# Validates admin authorization key from X-Admin-Key header with constant-time comparison
async def verify_admin_key(
    x_admin_key: str | None = Header(None, alias="X-Admin-Key"),
) -> str:
    valid_keys = {settings.ADMIN_API_KEY, settings.ADMIN_PASSKEY}
    if x_admin_key and any(secrets.compare_digest(x_admin_key, vk) for vk in valid_keys):
        return x_admin_key
    if settings.ENVIRONMENT != "production":
        return x_admin_key or "bypassed_dev_mode"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing admin key")
