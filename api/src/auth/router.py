from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm

from auth.dependencies import AuthenticatedUser
from core.conf import get_settings
from db.dependencies import DbSession

from .google import exchange_code_for_tokens, get_google_oauth_url, get_google_user_info
from .models import Token, User, UserCreate, UserPublic, UserUpdate
from .security import create_access_token, verify_password
from .service import create_user, get_or_create_user_by_google, get_user_by_email, update_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(*, session: DbSession, user_in: UserCreate) -> User:
    if get_user_by_email(session=session, email=user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists")
    return create_user(session=session, user_in=user_in)


@router.post("/token/", response_model=Token)
async def login(*, session: DbSession, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = get_user_by_email(session=session, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user=user)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me/", response_model=UserPublic)
async def get_authenticated_user_data(*, authenticated_user: AuthenticatedUser) -> User:
    return authenticated_user


@router.patch("/me/", response_model=UserPublic)
def update_authenticated_user(
    *, session: DbSession, authenticated_user: AuthenticatedUser, user_in: UserUpdate
) -> User:
    if (
        user_in.email
        and (user := get_user_by_email(session=session, email=user_in.email))
        and user.id != authenticated_user.id
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists")
    return update_user(session=session, user=authenticated_user, user_in=user_in)


@router.get("/google/")
async def google_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")
    oauth_url = get_google_oauth_url(state="placeholder")
    return RedirectResponse(url=oauth_url)


@router.get("/google/callback")
async def google_callback(*, session: DbSession, code: str) -> RedirectResponse:
    settings = get_settings()
    try:
        token_data = await exchange_code_for_tokens(code)
        user_info = await get_google_user_info(token_data["access_token"])
        user = get_or_create_user_by_google(
            session=session,
            google_id=user_info["id"],
            email=user_info["email"],
            name=user_info.get("name", user_info["email"]),
        )
        access_token = create_access_token(user=user)
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={access_token}")
    except Exception:
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?error=authentication_failed")
