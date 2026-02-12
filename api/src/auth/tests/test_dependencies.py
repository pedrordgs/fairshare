import jwt
import pytest
from fastapi import HTTPException
from sqlmodel import Session

from auth.dependencies import get_authenticated_user
from auth.models import User, UserCreate
from auth.security import create_access_token
from auth.service import create_user
from core.conf import get_settings


class TestGetAuthenticatedUser:
    @pytest.mark.asyncio
    async def test_returns_user_with_valid_token(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="test@example.com", password="password123")
        )
        token = create_access_token(user)
        result = await get_authenticated_user(session=session, token=token)
        assert result.id == user.id
        assert result.name == user.name
        assert result.email == user.email

    @pytest.mark.asyncio
    async def test_raises_401_with_invalid_token(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token="invalid_token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"

    @pytest.mark.asyncio
    async def test_raises_401_with_wrong_secret(self, session: Session) -> None:
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="hashed")
        settings = get_settings()
        token = jwt.encode({"sub": str(user.id)}, "wrong-secret", algorithm=settings.access_token_hashing_algorithm)
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token=token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"

    @pytest.mark.asyncio
    async def test_raises_401_with_nonexistent_user(self, session: Session) -> None:
        settings = get_settings()
        token = jwt.encode({"sub": "999"}, settings.secret_key, algorithm=settings.access_token_hashing_algorithm)
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token=token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"

    @pytest.mark.asyncio
    async def test_raises_401_with_missing_sub_claim(self, session: Session) -> None:
        settings = get_settings()
        token = jwt.encode({"foo": "bar"}, settings.secret_key, algorithm=settings.access_token_hashing_algorithm)
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token=token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"

    @pytest.mark.asyncio
    async def test_raises_401_with_empty_sub_claim(self, session: Session) -> None:
        settings = get_settings()
        token = jwt.encode({"sub": ""}, settings.secret_key, algorithm=settings.access_token_hashing_algorithm)
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token=token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"

    @pytest.mark.asyncio
    async def test_raises_401_with_expired_token(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="test@example.com", password="password123")
        )
        settings = get_settings()
        token = jwt.encode(
            {"sub": str(user.id), "exp": 0}, settings.secret_key, algorithm=settings.access_token_hashing_algorithm
        )
        with pytest.raises(HTTPException) as exc_info:
            await get_authenticated_user(session=session, token=token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid credentials"
