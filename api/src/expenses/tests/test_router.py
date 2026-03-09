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
from groups.service import add_member, create_group, promote_member


def create_test_user(session: Session, email: str, name: str = "Test User") -> tuple[User, str]:
    """Helper to create a test user and return user with token."""
    user = create_user(session=session, user_in=UserCreate(name=name, email=email, password="T3st!Pass#99"))
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

    def test_invalid_data_too_many_decimal_places(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        group_response = client.post("/groups/", json={"name": "Test Group"})
        group_id = group_response.json()["id"]

        response = client.post(f"/groups/{group_id}/expenses/", json={"name": "Expense", "value": "10.001"})
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


def test_update_expense(authenticated_client: AuthenticatedClient) -> None:
    """Authenticated creator sends PATCH with changed name, description, and value; asserts 200 and updated fields."""
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


def test_delete_expense(authenticated_client: AuthenticatedClient) -> None:
    """Authenticated creator sends DELETE; asserts 204 and that a subsequent GET returns 404."""
    client, _ = authenticated_client
    group_response = client.post("/groups/", json={"name": "Test Group"})
    group_id = group_response.json()["id"]

    create_response = client.post(f"/groups/{group_id}/expenses/", json={"name": "To Delete", "value": "10.00"})
    expense_id = create_response.json()["id"]

    response = client.delete(f"/expenses/{expense_id}/")
    assert response.status_code == 204

    get_response = client.get(f"/expenses/{expense_id}/")
    assert get_response.status_code == 404


def test_expense_update_forbidden(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Authenticated non-creator group member sends PATCH; asserts 403."""
    client, user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert user.id is not None
    add_member(session=session, group=other_group, user_id=user.id)

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
    )

    response = client.patch(f"/expenses/{expense.id}/", json={"name": "Hijacked"})
    assert response.status_code == 403


def test_expense_delete_forbidden(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Authenticated non-creator group member sends DELETE; asserts 403."""
    client, user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert user.id is not None
    add_member(session=session, group=other_group, user_id=user.id)

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
    )

    response = client.delete(f"/expenses/{expense.id}/")
    assert response.status_code == 403


def test_admin_can_update_any_expense(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Group admin (non-creator) sends PATCH on another member's expense; asserts 200."""
    client, admin_user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert admin_user.id is not None
    add_member(session=session, group=other_group, user_id=admin_user.id)
    promote_member(session=session, group=other_group, user_id=admin_user.id)

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="Original", value=Decimal("10.00")),
    )

    response = client.patch(f"/expenses/{expense.id}/", json={"name": "Admin Updated"})
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Updated"


def test_admin_can_delete_any_expense(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Group admin (non-creator) sends DELETE on another member's expense; asserts 204."""
    client, admin_user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert admin_user.id is not None
    add_member(session=session, group=other_group, user_id=admin_user.id)
    promote_member(session=session, group=other_group, user_id=admin_user.id)

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="To Delete", value=Decimal("10.00")),
    )

    response = client.delete(f"/expenses/{expense.id}/")
    assert response.status_code == 204

    # Verify expense is deleted
    get_response = client.get(f"/expenses/{expense.id}/")
    assert get_response.status_code == 404


def test_non_admin_non_creator_update_forbidden(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Non-admin non-creator member sends PATCH; asserts 403."""
    client, user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert user.id is not None
    add_member(session=session, group=other_group, user_id=user.id)
    # user is a member but NOT promoted to admin

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
    )

    response = client.patch(f"/expenses/{expense.id}/", json={"name": "Hijacked"})
    assert response.status_code == 403


def test_non_admin_non_creator_delete_forbidden(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Non-admin non-creator member sends DELETE; asserts 403."""
    client, user = authenticated_client
    other_user, _ = create_test_user(session, "other@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert user.id is not None
    add_member(session=session, group=other_group, user_id=user.id)
    # user is a member but NOT promoted to admin

    assert other_group.id is not None
    assert other_user.id is not None
    expense = create_expense(
        session=session,
        group_id=other_group.id,
        user_id=other_user.id,
        expense_in=ExpenseCreate(name="Other's Expense", value=Decimal("10.00")),
    )

    response = client.delete(f"/expenses/{expense.id}/")
    assert response.status_code == 403


def test_admin_creates_expense_on_behalf_of_member(authenticated_client: AuthenticatedClient, session: Session) -> None:
    """Admin supplies created_for_user_id; asserts 201 and correct on_behalf_of_user_id / created_by values."""
    client, admin_user = authenticated_client
    other_user, _ = create_test_user(session, "member@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert admin_user.id is not None
    assert other_user.id is not None
    add_member(session=session, group=other_group, user_id=admin_user.id)
    promote_member(session=session, group=other_group, user_id=admin_user.id)

    response = client.post(
        f"/groups/{other_group.id}/expenses/",
        json={"name": "On Behalf Expense", "value": "30.00", "created_for_user_id": other_user.id},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["created_by"] == admin_user.id
    assert data["on_behalf_of_user_id"] == other_user.id
    assert data["name"] == "On Behalf Expense"


def test_non_admin_cannot_create_expense_on_behalf_of_member(
    authenticated_client: AuthenticatedClient, session: Session
) -> None:
    """Non-admin supplies created_for_user_id; asserts 403."""
    client, regular_user = authenticated_client
    other_user, _ = create_test_user(session, "owner@example.com")
    other_group = create_test_group(session, other_user, "Other Group")

    assert regular_user.id is not None
    assert other_user.id is not None
    add_member(session=session, group=other_group, user_id=regular_user.id)
    # regular_user is a member but NOT promoted to admin

    response = client.post(
        f"/groups/{other_group.id}/expenses/",
        json={"name": "Sneaky Expense", "value": "10.00", "created_for_user_id": other_user.id},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to create expenses on behalf of others"


def test_admin_creates_expense_with_invalid_created_for_user_id(
    authenticated_client: AuthenticatedClient, session: Session
) -> None:
    """Admin supplies created_for_user_id that is not a group member; asserts 400."""
    client, admin_user = authenticated_client
    group_owner, _ = create_test_user(session, "owner@example.com")
    other_group = create_test_group(session, group_owner, "Other Group")
    non_member, _ = create_test_user(session, "nonmember@example.com")

    assert admin_user.id is not None
    assert non_member.id is not None
    add_member(session=session, group=other_group, user_id=admin_user.id)
    promote_member(session=session, group=other_group, user_id=admin_user.id)

    response = client.post(
        f"/groups/{other_group.id}/expenses/",
        json={"name": "Bad Expense", "value": "20.00", "created_for_user_id": non_member.id},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "created_for_user_id does not belong to a group member"


def test_normal_expense_creation_without_created_for_user_id(authenticated_client: AuthenticatedClient) -> None:
    """Normal expense creation without created_for_user_id; asserts 201 and on_behalf_of_user_id is None."""
    client, user = authenticated_client
    group_response = client.post("/groups/", json={"name": "Test Group"})
    group_id = group_response.json()["id"]

    response = client.post(f"/groups/{group_id}/expenses/", json={"name": "Regular Expense", "value": "15.00"})
    assert response.status_code == 201
    data = response.json()
    assert data["on_behalf_of_user_id"] is None
    assert data["created_by"] == user.id
