from sqlmodel import Session

from auth.models import UserCreate, UserUpdate
from auth.security import verify_password
from auth.service import create_user, get_user_by_email, get_user_by_id, update_user


class TestGetUserById:
    def test_returns_user_when_exists(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="test@example.com", password="password123")
        )
        assert user.id is not None
        result = get_user_by_id(session=session, user_id=user.id)
        assert result is not None
        assert result.id == user.id
        assert result.name == user.name
        assert result.email == user.email

    def test_returns_none_when_not_exists(self, session: Session) -> None:
        result = get_user_by_id(session=session, user_id=999)
        assert result is None


class TestGetUserByEmail:
    def test_returns_user_when_exists(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="test@example.com", password="password123")
        )
        result = get_user_by_email(session=session, email=user.email)
        assert result is not None
        assert result.id == user.id
        assert result.name == user.name
        assert result.email == user.email

    def test_returns_none_when_not_exists(self, session: Session) -> None:
        result = get_user_by_email(session=session, email="nonexistent@example.com")
        assert result is None


class TestCreateUser:
    def test_creates_user_with_hashed_password(self, session: Session) -> None:
        user_in = UserCreate(name="Test User", email="test@example.com", password="password123")
        user = create_user(session=session, user_in=user_in)
        assert user.id is not None
        assert user.name == user_in.name
        assert user.email == user_in.email
        assert user.hashed_password != user_in.password
        assert verify_password(user_in.password, user.hashed_password) is True

    def test_user_is_persisted(self, session: Session) -> None:
        user_in = UserCreate(name="Test User", email="test@example.com", password="password123")
        user = create_user(session=session, user_in=user_in)
        assert user.id is not None
        retrieved = get_user_by_id(session=session, user_id=user.id)
        assert retrieved is not None
        assert retrieved.id == user.id

    def test_creates_multiple_users(self, session: Session) -> None:
        user1 = create_user(
            session=session, user_in=UserCreate(name="User 1", email="user1@example.com", password="password123")
        )
        user2 = create_user(
            session=session, user_in=UserCreate(name="User 2", email="user2@example.com", password="password456")
        )
        assert user1.id != user2.id


class TestUpdateUser:
    def test_updates_name(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Original Name", email="test@example.com", password="password123")
        )
        user_in = UserUpdate(name="Updated Name")
        updated = update_user(session=session, user=user, user_in=user_in)
        assert updated.name == user_in.name
        assert updated.email == user.email

    def test_updates_email(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="old@example.com", password="password123")
        )
        user_in = UserUpdate(email="new@example.com")
        updated = update_user(session=session, user=user, user_in=user_in)
        assert updated.name == user.name
        assert updated.email == user_in.email

    def test_updates_both_fields(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Original Name", email="old@example.com", password="password123")
        )
        user_in = UserUpdate(name="New Name", email="new@example.com")
        updated = update_user(session=session, user=user, user_in=user_in)
        assert updated.name == user_in.name
        assert updated.email == user_in.email

    def test_no_changes_when_empty_update(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test User", email="test@example.com", password="password123")
        )
        user_in = UserUpdate()
        updated = update_user(session=session, user=user, user_in=user_in)
        assert updated.name == user.name
        assert updated.email == user.email

    def test_changes_are_persisted(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Original Name", email="test@example.com", password="password123")
        )
        user_in = UserUpdate(name="Updated Name")
        update_user(session=session, user=user, user_in=user_in)
        assert user.id is not None
        retrieved = get_user_by_id(session=session, user_id=user.id)
        assert retrieved is not None
        assert retrieved.name == user_in.name
