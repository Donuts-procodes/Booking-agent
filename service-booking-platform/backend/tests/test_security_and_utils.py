import pytest
from app.utils.id_generator import generate_booking_id
from app.core.security import (
    encrypt_secret,
    decrypt_secret,
    create_cancellation_token,
    verify_cancellation_token,
    create_staff_token,
    verify_staff_token,
)


def test_booking_id_generation():
    bid1 = generate_booking_id()
    bid2 = generate_booking_id()
    assert bid1.startswith("#BK")
    assert bid2.startswith("#BK")
    assert bid1 != bid2
    assert len(bid1) >= 7


def test_secret_encryption_roundtrip():
    secret = "sk-ant-api03-my-test-secret-key"
    encrypted = encrypt_secret(secret)
    assert encrypted != secret
    assert len(encrypted) > len(secret)
    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret


def test_cancellation_token_roundtrip():
    booking_id = "#BK9999"
    phone = "+15550199"
    token = create_cancellation_token(booking_id, phone)
    assert isinstance(token, str)
    assert verify_cancellation_token(token, booking_id) is True
    assert verify_cancellation_token(token, "#BK0000") is False


def test_cancellation_token_invalid():
    assert verify_cancellation_token("invalid.token.here", "#BK9999") is False


def test_staff_token_roundtrip():
    staff_id = "test-staff-uuid-1234"
    token = create_staff_token(staff_id)
    assert isinstance(token, str)
    assert verify_staff_token(token) == staff_id
    assert verify_staff_token("bad.token") is None
