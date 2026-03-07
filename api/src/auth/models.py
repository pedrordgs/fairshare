from pydantic import BaseModel, EmailStr, field_validator
from sqlmodel import Field, SQLModel

from .utils import validate_password_strength


class UserBase(SQLModel):
    name: str
    email: EmailStr = Field(unique=True, index=True)


class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        return validate_password_strength(password)


class UserPublic(UserBase):
    id: int


class UserUpdate(SQLModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, password: str | None) -> str | None:
        if password is None:
            return None
        return validate_password_strength(password)


class Token(BaseModel):
    access_token: str
    token_type: str
