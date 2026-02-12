from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session

from auth.models import User, UserCreate
from auth.security import create_access_token
from auth.service import create_user
from conftest import AuthenticatedClient
from expenses.models import ExpenseCreate
from expenses.service import create_expense
from groups.models import ExpenseGroup, ExpenseGroupCreate
from groups.service import add_member, create_group


def create_test_user(session: Session, email: str, name: str = "Test User") -> tuple[User, str]:
    """Helper to create a test user and return user with token."""
    user = create_user(session=session, user_in=UserCreate(name=name, email=email, password="testpassword123"))
    token = create_access_token(user=user)
    return user, token


def create_test_group(session: Session, user: User, name: str = "Test Group") -> ExpenseGroup:
    """Helper to create a test group."""
    return create_group(session=session, user=user, group_in=ExpenseGroupCreate(name=name))


class TestCreateExpense:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        # Create a group first
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.post(
            f"/groups/{group_id}/expenses/", json={"name": "Dinner", "description": "Team dinner", "value": "45.50"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Dinner"
        assert data["description"] == "Team dinner"
        assert Decimal(data["value"]) == Decimal("45.50")
        assert data["group_id"] == group_id
        assert data["created_by"] == user.id
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_success_without_description(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.post(f"/groups/{group_id}/expenses/", json={"name": "Coffee", "value": "5.00"})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Coffee"
        assert data["description"] is None
        assert Decimal(data["value"]) == Decimal("5.00")

    def test_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        # Create another user with their own group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_test_group(session, other_user, "Other Group")

        response = client.post(f"/groups/{other_group.id}/expenses/", json={"name": "Expense", "value": "10.00"})
        assert response.status_code == 404
        assert response.json()["detail"] == "Group not found"

    def test_group_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.post("/groups/99999/expenses/", json={"name": "Expense", "value": "10.00"})
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.post("/groups/1/expenses/", json={"name": "Expense", "value": "10.00"})
        assert response.status_code == 401

    def test_invalid_data_missing_name(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.post(f"/groups/{group_id}/expenses/", json={"value": "10.00"})
        assert response.status_code == 422

    def test_invalid_data_missing_value(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.post(f"/groups/{group_id}/expenses/", json={"name": "Expense"})
        assert response.status_code == 422


class TestListExpenses:
    def test_empty_list(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.get(f"/groups/{group_id}/expenses/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["offset"] == 0
        assert data["limit"] == 20

    def test_list_expenses(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        # Create some expenses
        client.post(f"/groups/{group_id}/expenses/", json={"name": "Expense 1", "value": "10.00"})
        client.post(f"/groups/{group_id}/expenses/", json={"name": "Expense 2", "value": "20.00"})

        response = client.get(f"/groups/{group_id}/expenses/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2
        # Latest expense should be first (ordered by created_at desc)
        assert data["items"][0]["name"] == "Expense 2"
        assert data["items"][1]["name"] == "Expense 1"

    def test_pagination(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        # Create 5 expenses
        for i in range(5):
            client.post(f"/groups/{group_id}/expenses/", json={"name": f"Expense {i}", "value": "10.00"})

        # Get first page
        response = client.get(f"/groups/{group_id}/expenses/?offset=0&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["offset"] == 0
        assert data["limit"] == 2

        # Get second page
        response = client.get(f"/groups/{group_id}/expenses/?offset=2&limit=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["offset"] == 2

        # Get last page
        response = client.get(f"/groups/{group_id}/expenses/?offset=4&limit=2")
        data = response.json()
        assert len(data["items"]) == 1
        assert data["offset"] == 4

    def test_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_test_group(session, other_user, "Other Group")

        response = client.get(f"/groups/{other_group.id}/expenses/")
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/groups/1/expenses/")
        assert response.status_code == 401


class TestGetExpense:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        create_response = client.post(
            f"/groups/{group_id}/expenses/", json={"name": "Dinner", "description": "Team dinner", "value": "45.50"}
        )
        expense_id = create_response.json()["id"]

        response = client.get(f"/expenses/{expense_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == expense_id
        assert data["name"] == "Dinner"
        assert data["description"] == "Team dinner"
        assert Decimal(data["value"]) == Decimal("45.50")
        assert data["group_id"] == group_id
        assert data["created_by"] == user.id

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.get("/expenses/99999/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Expense not found"

    def test_not_a_member(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, _ = authenticated_client
        # Create another user with their own group and expense
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_test_group(session, other_user, "Other Group")
        assert other_group.id is not None
        assert other_user.id is not None
        expense = create_expense(
            session=session,
            group_id=other_group.id,
            user_id=other_user.id,
            expense_in=ExpenseCreate(name="Other Expense", value=Decimal("10.00")),
        )

        response = client.get(f"/expenses/{expense.id}/")
        assert response.status_code == 404
        assert response.json()["detail"] == "Expense not found"

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/expenses/1/")
        assert response.status_code == 401


class TestUpdateExpense:
    def test_success_full_update(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        create_response = client.post(
            f"/groups/{group_id}/expenses/", json={"name": "Original", "description": "Original desc", "value": "10.00"}
        )
        expense_id = create_response.json()["id"]

        response = client.patch(
            f"/expenses/{expense_id}/", json={"name": "Updated", "description": "Updated desc", "value": "25.00"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated"
        assert data["description"] == "Updated desc"
        assert Decimal(data["value"]) == Decimal("25.00")

    def test_success_partial_update(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        create_response = client.post(
            f"/groups/{group_id}/expenses/", json={"name": "Original", "description": "Original desc", "value": "10.00"}
        )
        expense_id = create_response.json()["id"]

        # Only update name
        response = client.patch(f"/expenses/{expense_id}/", json={"name": "Updated Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Original desc"  # Unchanged
        assert Decimal(data["value"]) == Decimal("10.00")  # Unchanged

    def test_not_the_creator(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_test_group(session, other_user, "Other Group")

        # Add current user as member
        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        # Other user creates an expense
        assert other_group.id is not None
        assert other_user.id is not None
        expense = create_expense(
            session=session,
            group_id=other_group.id,
            user_id=other_user.id,
            expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
        )

        # Current user tries to update it
        response = client.patch(f"/expenses/{expense.id}/", json={"name": "Hijacked"})
        assert response.status_code == 403
        assert response.json()["detail"] == "Not authorized to modify this expense"

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.patch("/expenses/99999/", json={"name": "Updated"})
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.patch("/expenses/1/", json={"name": "Updated"})
        assert response.status_code == 401


class TestDeleteExpense:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        create_response = client.post(f"/groups/{group_id}/expenses/", json={"name": "To Delete", "value": "10.00"})
        expense_id = create_response.json()["id"]

        response = client.delete(f"/expenses/{expense_id}/")
        assert response.status_code == 204

        # Verify expense is deleted
        get_response = client.get(f"/expenses/{expense_id}/")
        assert get_response.status_code == 404

    def test_not_the_creator(self, authenticated_client: AuthenticatedClient, session: Session) -> None:
        client, user = authenticated_client
        # Create another user who owns the group
        other_user, _ = create_test_user(session, "other@example.com")
        other_group = create_test_group(session, other_user, "Other Group")

        # Add current user as member
        assert user.id is not None
        add_member(session=session, group=other_group, user_id=user.id)

        # Other user creates an expense
        assert other_group.id is not None
        assert other_user.id is not None
        expense = create_expense(
            session=session,
            group_id=other_group.id,
            user_id=other_user.id,
            expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
        )

        # Current user tries to delete it
        response = client.delete(f"/expenses/{expense.id}/")
        assert response.status_code == 403

    def test_not_found(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.delete("/expenses/99999/")
        assert response.status_code == 404

    def test_no_token(self, client: TestClient) -> None:
        response = client.delete("/expenses/1/")
        assert response.status_code == 401


class TestExpenseIsolation:
    def test_expenses_only_visible_in_own_group(self, authenticated_client: AuthenticatedClient) -> None:
        """Test that expenses from one group don't appear in another group's list."""
        client, _ = authenticated_client

        # Create two groups
        group1 = client.post("/groups/", json={"name": "Group 1"}).json()
        group2 = client.post("/groups/", json={"name": "Group 2"}).json()

        # Create expenses in each group
        client.post(f"/groups/{group1['id']}/expenses/", json={"name": "Expense 1", "value": "10.00"})
        client.post(f"/groups/{group2['id']}/expenses/", json={"name": "Expense 2", "value": "20.00"})

        # Verify each group only sees its own expenses
        group1_expenses = client.get(f"/groups/{group1['id']}/expenses/").json()
        group2_expenses = client.get(f"/groups/{group2['id']}/expenses/").json()

        assert group1_expenses["total"] == 1
        assert group1_expenses["items"][0]["name"] == "Expense 1"

        assert group2_expenses["total"] == 1
        assert group2_expenses["items"][0]["name"] == "Expense 2"
