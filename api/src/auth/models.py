from pydantic import EmailStr, BaseModel
from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    name: str
    email: EmailStr = Field(unique=True, index=True)


class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str = Field()


class UserCreate(UserBase):
    password: str


class UserPublic(UserBase):
    id: int


class UserUpdate(SQLModel):
    name: str | None = None
    email: EmailStr | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
