import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    is_active: bool = True


class CategoryRead(BaseModel):
    id: uuid.UUID
    merchant_id: uuid.UUID
    name: str
    description: str | None
    image_url: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryWithServicesRead(CategoryRead):
    services: list["ServiceRead"] = []

    model_config = ConfigDict(from_attributes=True)


class ServiceCreate(BaseModel):

    category_id: uuid.UUID
    name: str
    description: str
    image_url: str
    price_range: str | None = None
    is_active: bool = True


class ServiceRead(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    description: str
    image_url: str
    price_range: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
