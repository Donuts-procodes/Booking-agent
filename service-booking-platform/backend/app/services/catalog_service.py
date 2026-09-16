import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.category import Category
from app.models.service import Service
from app.schemas.catalog import CategoryRead, ServiceRead


# Retrieves all active service categories belonging to a specific merchant
async def get_active_categories(db: AsyncSession, merchant_id: uuid.UUID) -> list[CategoryRead]:
    stmt = select(Category).where(Category.merchant_id == merchant_id, Category.is_active.is_(True))
    result = await db.execute(stmt)
    return [CategoryRead.model_validate(cat) for cat in result.scalars().all()]


# Retrieves all active services belonging to a specific category
async def get_services_by_category(db: AsyncSession, category_id: uuid.UUID) -> list[ServiceRead]:
    stmt = select(Service).where(Service.category_id == category_id, Service.is_active.is_(True))
    result = await db.execute(stmt)
    return [ServiceRead.model_validate(srv) for srv in result.scalars().all()]
