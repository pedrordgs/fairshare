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
    name: str | None = Field(default=None, min_length=2)


class Token(BaseModel):
    access_token: str
    token_type: str
