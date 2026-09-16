import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.category import Category
from app.models.service import Service
from app.models.staff import Staff
from app.schemas.catalog import CategoryCreate, CategoryRead, ServiceCreate, ServiceRead
from app.services.staff_service import hash_password
from app.services.storage_service import storage_service
from app.utils.excel_parser import validate_and_parse_catalog

logger = logging.getLogger("app.admin")
router = APIRouter()


# Processes uploaded catalog spreadsheet, creates categories and services, and logs summary counts
@router.post("/catalog/upload", status_code=status.HTTP_201_CREATED)
async def upload_catalog(
    merchant_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | int]:
    """Processes and ingests a tabular catalog file with validation."""
    if not file.filename:
        logger.warning("Upload catalog rejected: No filename provided")
        raise HTTPException(status_code=422, detail="No file provided")

    logger.info("Starting catalog upload for merchant=%s, filename=%s", merchant_id, file.filename)
    file_bytes = await file.read()
    try:
        records = validate_and_parse_catalog(file_bytes, file.filename)
    except ValueError as e:
        logger.error("Catalog parse failure for merchant=%s: %s", merchant_id, str(e))
        raise HTTPException(status_code=422, detail=str(e))

    m_id = uuid.UUID(merchant_id)
    created_services = 0
    category_cache: dict[str, Category] = {}

    for record in records:
        cat_name = record.get("category", "General")
        if cat_name not in category_cache:
            category = Category(
                merchant_id=m_id,
                name=cat_name,
                description=f"Auto-created category: {cat_name}",
                is_active=True,
            )
            db.add(category)
            await db.flush()
            category_cache[cat_name] = category

        category = category_cache[cat_name]
        service = Service(
            category_id=category.id,
            name=record["name"],
            description=record.get("description", ""),
            image_url=record.get("image_url", ""),
            price_range=record.get("price_range"),
            is_active=True,
        )
        db.add(service)
        created_services += 1

    await db.commit()
    logger.info(
        "Successfully imported catalog: merchant=%s, services=%d, categories=%d",
        merchant_id,
        created_services,
        len(category_cache),
    )
    return {
        "message": f"Imported {created_services} services across {len(category_cache)} categories",
        "categories_created": len(category_cache),
        "services_created": created_services,
    }


# Stores merchant policy documents in S3 and logs storage URI
@router.post("/knowledge-docs", status_code=status.HTTP_201_CREATED)
async def upload_knowledge_doc(
    merchant_id: str,
    file: UploadFile = File(...),
) -> dict[str, str]:
    """Uploads a knowledge document (PDF/DOCX) to S3 for RAG indexing."""
    if not file.filename:
        logger.warning("Knowledge doc upload rejected: No filename provided")
        raise HTTPException(status_code=422, detail="No file provided")

    logger.info("Uploading knowledge doc for merchant=%s, filename=%s", merchant_id, file.filename)
    file_bytes = await file.read()
    m_id = uuid.UUID(merchant_id)
    url = storage_service.upload_knowledge_doc(m_id, file_bytes, file.filename)
    logger.info("Knowledge doc uploaded to S3: merchant=%s, url=%s", merchant_id, url)
    return {"message": "Knowledge document uploaded", "url": url}


# Creates staff specialist credentials, hashes passwords, and logs provisioning audit trail
@router.post("/staff", status_code=status.HTTP_201_CREATED)
async def create_staff(
    merchant_id: str,
    name: str,
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Provisions a new staff member for the merchant."""
    clean_email = email.strip().lower()
    logger.info("Provisioning staff member: merchant=%s, email=%s, name=%s", merchant_id, clean_email, name)
    
    # Check if staff with this email already exists
    existing = await db.execute(select(Staff).where(Staff.email == clean_email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Staff account with email '{clean_email}' already exists.",
        )

    m_id = uuid.UUID(merchant_id)
    staff = Staff(
        merchant_id=m_id,
        name=name.strip(),
        email=clean_email,
        password_hash=hash_password(password),
        is_active=True,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    logger.info("Staff member created successfully: staff_id=%s, email=%s", staff.id, staff.email)
    return {"staff_id": str(staff.id), "name": staff.name, "email": staff.email}
