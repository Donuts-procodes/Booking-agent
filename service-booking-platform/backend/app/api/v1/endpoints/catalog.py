import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.catalog import CategoryRead, ServiceRead
from app.services.catalog_service import get_active_categories, get_services_by_category

router = APIRouter()


# Fetches active catalog categories for the requested merchant ID
@router.get("", response_model=list[CategoryRead])
async def list_categories(
    merchant_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Returns active categories for a merchant's catalog."""
    return await get_active_categories(db, merchant_id)


# Fetches active services belonging to a specified category ID
@router.get("/{category_id}/services", response_model=list[ServiceRead])
async def list_category_services(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns active services within a specific category."""
    return await get_services_by_category(db, category_id)
