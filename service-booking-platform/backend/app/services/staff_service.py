import uuid

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff


# Hashes a plaintext password using bcrypt algorithm
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


# Verifies a plaintext password against a stored bcrypt password hash
def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))


# Authenticates staff member credentials against PostgreSQL records
async def authenticate_staff(db: AsyncSession, email: str, password: str) -> Staff | None:
    stmt = select(Staff).where(Staff.email == email, Staff.is_active.is_(True))
    result = await db.execute(stmt)
    staff = result.scalar_one_or_none()
    if not staff or not verify_password(password, staff.password_hash):
        return None
    return staff
