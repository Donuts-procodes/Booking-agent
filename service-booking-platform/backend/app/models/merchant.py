import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Merchant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "merchants"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Agent LLM configuration
    llm_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    llm_model_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    encrypted_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_greeting: Mapped[str | None] = mapped_column(Text, nullable=True)
