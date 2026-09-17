
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.catalog import CategoryRead, CategoryWithServicesRead, ServiceRead
from app.services.catalog_service import get_active_categories, get_services_by_category


router = APIRouter()


# Fetches public merchant info and custom agent greeting
@router.get("/info")
async def get_merchant_public_info(
    merchant_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | None]:
    """Returns merchant business name and configured agent greeting for the public chat intro."""
    from app.models.merchant import Merchant
    merchant = await db.get(Merchant, merchant_id)
    if not merchant:
        return {"name": "Service Booking Assistant", "agent_greeting": None}
    return {
        "name": merchant.name,
        "agent_greeting": merchant.agent_greeting,
    }


# Fetches active catalog categories for the requested merchant ID
@router.get("", response_model=list[CategoryRead])
async def list_categories(
    merchant_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryRead]:
    """Returns active categories for a merchant's catalog."""
    return await get_active_categories(db, merchant_id)


# Fetches complete catalog tree (categories with active services) for the merchant
@router.get("/tree", response_model=list[CategoryWithServicesRead])
async def list_catalog_tree(
    merchant_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryWithServicesRead]:
    """Returns active categories with their nested services for inventory visualization."""
    from app.services.catalog_service import get_catalog_tree
    return await get_catalog_tree(db, merchant_id)


# Fetches active services belonging to a specified category ID
@router.get("/{category_id}/services", response_model=list[ServiceRead])
async def list_category_services(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ServiceRead]:
    """Returns active services within a specific category."""
    return await get_services_by_category(db, category_id)


# Semantic / natural language search across catalog services and models
@router.get("/search", response_model=list[ServiceRead])
async def search_catalog_services(
    merchant_id: uuid.UUID = Query(...),
    q: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceRead]:
    """Searches catalog services by query text, brand, model, or price constraint."""
    from app.services.catalog_service import search_services
    return await search_services(db, merchant_id, q)


