from pydantic import EmailStr
from sqlmodel import Session, select

from .models import User, UserCreate, UserUpdate
from .security import get_password_hash


def get_user_by_id(*, session: Session, user_id: int) -> User | None:
    return session.get(User, user_id)


def get_user_by_email(*, session: Session, email: EmailStr) -> User | None:
    return session.exec(select(User).where(User.email == email)).one_or_none()


def get_user_by_google_id(*, session: Session, google_id: str) -> User | None:
    return session.exec(select(User).where(User.google_id == google_id)).one_or_none()


def create_user(*, session: Session, user_in: UserCreate) -> User:
    db_user = User.model_validate(user_in, update={"hashed_password": get_password_hash(user_in.password)})
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_or_create_user_by_google(*, session: Session, google_id: str, email: EmailStr, name: str) -> User:
    if user := get_user_by_google_id(session=session, google_id=google_id):
        return user
    if user := get_user_by_email(session=session, email=email):
        user.google_id = google_id
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    db_user = User(email=email, name=name, google_id=google_id)
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
