from fastapi.testclient import TestClient
from sqlmodel import Session

from auth.models import UserCreate
from auth.security import create_access_token
from auth.service import create_user
from conftest import AuthenticatedClient
from groups.models import ExpenseGroupCreate
from groups.service import create_group


def create_test_user(session: Session, email: str, name: str = "Test User") -> tuple:
    """Helper to create a test user and return user with token."""
    user = create_user(session=session, user_in=UserCreate(name=name, email=email, password="testpassword123"))
    token = create_access_token(user=user)
    return user, token


class TestCreateGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.post("/groups/", json={"name": "Test Group"})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Group"
        assert data["created_by"] == user.id
        assert "id" in data
        assert "invite_code" in data
        # Creator should be auto-added as member
        assert len(data["members"]) == 1
        assert data["members"][0]["user_id"] == user.id
        assert data["members"][0]["email"] == user.email

    def test_no_token(self, client: TestClient) -> None:
        response = client.post("/groups/", json={"name": "Test Group"})
        assert response.status_code == 401


class TestListGroups:
    def test_empty_list(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.get("/groups/")
        assert response.status_code == 200
        data = response.json()
        assert data == {"items": [], "total": 0, "offset": 0, "limit": 12}

    def test_list_user_groups(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        # Create two groups
        client.post("/groups/", json={"name": "Group 1"})
        client.post("/groups/", json={"name": "Group 2"})

        response = client.get("/groups/")
        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        assert data["total"] == 2
        assert data["offset"] == 0
        assert data["limit"] == 12
        assert len(items) == 2
        names = [g["name"] for g in items]
        assert "Group 1" in names
        assert "Group 2" in names

    def test_only_returns_member_groups(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create a group for this user
        client.post("/groups/", json={"name": "My Group"})

        # Create another user and group
        other_user, _ = create_test_user(session, "other@example.com")
        create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        response = client.get("/groups/")
        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        assert data["total"] == 1
        assert len(items) == 1
        assert items[0]["name"] == "My Group"

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/groups/")
        assert response.status_code == 401


class TestGetGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        create_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = create_response.json()["id"]

        response = client.get(f"/groups/{group_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Group"
        assert data["created_by"] == user.id
        assert len(data["members"]) == 1

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.get("/groups/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        # Create another user with their own group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        response = client.get(f"/groups/{other_group.id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/groups/1")
        assert response.status_code == 401


class TestUpdateGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        create_response = client.post("/groups/", json={"name": "Original Name"})
        group_id = create_response.json()["id"]

        response = client.patch(f"/groups/{group_id}", json={"name": "Updated Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["created_by"] == user.id

    def test_not_owner(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        # Add current user as member (not owner)
        from groups.service import add_member

        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        response = client.patch(f"/groups/{other_group.id}", json={"name": "Hijacked Name"})
        assert response.status_code == 403
        assert response.json()["detail"] == "Not authorized to modify this group"

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.patch("/groups/99999", json={"name": "Updated Name"})
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.patch("/groups/1", json={"name": "Updated Name"})
        assert response.status_code == 401


class TestDeleteGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        create_response = client.post("/groups/", json={"name": "To Delete"})
        group_id = create_response.json()["id"]

        response = client.delete(f"/groups/{group_id}")
        assert response.status_code == 204

        # Verify group is deleted
        get_response = client.get(f"/groups/{group_id}")
        assert get_response.status_code == 404

    def test_not_owner(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        # Add current user as member
        from groups.service import add_member

        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        response = client.delete(f"/groups/{other_group.id}")
        assert response.status_code == 403

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.delete("/groups/99999")
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.delete("/groups/1")
        assert response.status_code == 401


class TestJoinGroup:
    def test_success(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        owner, _ = create_test_user(session, "owner@example.com", "Owner")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Join Group"))

        response = client.post("/groups/join", json={"code": group.invite_code})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == group.id
        member_ids = [m["user_id"] for m in data["members"]]
        assert len(member_ids) == 2

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.post("/groups/join", json={"code": "NOTACODE"})
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_idempotent(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="My Group"))
        response = client.post("/groups/join", json={"code": group.invite_code})
        assert response.status_code == 200
        data = response.json()
        member_ids = [m["user_id"] for m in data["members"]]
        assert member_ids.count(user.id) == 1

    def test_no_token(self, client: TestClient) -> None:
        response = client.post("/groups/join", json={"code": "TESTCODE"})
        assert response.status_code == 401

    def test_user_not_found(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Join Group"))
        user_id = user.id
        assert user_id is not None

        session.delete(user)
        session.commit()

        response = client.post("/groups/join", json={"code": group.invite_code})
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"
