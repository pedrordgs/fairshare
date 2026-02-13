from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session

from auth.models import UserCreate
from auth.security import create_access_token
from auth.service import create_user
from conftest import AuthenticatedClient
from expenses.models import ExpenseCreate
from expenses.service import create_expense
from groups.models import ExpenseGroupCreate
from groups.service import create_group, get_group_by_id, add_member


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

        response = client.get(f"/groups/{group_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Group"
        assert data["created_by"] == user.id
        assert len(data["members"]) == 1
        assert data["expense_count"] == 0
        assert data["owed_by_user_total"] == 0.0
        assert data["owed_to_user_total"] == 0.0
        assert data["owed_by_user"] == []
        assert data["owed_to_user"] == []
        assert data["last_activity_at"] is None

    def test_returns_calculated_debts(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        create_response = client.post("/groups/", json={"name": "Balance Group"})
        group_id = create_response.json()["id"]

        other_user, _ = create_test_user(session, "other@example.com")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert other_user.id is not None

        assert group.id is not None
        add_member(session=session, group=group, user_id=other_user.id)
        create_expense(
            session=session,
            group_id=group.id,
            user_id=other_user.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("10.00")),
        )

        response = client.get(f"/groups/{group_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["owed_by_user_total"] == 5.0
        assert data["owed_to_user_total"] == 0.0
        assert data["owed_by_user"] == [{"user_id": other_user.id, "amount": 5.0}]
        assert data["owed_to_user"] == []

    def test_returns_netted_pairwise_debts(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Debt Group"})
        group_id = create_response.json()["id"]

        jane, _ = create_test_user(session, "jane@example.com", "Jane")
        david, _ = create_test_user(session, "david@example.com", "David")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert jane.id is not None
        assert david.id is not None

        add_member(session=session, group=group, user_id=jane.id)
        add_member(session=session, group=group, user_id=david.id)

        assert group.id is not None
        assert john.id is not None
        create_expense(
            session=session,
            group_id=group.id,
            user_id=john.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("12.00")),
        )
        create_expense(
            session=session,
            group_id=group.id,
            user_id=jane.id,
            expense_in=ExpenseCreate(name="Taxi", value=Decimal("6.00")),
        )

        response = client.get(f"/groups/{group_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["owed_by_user_total"] == 0.0
        assert data["owed_to_user_total"] == 6.0
        assert data["owed_by_user"] == []
        assert data["owed_to_user"] == [{"user_id": david.id, "amount": 6.0}]

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.get("/groups/99999/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        # Create another user with their own group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        response = client.get(f"/groups/{other_group.id}/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/groups/1/")
        assert response.status_code == 401


class TestGroupSettlementPlan:
    def test_returns_minimized_user_debts(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Group"})
        group_id = create_response.json()["id"]

        jane, _ = create_test_user(session, "jane2@example.com", "Jane")
        david, _ = create_test_user(session, "david2@example.com", "David")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert jane.id is not None
        assert david.id is not None

        add_member(session=session, group=group, user_id=jane.id)
        add_member(session=session, group=group, user_id=david.id)

        assert group.id is not None
        assert john.id is not None
        create_expense(
            session=session,
            group_id=group.id,
            user_id=john.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("12.00")),
        )
        create_expense(
            session=session,
            group_id=group.id,
            user_id=jane.id,
            expense_in=ExpenseCreate(name="Taxi", value=Decimal("6.00")),
        )

        jane_token = create_access_token(user=jane)
        client.headers["Authorization"] = f"Bearer {jane_token}"
        response = client.get(f"/groups/{group_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["owed_by_user_total"] == 0.0
        assert data["owed_to_user_total"] == 0.0
        assert data["owed_by_user"] == []
        assert data["owed_to_user"] == []


class TestGroupSettlementPayment:
    def test_creates_settlement_and_reduces_debt(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Payments"})
        group_id = create_response.json()["id"]

        jane, jane_token = create_test_user(session, "jane3@example.com", "Jane")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert john.id is not None
        assert jane.id is not None

        add_member(session=session, group=group, user_id=jane.id)

        assert group.id is not None
        create_expense(
            session=session,
            group_id=group.id,
            user_id=john.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("12.00")),
        )

        client.headers["Authorization"] = f"Bearer {jane_token}"
        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": john.id, "amount": 4.0}
        )
        assert settlement_response.status_code == 201
        data = settlement_response.json()
        assert data["owed_by_user_total"] == 2.0
        assert data["owed_to_user_total"] == 0.0
        assert data["owed_by_user"] == [{"user_id": john.id, "amount": 2.0}]

    def test_rejects_overpayment(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Overpay"})
        group_id = create_response.json()["id"]

        jane, jane_token = create_test_user(session, "jane4@example.com", "Jane")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert john.id is not None
        assert jane.id is not None

        add_member(session=session, group=group, user_id=jane.id)

        assert group.id is not None
        create_expense(
            session=session,
            group_id=group.id,
            user_id=john.id,
            expense_in=ExpenseCreate(name="Groceries", value=Decimal("10.00")),
        )

        client.headers["Authorization"] = f"Bearer {jane_token}"
        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": john.id, "amount": 6.0}
        )
        assert settlement_response.status_code == 400
        assert settlement_response.json()["detail"] == "Amount exceeds outstanding debt"

    def test_rejects_self_settlement(self, authenticated_client: AuthenticatedClient) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Self Settlement"})
        group_id = create_response.json()["id"]

        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": john.id, "amount": 1.0}
        )
        assert settlement_response.status_code == 400
        assert settlement_response.json()["detail"] == "Creditor must be a different group member"

    def test_rejects_non_member_creditor(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, john = authenticated_client
        create_response = client.post("/groups/", json={"name": "Unknown Creditor"})
        group_id = create_response.json()["id"]

        other_user, _ = create_test_user(session, "other2@example.com")
        assert other_user.id is not None

        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": other_user.id, "amount": 1.0}
        )
        assert settlement_response.status_code == 404
        assert settlement_response.json()["detail"] == "Member not found"


class TestListGroupSettlements:
    def test_lists_group_settlements(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement History"})
        group_id = create_response.json()["id"]

        jane, jane_token = create_test_user(session, "jane-history@example.com", "Jane")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert group.id is not None
        assert owner.id is not None
        assert jane.id is not None

        add_member(session=session, group=group, user_id=jane.id)

        create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Lunch", value=Decimal("12.00")),
        )

        client.headers["Authorization"] = f"Bearer {jane_token}"
        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 4.0}
        )
        assert settlement_response.status_code == 201

        history_response = client.get(f"/groups/{group_id}/settlements/?offset=0&limit=10")
        assert history_response.status_code == 200
        data = history_response.json()
        assert data["total"] == 1
        assert data["offset"] == 0
        assert data["limit"] == 10
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["group_id"] == group_id
        assert item["debtor_id"] == jane.id
        assert item["creditor_id"] == owner.id
        assert item["amount"] == 4.0
        assert item["created_at"] is not None

    def test_paginates_group_settlements(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Paging"})
        group_id = create_response.json()["id"]

        jane, jane_token = create_test_user(session, "jane-paging@example.com", "Jane")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert group.id is not None
        assert owner.id is not None
        assert jane.id is not None

        add_member(session=session, group=group, user_id=jane.id)

        create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("12.00")),
        )

        client.headers["Authorization"] = f"Bearer {jane_token}"
        settlement_response_1 = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 3.0}
        )
        assert settlement_response_1.status_code == 201
        settlement_response_2 = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 2.0}
        )
        assert settlement_response_2.status_code == 201

        page_one = client.get(f"/groups/{group_id}/settlements/?offset=0&limit=1")
        assert page_one.status_code == 200
        page_one_data = page_one.json()
        assert page_one_data["total"] == 2
        assert page_one_data["offset"] == 0
        assert page_one_data["limit"] == 1
        assert len(page_one_data["items"]) == 1

        page_two = client.get(f"/groups/{group_id}/settlements/?offset=1&limit=1")
        assert page_two.status_code == 200
        page_two_data = page_two.json()
        assert page_two_data["total"] == 2
        assert page_two_data["offset"] == 1
        assert page_two_data["limit"] == 1
        assert len(page_two_data["items"]) == 1
        assert page_one_data["items"][0]["id"] != page_two_data["items"][0]["id"]

    def test_rejects_non_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Access"})
        group_id = create_response.json()["id"]

        jane, jane_token = create_test_user(session, "jane-access@example.com", "Jane")
        assert owner.id is not None
        assert jane.id is not None

        client.headers["Authorization"] = f"Bearer {jane_token}"
        response = client.get(f"/groups/{group_id}/settlements/")
        assert response.status_code == 404


class TestUpdateGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        create_response = client.post("/groups/", json={"name": "Original Name"})
        group_id = create_response.json()["id"]

        response = client.patch(f"/groups/{group_id}/", json={"name": "Updated Name"})
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
        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        response = client.patch(f"/groups/{other_group.id}/", json={"name": "Hijacked Name"})
        assert response.status_code == 403
        assert response.json()["detail"] == "Not authorized to modify this group"

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.patch("/groups/99999/", json={"name": "Updated Name"})
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.patch("/groups/1/", json={"name": "Updated Name"})
        assert response.status_code == 401


class TestDeleteGroup:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        create_response = client.post("/groups/", json={"name": "To Delete"})
        group_id = create_response.json()["id"]

        response = client.delete(f"/groups/{group_id}/")
        assert response.status_code == 204

        # Verify group is deleted
        get_response = client.get(f"/groups/{group_id}/")
        assert get_response.status_code == 404

    def test_not_owner(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Other Group"))

        # Add current user as member
        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        response = client.delete(f"/groups/{other_group.id}/")
        assert response.status_code == 403

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.delete("/groups/99999/")
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.delete("/groups/1/")
        assert response.status_code == 401


class TestJoinGroup:
    def test_success(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        owner, _ = create_test_user(session, "owner@example.com", "Owner")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Join Group"))

        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == group.id
        member_ids = [m["user_id"] for m in data["members"]]
        assert len(member_ids) == 2

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.post("/groups/join/", json={"code": "NOTACODE"})
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_idempotent(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="My Group"))
        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 200
        data = response.json()
        member_ids = [m["user_id"] for m in data["members"]]
        assert member_ids.count(user.id) == 1

    def test_no_token(self, client: TestClient) -> None:
        response = client.post("/groups/join/", json={"code": "TESTCODE"})
        assert response.status_code == 401
