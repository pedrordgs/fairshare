from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, status, HTTPException

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession
from .security import create_access_token, verify_password
from .models import Token, User, UserCreate, UserPublic, UserUpdate
from .service import create_user, get_user_by_email, update_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(*, session: DbSession, user_in: UserCreate) -> User:
    if get_user_by_email(session=session, email=user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists")
    return create_user(session=session, user_in=user_in)


@router.post("/token", response_model=Token)
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


@router.get("/me", response_model=UserPublic)
async def get_authenticated_user_data(*, authenticated_user: AuthenticatedUser) -> User:
    return authenticated_user


@router.patch("/me", response_model=UserPublic)
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
