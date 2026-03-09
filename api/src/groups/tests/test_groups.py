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
from groups.service import add_member, create_group, get_group_by_id


def create_test_user(session: Session, email: str, name: str = "Test User") -> tuple:
    """Helper to create a test user and return user with token."""
    user = create_user(session=session, user_in=UserCreate(name=name, email=email, password="T3st!Pass#99"))
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
        assert item["created_by"] == jane.id
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


class TestUpdateSettlement:
    def _setup_settlement(self, authenticated_client: AuthenticatedClient, session: Session) -> tuple:
        """Helper: create group, add member, add expense, create settlement. Returns (client, group_id, settlement_id, creditor_user)."""
        client, creditor = authenticated_client
        create_response = client.post("/groups/", json={"name": "Settlement Edit Group"})
        group_id = create_response.json()["id"]

        debtor, debtor_token = create_test_user(session, "debtor-edit@example.com", "Debtor Edit")
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        assert group.id is not None
        assert debtor.id is not None
        assert creditor.id is not None

        add_member(session=session, group=group, user_id=debtor.id)

        create_expense(
            session=session,
            group_id=group.id,
            user_id=creditor.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("20.00")),
        )

        client.headers["Authorization"] = f"Bearer {debtor_token}"
        settlement_response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": creditor.id, "amount": 8.0}
        )
        assert settlement_response.status_code == 201

        history_response = client.get(f"/groups/{group_id}/settlements/?offset=0&limit=10")
        assert history_response.status_code == 200
        history_data = history_response.json()
        assert history_data["items"]
        settlement_id = history_data["items"][0]["id"]

        return client, group_id, settlement_id, creditor, debtor_token, debtor

    def test_update_settlement(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, group_id, settlement_id, creditor, debtor_token, debtor = self._setup_settlement(
            authenticated_client, session
        )
        # debtor is already authenticated (token set in _setup_settlement)
        response = client.patch(f"/groups/{group_id}/settlements/{settlement_id}/", json={"amount": 5.0})
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 5.0
        assert data["id"] == settlement_id

    def test_delete_settlement(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, group_id, settlement_id, creditor, debtor_token, debtor = self._setup_settlement(
            authenticated_client, session
        )
        response = client.delete(f"/groups/{group_id}/settlements/{settlement_id}/")
        assert response.status_code == 204

        # Verify settlement is no longer retrievable
        history_response = client.get(f"/groups/{group_id}/settlements/?offset=0&limit=10")
        assert history_response.status_code == 200
        items = history_response.json()["items"]
        assert not any(item["id"] == settlement_id for item in items)

    def test_settlement_update_forbidden(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, group_id, settlement_id, creditor, debtor_token, debtor = self._setup_settlement(
            authenticated_client, session
        )
        # Switch to creditor (non-creator of the settlement)
        creditor_token = create_access_token(user=creditor)
        client.headers["Authorization"] = f"Bearer {creditor_token}"

        response = client.patch(f"/groups/{group_id}/settlements/{settlement_id}/", json={"amount": 3.0})
        assert response.status_code == 403

    def test_settlement_delete_forbidden(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, group_id, settlement_id, creditor, debtor_token, debtor = self._setup_settlement(
            authenticated_client, session
        )
        # Switch to creditor (non-creator of the settlement)
        creditor_token = create_access_token(user=creditor)
        client.headers["Authorization"] = f"Bearer {creditor_token}"

        response = client.delete(f"/groups/{group_id}/settlements/{settlement_id}/")
        assert response.status_code == 403

    def test_success(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        owner, _ = create_test_user(session, "owner@example.com", "Owner")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Join Group"))

        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 201
        data = response.json()
        assert data["group_id"] == group.id
        assert data["status"] == "pending"
        assert data["requester"]["email"] is not None

        detail_response = client.get(f"/groups/{group.id}/")
        assert detail_response.status_code == 404

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.post("/groups/join/", json={"code": "NOTACODE"})
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_idempotent(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        owner, _ = create_test_user(session, "owner2@example.com", "Owner Two")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="My Group"))
        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 201
        second_response = client.post("/groups/join/", json={"code": group.invite_code})
        assert second_response.status_code == 200
        assert second_response.json()["id"] == response.json()["id"]

    def test_no_token(self, client: TestClient) -> None:
        response = client.post("/groups/join/", json={"code": "TESTCODE"})
        assert response.status_code == 401


class TestJoinGroupRequests:
    def test_owner_can_list_requests(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Request Group"))
        requester, requester_token = create_test_user(session, "requester@example.com", "Requester")

        client.headers["Authorization"] = f"Bearer {requester_token}"
        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 201

        client.headers["Authorization"] = f"Bearer {create_access_token(user=owner)}"
        list_response = client.get(f"/groups/{group.id}/join-requests/")
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) == 1
        assert data[0]["requester"]["email"] == requester.email

    def test_owner_can_accept_request(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Accept Group"))
        requester, requester_token = create_test_user(session, "accept@example.com", "Accept User")

        client.headers["Authorization"] = f"Bearer {requester_token}"
        request_response = client.post("/groups/join/", json={"code": group.invite_code})
        assert request_response.status_code == 201
        request_id = request_response.json()["id"]

        client.headers["Authorization"] = f"Bearer {create_access_token(user=owner)}"
        accept_response = client.post(f"/groups/{group.id}/join-requests/{request_id}/accept/")
        assert accept_response.status_code == 200
        assert accept_response.json()["status"] == "accepted"

        detail_response = client.get(f"/groups/{group.id}/")
        assert detail_response.status_code == 200
        member_ids = [m["user_id"] for m in detail_response.json()["members"]]
        assert requester.id in member_ids

    def test_owner_can_decline_request(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Decline Group"))
        requester, requester_token = create_test_user(session, "decline@example.com", "Decline User")

        client.headers["Authorization"] = f"Bearer {requester_token}"
        request_response = client.post("/groups/join/", json={"code": group.invite_code})
        assert request_response.status_code == 201
        request_id = request_response.json()["id"]

        client.headers["Authorization"] = f"Bearer {create_access_token(user=owner)}"
        decline_response = client.post(f"/groups/{group.id}/join-requests/{request_id}/decline/")
        assert decline_response.status_code == 200
        assert decline_response.json()["status"] == "declined"

    def test_declined_request_limit(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Limit Group"))
        requester, requester_token = create_test_user(session, "limit@example.com", "Limit User")

        for _ in range(3):
            client.headers["Authorization"] = f"Bearer {requester_token}"
            request_response = client.post("/groups/join/", json={"code": group.invite_code})
            assert request_response.status_code in (200, 201)
            request_id = request_response.json()["id"]

            client.headers["Authorization"] = f"Bearer {create_access_token(user=owner)}"
            decline_response = client.post(f"/groups/{group.id}/join-requests/{request_id}/decline/")
            assert decline_response.status_code == 200

        client.headers["Authorization"] = f"Bearer {requester_token}"
        fourth_response = client.post("/groups/join/", json={"code": group.invite_code})
        assert fourth_response.status_code == 400
        assert fourth_response.json()["detail"] == "Join request limit reached for this group"

    def test_rejects_join_request_when_member(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Member Group"))

        response = client.post("/groups/join/", json={"code": group.invite_code})
        assert response.status_code == 400
        assert response.json()["detail"] == "You are already a member of this group"


class TestGroupUpdateDelete:
    """Named tests required by the group-edit-delete acceptance criteria."""

    def test_update_group(self, authenticated_client: AuthenticatedClient) -> None:
        """Authenticated group owner sends PATCH /groups/{id}/ with a new name; asserts 200 and updated name."""
        client, user = authenticated_client
        create_response = client.post("/groups/", json={"name": "Original Name"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        response = client.patch(f"/groups/{group_id}/", json={"name": "Updated Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["created_by"] == user.id

    def test_group_update_forbidden(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Authenticated non-owner member sends PATCH; asserts 403."""
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "owner-for-update@example.com")
        other_group = create_group(session=session, user=other_user, group_in=ExpenseGroupCreate(name="Owner Group"))

        # Add current user as member (not owner)
        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        response = client.patch(f"/groups/{other_group.id}/", json={"name": "Hijacked"})
        assert response.status_code == 403

        response = client.delete(f"/groups/{other_group.id}/")
        assert response.status_code == 403


class TestGetGroupAsAdmin:
    """Tests for the get_group_as_admin dependency."""

    def test_admin_member_passes(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Member who is_admin=True can access admin-gated endpoints."""
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Admin Test Group"))
        assert group.id is not None

        other_user, other_token = create_test_user(session, "admin-passes@example.com")
        assert other_user.id is not None
        add_member(session=session, group=group, user_id=other_user.id, is_admin=True)

        # Use promote endpoint as a proxy for admin-gated access; promote a third member
        third_user, _ = create_test_user(session, "third-admin-passes@example.com")
        assert third_user.id is not None
        add_member(session=session, group=group, user_id=third_user.id)

        client.headers["Authorization"] = f"Bearer {other_token}"
        response = client.post(f"/groups/{group.id}/members/{third_user.id}/promote/")
        assert response.status_code == 200
        assert response.json()["is_admin"] is True

    def test_non_admin_member_gets_403(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Member with is_admin=False attempting to use the promote endpoint gets 403."""
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Non-Admin Test Group"))
        assert group.id is not None

        regular_user, regular_token = create_test_user(session, "non-admin-403@example.com")
        assert regular_user.id is not None
        add_member(session=session, group=group, user_id=regular_user.id)

        target_user, _ = create_test_user(session, "target-non-admin@example.com")
        assert target_user.id is not None
        add_member(session=session, group=group, user_id=target_user.id)

        # Non-admin member tries to use promote endpoint.
        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.post(f"/groups/{group.id}/members/{target_user.id}/promote/")
        assert response.status_code == 403

    def test_non_member_gets_404(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-member of the group gets 404 (hidden group)."""
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Hidden Group"))
        assert group.id is not None

        non_member, non_member_token = create_test_user(session, "non-member-404@example.com")
        assert non_member.id is not None

        # Target another non-member too
        target, _ = create_test_user(session, "target-non-member@example.com")
        assert target.id is not None

        client.headers["Authorization"] = f"Bearer {non_member_token}"
        response = client.post(f"/groups/{group.id}/members/{target.id}/promote/")
        assert response.status_code == 404


class TestPromoteMember:
    """Tests for POST /groups/{group_id}/members/{user_id}/promote/"""

    def test_owner_can_promote_regular_member(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Owner promotes a regular member; response is 200 with is_admin=True."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Promote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        target, _ = create_test_user(session, "promote-target@example.com")
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=target.id)

        response = client.post(f"/groups/{group_id}/members/{target.id}/promote/")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == target.id
        assert data["is_admin"] is True
        assert data["email"] == target.email

    def test_returns_400_if_already_admin(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Promoting an already-admin member returns 400."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Already Admin Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        target, _ = create_test_user(session, "already-admin@example.com")
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=target.id, is_admin=True)

        response = client.post(f"/groups/{group_id}/members/{target.id}/promote/")
        assert response.status_code == 400
        assert response.json()["detail"] == "Member is already an admin"

    def test_returns_404_if_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Promoting a user who is not a group member returns 404."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Non-Member Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        non_member, _ = create_test_user(session, "non-member-promote@example.com")
        assert non_member.id is not None

        response = client.post(f"/groups/{group_id}/members/{non_member.id}/promote/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Member not found"

    def test_non_owner_gets_403(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """A non-owner member attempting to promote another member gets 403."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Forbidden Promote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        non_owner, non_owner_token = create_test_user(session, "non-owner-promote@example.com")
        target, _ = create_test_user(session, "target-forbidden-promote@example.com")
        assert non_owner.id is not None
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=non_owner.id)
        add_member(session=session, group=group, user_id=target.id)

        client.headers["Authorization"] = f"Bearer {non_owner_token}"
        response = client.post(f"/groups/{group_id}/members/{target.id}/promote/")
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, client: TestClient, session: Session) -> None:
        """Unauthenticated request gets 401."""
        owner, _ = create_test_user(session, "owner-unauth-promote@example.com")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Unauth Promote Group"))
        assert group.id is not None
        response = client.post(f"/groups/{group.id}/members/1/promote/")
        assert response.status_code == 401


class TestDemoteMember:
    """Tests for POST /groups/{group_id}/members/{user_id}/demote/"""

    def test_owner_can_demote_admin(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Owner demotes an admin; response is 200 with is_admin=False."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Demote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        target, _ = create_test_user(session, "demote-target@example.com")
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=target.id, is_admin=True)

        response = client.post(f"/groups/{group_id}/members/{target.id}/demote/")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == target.id
        assert data["is_admin"] is False
        assert data["email"] == target.email

    def test_returns_400_if_target_is_owner(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Demoting the group owner returns 400."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Owner Demote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]
        assert owner.id is not None

        response = client.post(f"/groups/{group_id}/members/{owner.id}/demote/")
        assert response.status_code == 400
        assert response.json()["detail"] == "Cannot demote the group owner"

    def test_returns_400_if_not_currently_admin(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Demoting a regular (non-admin) member returns 400."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Not Admin Demote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        target, _ = create_test_user(session, "not-admin-demote@example.com")
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=target.id)

        response = client.post(f"/groups/{group_id}/members/{target.id}/demote/")
        assert response.status_code == 400
        assert response.json()["detail"] == "Member is not an admin"

    def test_returns_404_if_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Demoting a user who is not a group member returns 404."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Non-Member Demote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        non_member, _ = create_test_user(session, "non-member-demote@example.com")
        assert non_member.id is not None

        response = client.post(f"/groups/{group_id}/members/{non_member.id}/demote/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Member not found"

    def test_non_owner_gets_403(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """A non-owner member attempting to demote another member gets 403."""
        client, owner = authenticated_client
        create_response = client.post("/groups/", json={"name": "Forbidden Demote Group"})
        assert create_response.status_code == 201
        group_id = create_response.json()["id"]

        non_owner, non_owner_token = create_test_user(session, "non-owner-demote@example.com")
        target, _ = create_test_user(session, "target-forbidden-demote@example.com")
        assert non_owner.id is not None
        assert target.id is not None
        group = get_group_by_id(session=session, group_id=group_id)
        assert group is not None
        add_member(session=session, group=group, user_id=non_owner.id)
        add_member(session=session, group=group, user_id=target.id, is_admin=True)

        client.headers["Authorization"] = f"Bearer {non_owner_token}"
        response = client.post(f"/groups/{group_id}/members/{target.id}/demote/")
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, client: TestClient, session: Session) -> None:
        """Unauthenticated request gets 401."""
        owner, _ = create_test_user(session, "owner-unauth-demote@example.com")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Unauth Demote Group"))
        assert group.id is not None
        response = client.post(f"/groups/{group.id}/members/1/demote/")
        assert response.status_code == 401


class TestGroupSettlementOnBehalfOf:
    """Tests for admin recording settlements on behalf of a debtor."""

    def _setup_group_with_debt(self, session: Session) -> tuple:
        """
        Create a group with owner, admin, debtor, and creditor.
        The creditor (owner) pays for an expense so debtor owes them.
        Returns (owner, owner_token, admin, admin_token, debtor, debtor_token, creditor, group_id).
        """
        owner, owner_token = create_test_user(session, "sob-owner@example.com", "SOB Owner")
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="SOB Group"))
        assert group.id is not None
        assert owner.id is not None

        admin, admin_token = create_test_user(session, "sob-admin@example.com", "SOB Admin")
        assert admin.id is not None
        add_member(session=session, group=group, user_id=admin.id, is_admin=True)

        debtor, debtor_token = create_test_user(session, "sob-debtor@example.com", "SOB Debtor")
        assert debtor.id is not None
        add_member(session=session, group=group, user_id=debtor.id)

        # owner pays for dinner; debtor owes owner
        create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("12.00")),
        )

        return owner, owner_token, admin, admin_token, debtor, debtor_token, group.id

    def test_admin_records_settlement_on_behalf_of_debtor(self, client: TestClient, session: Session) -> None:
        """Admin provides debtor_id; settlement recorded with status 201 and debtor_id set correctly."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 4.0, "debtor_id": debtor.id}
        )
        assert response.status_code == 201

        # Verify settlement was recorded with correct debtor_id and created_by (admin)
        client.headers["Authorization"] = f"Bearer {debtor_token}"
        history_response = client.get(f"/groups/{group_id}/settlements/?offset=0&limit=10")
        assert history_response.status_code == 200
        items = history_response.json()["items"]
        assert len(items) == 1
        item = items[0]
        assert item["debtor_id"] == debtor.id
        assert item["creditor_id"] == owner.id
        assert item["created_by"] == admin.id
        assert item["amount"] == 4.0

    def test_non_admin_supplying_debtor_id_gets_403(self, client: TestClient, session: Session) -> None:
        """Regular member provides debtor_id; returns 403."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        regular, regular_token = create_test_user(session, "sob-regular@example.com", "SOB Regular")
        assert regular.id is not None
        # We need regular to be a member of the original group, not a new group
        from groups.service import get_group_by_id

        orig_group = get_group_by_id(session=session, group_id=group_id)
        assert orig_group is not None
        add_member(session=session, group=orig_group, user_id=regular.id)

        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 2.0, "debtor_id": debtor.id}
        )
        assert response.status_code == 403

    def test_debtor_id_not_a_group_member_gets_400(self, client: TestClient, session: Session) -> None:
        """Admin provides debtor_id that is not a group member; returns 400."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        outsider, _ = create_test_user(session, "sob-outsider@example.com", "SOB Outsider")
        assert outsider.id is not None

        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 2.0, "debtor_id": outsider.id}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Debtor is not a group member"

    def test_debtor_id_equals_creditor_id_gets_400(self, client: TestClient, session: Session) -> None:
        """Admin provides debtor_id equal to creditor_id; returns 400."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 2.0, "debtor_id": owner.id}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Creditor must be a different group member"

    def test_debt_validation_still_enforced_with_debtor_id(self, client: TestClient, session: Session) -> None:
        """Admin supplies debtor_id but amount exceeds outstanding balance; returns 400."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        # debtor owes 4.00 (12/3 split); try to pay 10.00
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(
            f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 10.0, "debtor_id": debtor.id}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Amount exceeds outstanding debt"

    def test_without_debtor_id_existing_behaviour_preserved(self, client: TestClient, session: Session) -> None:
        """Without debtor_id, the authenticated user is treated as the debtor (existing behaviour)."""
        owner, owner_token, admin, admin_token, debtor, debtor_token, group_id = self._setup_group_with_debt(session)

        client.headers["Authorization"] = f"Bearer {debtor_token}"
        response = client.post(f"/groups/{group_id}/settlements/", json={"creditor_id": owner.id, "amount": 4.0})
        assert response.status_code == 201
        data = response.json()
        assert data["owed_by_user_total"] == 0.0


class TestDelegatedGroupManagement:
    """Tests for delegated group management: non-owner admins can PATCH group and manage join requests."""

    def _setup_group_with_admin_and_requester(
        self, authenticated_client: AuthenticatedClient, session: Session, suffix: str
    ) -> tuple:
        """
        Creates a group owned by `authenticated_client`'s user, adds a non-owner admin,
        and submits a join request from a third user.
        Returns (client, group_id, admin_token, regular_token, request_id).
        """
        client, owner = authenticated_client
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name=f"Delegated Group {suffix}"))
        assert group.id is not None

        admin_user, admin_token = create_test_user(session, f"admin-{suffix}@example.com", "Admin User")
        assert admin_user.id is not None
        add_member(session=session, group=group, user_id=admin_user.id, is_admin=True)

        regular_user, regular_token = create_test_user(session, f"regular-{suffix}@example.com", "Regular User")
        assert regular_user.id is not None
        add_member(session=session, group=group, user_id=regular_user.id)

        # Submit a join request from a fourth user (not yet a member)
        requester, requester_token = create_test_user(session, f"requester-{suffix}@example.com", "Requester")
        client.headers["Authorization"] = f"Bearer {requester_token}"
        join_response = client.post("/groups/join/", json={"code": group.invite_code})
        assert join_response.status_code == 201
        request_id = join_response.json()["id"]

        return client, group.id, admin_token, regular_token, request_id

    # --- PATCH /groups/{group_id}/ ---

    def test_admin_can_patch_group_name(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-owner admin can successfully PATCH the group name."""
        client, group_id, admin_token, _, _req = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "patch-admin"
        )
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.patch(f"/groups/{group_id}/", json={"name": "Renamed By Admin"})
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed By Admin"

    def test_regular_member_cannot_patch_group_name(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Regular (non-admin) member receives 403 when trying to PATCH the group name."""
        client, group_id, _, regular_token, _req = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "patch-regular"
        )
        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.patch(f"/groups/{group_id}/", json={"name": "Hijacked By Regular"})
        assert response.status_code == 403

    # --- GET /groups/{group_id}/join-requests/ ---

    def test_admin_can_list_join_requests(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-owner admin can list join requests for the group."""
        client, group_id, admin_token, _, _req = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "list-jreq-admin"
        )
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.get(f"/groups/{group_id}/join-requests/")
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_regular_member_cannot_list_join_requests(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Regular (non-admin) member receives 403 when listing join requests."""
        client, group_id, _, regular_token, _req = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "list-jreq-regular"
        )
        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.get(f"/groups/{group_id}/join-requests/")
        assert response.status_code == 403

    # --- POST /groups/{group_id}/join-requests/{id}/accept/ ---

    def test_admin_can_accept_join_request(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-owner admin can accept a pending join request."""
        client, group_id, admin_token, _, request_id = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "accept-admin"
        )
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(f"/groups/{group_id}/join-requests/{request_id}/accept/")
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"

    def test_regular_member_cannot_accept_join_request(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Regular (non-admin) member receives 403 when accepting a join request."""
        client, group_id, _, regular_token, request_id = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "accept-regular"
        )
        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.post(f"/groups/{group_id}/join-requests/{request_id}/accept/")
        assert response.status_code == 403

    # --- POST /groups/{group_id}/join-requests/{id}/decline/ ---

    def test_admin_can_decline_join_request(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-owner admin can decline a pending join request."""
        client, group_id, admin_token, _, request_id = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "decline-admin"
        )
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.post(f"/groups/{group_id}/join-requests/{request_id}/decline/")
        assert response.status_code == 200
        assert response.json()["status"] == "declined"

    def test_regular_member_cannot_decline_join_request(
        self, authenticated_client: AuthenticatedClient, session: Session
    ) -> None:
        """Regular (non-admin) member receives 403 when declining a join request."""
        client, group_id, _, regular_token, request_id = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "decline-regular"
        )
        client.headers["Authorization"] = f"Bearer {regular_token}"
        response = client.post(f"/groups/{group_id}/join-requests/{request_id}/decline/")
        assert response.status_code == 403

    # --- DELETE /groups/{group_id}/ remains owner-only ---

    def test_admin_cannot_delete_group(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        """Non-owner admin receives 403 when attempting to DELETE the group."""
        client, group_id, admin_token, _, _req = self._setup_group_with_admin_and_requester(
            authenticated_client, session, "delete-admin"
        )
        client.headers["Authorization"] = f"Bearer {admin_token}"
        response = client.delete(f"/groups/{group_id}/")
        assert response.status_code == 403
