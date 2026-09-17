import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload

from app.models.booking import Booking, BookingStatus
from app.models.category import Category
from app.models.service import Service
from app.schemas.catalog import CategoryRead, CategoryWithServicesRead, ServiceRead


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


# Retrieves entire active category hierarchy with nested services for merchant catalog visualization
async def get_catalog_tree(db: AsyncSession, merchant_id: uuid.UUID) -> list[CategoryWithServicesRead]:
    stmt = (
        select(Category)
        .options(selectinload(Category.services))
        .where(Category.merchant_id == merchant_id, Category.is_active.is_(True))
        .order_by(Category.created_at.desc())
    )
    result = await db.execute(stmt)
    categories = result.scalars().all()
    return [CategoryWithServicesRead.model_validate(c) for c in categories]


# Searches services by keyword, category/brand name, and budget filters (e.g. 'under 6 lac')
async def search_services(db: AsyncSession, merchant_id: uuid.UUID, query: str) -> list[ServiceRead]:
    import re
    q_clean = query.strip().lower()

    # Extract potential budget limit (e.g. "under 6 lac", "below 10 lakh", "under 600000", "< 600000")
    max_price = None
    lac_match = re.search(r"(?:under|below|less than|<|within)?\s*(\d+(?:\.\d+)?)\s*(?:lac|lakh|lakhs)", q_clean)
    if lac_match:
        try:
            max_price = float(lac_match.group(1)) * 100000
        except ValueError:
            pass
    else:
        num_match = re.search(r"(?:under|below|<)\s*(?:rs\.?|inr|₹)?\s*(\d{5,8})", q_clean)
        if num_match:
            try:
                max_price = float(num_match.group(1))
            except ValueError:
                pass

    # Query all active services for this merchant
    stmt = (
        select(Service)
        .join(Category, Service.category_id == Category.id)
        .where(Category.merchant_id == merchant_id, Category.is_active.is_(True), Service.is_active.is_(True))
    )
    result = await db.execute(stmt)
    services = result.scalars().all()

    # Helper to parse numeric value from price_range string
    def parse_price(val: str | None) -> float | None:
        if not val:
            return None
        cleaned = re.sub(r"[^\d.]", "", val)
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None

    matched: list[Service] = []

    # If max price filter applies
    if max_price is not None:
        for s in services:
            p = parse_price(s.price_range)
            if p is not None and p <= max_price:
                matched.append(s)

    # If query mentions specific keywords or brands
    keywords = [w for w in re.findall(r"\w+", q_clean) if len(w) > 2 and w not in {"want", "look", "looking", "some", "cars", "car", "under", "below", "show", "need", "find", "best", "give", "have", "with", "from", "service", "services", "book", "appointment"}]
    if keywords:
        for s in services:
            target_text = f"{s.name} {s.description}".lower()
            if any(kw in target_text for kw in keywords) and s not in matched:
                matched.append(s)

    # Only return top active services if user query was purely general with NO specific filter or keywords
    if not matched and not keywords and max_price is None:
        matched = list(services[:6])


    return [ServiceRead.model_validate(s) for s in matched]


