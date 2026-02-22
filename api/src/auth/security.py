from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from auth.models import User
from core.conf import get_settings

password_hash = PasswordHash.recommended()


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    if hashed_password is None:
        return False
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(user: User) -> str:
    settings = get_settings()
    token_payload = {
        "sub": str(user.id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(token_payload, settings.secret_key, algorithm=settings.access_token_hashing_algorithm)
