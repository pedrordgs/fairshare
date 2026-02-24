import secrets
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
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

OAUTH_STATE_COOKIE = "oauth_state"
OAUTH_REDIRECT_COOKIE = "oauth_redirect"


def _sign_value(value: str, secret_key: str) -> str:
    import hmac
    import hashlib
    import base64

    signature = hmac.new(secret_key.encode(), value.encode(), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{value}.{signed}"


def _verify_signed_value(signed_value: str, secret_key: str) -> str | None:
    import hmac
    import hashlib
    import base64

    try:
        value, signature_b64 = signed_value.rsplit(".", 1)
        signature_b64 = signature_b64 + "=" * (4 - len(signature_b64) % 4)
        signature = base64.urlsafe_b64decode(signature_b64)
        expected_sig = hmac.new(secret_key.encode(), value.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        return value
    except Exception:
        return None


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
async def google_login(redirect: str | None = None) -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

    state = secrets.token_urlsafe(32)
    signed_state = _sign_value(state, settings.secret_key)

    response = RedirectResponse(url=get_google_oauth_url(state=state))
    response.set_cookie(
        key=OAUTH_STATE_COOKIE, value=signed_state, httponly=True, secure=True, samesite="lax", max_age=600
    )

    if redirect:
        signed_redirect = _sign_value(redirect, settings.secret_key)
        response.set_cookie(
            key=OAUTH_REDIRECT_COOKIE, value=signed_redirect, httponly=True, secure=True, samesite="lax", max_age=600
        )

    return response


@router.get("/google/callback")
async def google_callback(
    *,
    session: DbSession,
    code: str,
    state: str | None = None,
    oauth_state: str | None = Cookie(None, alias=OAUTH_STATE_COOKIE),
    oauth_redirect: str | None = Cookie(None, alias=OAUTH_REDIRECT_COOKIE),
) -> RedirectResponse:
    settings = get_settings()

    if not oauth_state or not state:
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?error=state_missing")

    verified_state = _verify_signed_value(oauth_state, settings.secret_key)
    if not verified_state or verified_state != state:
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?error=state_invalid")

    redirect_url = None
    if oauth_redirect:
        redirect_url = _verify_signed_value(oauth_redirect, settings.secret_key)

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
        callback_url = f"{settings.frontend_url}/auth/callback?token={access_token}"
        if redirect_url:
            callback_url += f"&redirect={redirect_url}"
        response = RedirectResponse(url=callback_url)
        response.delete_cookie(OAUTH_STATE_COOKIE)
        response.delete_cookie(OAUTH_REDIRECT_COOKIE)
        return response
    except Exception:
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?error=authentication_failed")
