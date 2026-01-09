from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from auth.models import User, UserCreate
from auth.security import create_access_token
from auth.service import create_user
from db.dependencies import get_database_session
from main import app

type AuthenticatedClient = tuple[TestClient, User]


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override() -> Session:
        return session

    app.dependency_overrides[get_database_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(client: TestClient, session: Session) -> Generator[AuthenticatedClient, None, None]:
    user = create_user(
        session=session, user_in=UserCreate(name="Test User", email="testuser@example.com", password="testpassword123")
    )
    access_token = create_access_token(user=user)
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client, user
    client.headers.pop("Authorization", None)
