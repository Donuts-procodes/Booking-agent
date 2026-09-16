import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.catalog_service import get_active_categories, get_services_by_category


# Queries list of active service categories for customer discovery
async def tool_get_categories(db: AsyncSession, merchant_id: str) -> list[dict[str, Any]]:
    m_id = uuid.UUID(merchant_id)
    categories = await get_active_categories(db, m_id)
    return [{"id": str(c.id), "name": c.name, "description": c.description} for c in categories]


# Queries list of active services belonging to requested category ID
async def tool_get_services(db: AsyncSession, category_id: str) -> list[dict[str, Any]]:
    c_id = uuid.UUID(category_id)
    services = await get_services_by_category(db, c_id)
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "description": s.description,
            "price_range": s.price_range,
        }
        for s in services
    ]
