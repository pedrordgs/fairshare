from pydantic import EmailStr
from sqlmodel import Session, select

from .models import User, UserCreate, UserUpdate
from .security import get_password_hash


def get_user_by_id(*, session: Session, user_id: int) -> User | None:
    return session.get(User, user_id)


def get_user_by_email(*, session: Session, email: EmailStr) -> User | None:
    return session.exec(select(User).where(User.email == email)).one_or_none()


def create_user(*, session: Session, user_in: UserCreate) -> User:
    db_user = User.model_validate(user_in, update={"hashed_password": get_password_hash(user_in.password)})
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def update_user(*, session: Session, user: User, user_in: UserUpdate) -> User:
    user.sqlmodel_update(user_in.model_dump(exclude_unset=True))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
