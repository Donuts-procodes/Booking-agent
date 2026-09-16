import base64
import os
from datetime import datetime, timedelta, timezone

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt

from app.core.config import settings


# Derives deterministic 32-byte binary key from AES settings for authenticated AES-256-GCM cipher operations
def _get_aes_key() -> bytes:
    return settings.AES_KEY.encode()[:32].ljust(32, b"0")


# Encrypts plaintext external LLM API keys using AES-256-GCM authenticated cipher prior to database storage
def encrypt_secret(plain_text: str) -> str:
    """Encrypts external API keys using AES-256-GCM prior to PostgreSQL insertion."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    encrypted = aesgcm.encrypt(nonce, plain_text.encode(), None)
    return base64.b64encode(nonce + encrypted).decode()


# Decrypts AES-256-GCM cipher payload into original plaintext credentials for dynamic BYOK provider client instantiation
def decrypt_secret(cipher_text: str) -> str:
    """Decrypts AES-256-GCM cipher string into plaintext API key."""
    key = _get_aes_key()
    raw_data = base64.b64decode(cipher_text.encode())
    nonce = raw_data[:12]
    encrypted_payload = raw_data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, encrypted_payload, None).decode()


# Issues short-lived (15 min) signed JWT token authorizing customer to cancel a validated booking reservation
def create_cancellation_token(booking_id: str, phone: str) -> str:
    """Issues an ephemeral 15-minute JWT for cancellation verification."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode = {
        "sub": booking_id,
        "phone": phone,
        "scope": "booking:cancellation",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# Validates that a cancellation request bearer token matches the expected booking ID and has not expired
def verify_cancellation_token(token: str, expected_booking_id: str) -> bool:
    """Validates an ephemeral JWT token against the target Booking ID."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("sub") != expected_booking_id or payload.get("scope") != "booking:cancellation":
            return False
        return True
    except JWTError:
        return False


# Issues an 8-hour authenticated session JWT bearer token upon valid staff credentials login
def create_staff_token(staff_id: str) -> str:
    """Issues a JWT for authenticated staff sessions."""
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    to_encode = {
        "sub": staff_id,
        "scope": "staff:session",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# Decodes staff JWT session token, verifies scope and signature, returning authenticated staff UUID
def verify_staff_token(token: str) -> str | None:
    """Validates staff session JWT and returns staff_id or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("scope") != "staff:session":
            return None
        return payload.get("sub")
    except JWTError:
        return None
