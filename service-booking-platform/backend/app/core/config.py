from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Universal Service Booking Assistant"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database & Cache
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@postgres:5432/booking_db"
    )
    REDIS_URL: str = "redis://redis:6379/0"

    # Milvus Vector Engine
    MILVUS_HOST: str = "milvus"
    MILVUS_PORT: str = "19530"

    # AWS S3 / MinIO Storage
    AWS_ENDPOINT_URL: str | None = "http://minio:9000"
    AWS_ACCESS_KEY_ID: str = "minioadmin"
    AWS_SECRET_ACCESS_KEY: str = "minioadmin"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "catalog-media"

    # Cryptography & Ephemeral Tokens
    SECRET_KEY: str = Field(default="production-insecure-change-key-min-32-chars-long")
    AES_KEY: str = Field(default="16_32_byte_aes_gcm_encryption_key")
    ADMIN_API_KEY: str = Field(default="admin-secret-omnibook-2026")
    ADMIN_PASSKEY: str = Field(default="admin-secret-omnibook-2026")
    MASTER_MERCHANT_ID: str = Field(default="00000000-0000-0000-0000-000000000001")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 15

    # CORS Origins
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {"case_sensitive": True, "env_file": ".env"}


settings = Settings()
