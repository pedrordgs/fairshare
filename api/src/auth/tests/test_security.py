from unittest.mock import patch

import jwt
import pytest

from auth.models import User
from auth.security import create_access_token, get_password_hash, verify_password
from core.conf import settings


class TestVerifyPassword:
    def test_correct_password(self) -> None:
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_incorrect_password(self) -> None:
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        assert verify_password("wrongpassword", hashed) is False

    def test_empty_password(self) -> None:
        password = ""
        hashed = get_password_hash(password)
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


class TestGetPasswordHash:
    def test_returns_hashed_string(self) -> None:
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        assert isinstance(hashed, str)
        assert hashed != password

    def test_different_hashes_for_same_password(self) -> None:
        password = "mysecretpassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        # Argon2 uses random salts, so hashes should differ
        assert hash1 != hash2


class TestCreateAccessToken:
    def test_returns_valid_jwt(self) -> None:
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="hashed")
        token = create_access_token(user)
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.access_token_hashing_algorithm])
        assert decoded["sub"] == "1"
        assert "exp" in decoded

    def test_token_contains_user_id_as_subject(self) -> None:
        user = User(id=42, name="Test User", email="test@example.com", hashed_password="hashed")
        token = create_access_token(user)
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.access_token_hashing_algorithm])
        assert decoded["sub"] == "42"

    def test_token_expiration(self) -> None:
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="hashed")
        token = create_access_token(user)
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.access_token_hashing_algorithm])
        assert "exp" in decoded

    @patch.object(settings, "access_token_expire_minutes", -1)
    def test_expired_token_raises_error(self) -> None:
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="hashed")
        token = create_access_token(user)
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, settings.secret_key, algorithms=[settings.access_token_hashing_algorithm])

    def test_invalid_secret_raises_error(self) -> None:
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="hashed")
        token = create_access_token(user)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong-secret-key", algorithms=[settings.access_token_hashing_algorithm])
