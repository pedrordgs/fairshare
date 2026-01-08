from jwt import InvalidTokenError
import jwt
from fastapi import Depends, HTTPException, status
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer

from auth.service import get_user_by_id
from core.conf import settings
from core.dependencies import DbSession

from .models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_authenticated_user(session: DbSession, token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.access_token_hashing_algorithm])
    except InvalidTokenError:
        raise credentials_exception
    if not (user_id := payload.get("sub")) or not (user := get_user_by_id(session=session, user_id=int(user_id))):
        raise credentials_exception
    return user


AuthenticatedUser = Annotated[User, Depends(get_authenticated_user)]
