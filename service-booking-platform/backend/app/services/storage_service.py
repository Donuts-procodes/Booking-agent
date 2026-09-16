import uuid

import boto3
from botocore.config import Config as BotoConfig

from app.core.config import settings


class StorageService:
    """AWS S3 / MinIO storage client for catalog media and document management."""

    # Initializes S3/MinIO client using environment configuration
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.AWS_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=BotoConfig(signature_version="s3v4"),
        )
        self._bucket = settings.S3_BUCKET_NAME

    # Uploads service image bytes to MinIO/S3 bucket and returns public/endpoint URL
    def upload_service_image(self, merchant_id: uuid.UUID, file_bytes: bytes, content_type: str = "image/webp") -> str:
        """Uploads a service image and returns the deterministic S3 key."""
        object_key = f"merchants/{merchant_id}/services/{uuid.uuid4()}.webp"
        self._client.put_object(
            Bucket=self._bucket,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return self._build_url(object_key)

    # Uploads business knowledge document bytes (PDF/DOCX/TXT) to MinIO/S3 bucket
    def upload_knowledge_doc(self, merchant_id: uuid.UUID, file_bytes: bytes, filename: str) -> str:
        """Uploads a raw knowledge document (PDF/DOCX) and returns the S3 URL."""
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        object_key = f"merchants/{merchant_id}/knowledge/{uuid.uuid4()}.{ext}"
        self._client.put_object(
            Bucket=self._bucket,
            Key=object_key,
            Body=file_bytes,
        )
        return self._build_url(object_key)

    # Constructs public or endpoint URL for stored object key
    def _build_url(self, key: str) -> str:
        if settings.AWS_ENDPOINT_URL:
            return f"{settings.AWS_ENDPOINT_URL}/{self._bucket}/{key}"
        return f"https://{self._bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"


storage_service = StorageService()
