from decimal import Decimal

from sqlmodel import Session, select

from auth.models import UserCreate
from auth.service import create_user
from expenses.models import ExpenseCreate, ExpenseUpdate, ExpenseSplit
from expenses.service import (
    count_expenses_for_group,
    create_expense,
    delete_expense,
    get_expense_by_id,
    get_expenses_for_group,
    update_expense,
)
from groups.models import ExpenseGroupCreate
from groups.service import add_member, create_group


class TestCreateExpense:
    def test_creates_expense(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))

        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Dinner", description="Team dinner", value=Decimal("45.50")),
        )

        assert expense.id is not None
        assert expense.name == "Dinner"
        assert expense.description == "Team dinner"
        assert expense.value == Decimal("45.50")
        assert expense.group_id == group.id
        assert expense.created_by == user.id
        assert expense.created_at is not None
        assert expense.updated_at is not None

    def test_rounds_value_up(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="round@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Round Group"))

        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Coffee", value=Decimal("10.001")),
        )

        assert expense.value == Decimal("10.01")

    def test_creates_splits_for_members(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Owner", email="owner@example.com", password="password")
        )
        other = create_user(
            session=session, user_in=UserCreate(name="Other", email="other@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Split Group"))
        assert other.id is not None
        add_member(session=session, group=group, user_id=other.id)

        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Dinner", value=Decimal("10.00")),
        )

        splits = session.exec(select(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id)).all()
        assert len(splits) == 2
        assert sum(split.share for split in splits) == Decimal("10.00")


class TestGetExpenseById:
    def test_returns_expense(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        assert group.id is not None
        assert user.id is not None
        created = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        assert created.id is not None
        expense = get_expense_by_id(session=session, expense_id=created.id)
        assert expense is not None
        assert expense.id == created.id

    def test_returns_none_when_not_found(self, session: Session) -> None:
        expense = get_expense_by_id(session=session, expense_id=99999)
        assert expense is None


class TestGetExpensesForGroup:
    def test_returns_expenses_ordered_by_date(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))

        # Create expenses
        assert group.id is not None
        assert user.id is not None
        create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="First", value=Decimal("10.00")),
        )
        create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Second", value=Decimal("20.00")),
        )

        expenses = get_expenses_for_group(session=session, group_id=group.id)
        assert len(expenses) == 2
        # Most recent first
        assert expenses[0].name == "Second"
        assert expenses[1].name == "First"

    def test_respects_pagination(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))

        assert group.id is not None
        assert user.id is not None
        for i in range(5):
            create_expense(
                session=session,
                group_id=group.id,
                user_id=user.id,
                expense_in=ExpenseCreate(name=f"Expense {i}", value=Decimal("10.00")),
            )

        first_page = get_expenses_for_group(session=session, group_id=group.id, offset=0, limit=2)
        assert len(first_page) == 2

        second_page = get_expenses_for_group(session=session, group_id=group.id, offset=2, limit=2)
        assert len(second_page) == 2

        # No overlap between pages
        first_ids = {e.id for e in first_page}
        second_ids = {e.id for e in second_page}
        assert first_ids.isdisjoint(second_ids)


class TestCountExpensesForGroup:
    def test_counts_expenses(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        assert group.id is not None
        assert user.id is not None
        assert count_expenses_for_group(session=session, group_id=group.id) == 0

        create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )
        assert count_expenses_for_group(session=session, group_id=group.id) == 1

        create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Test 2", value=Decimal("20.00")),
        )
        assert count_expenses_for_group(session=session, group_id=group.id) == 2


class TestUpdateExpense:
    def test_updates_all_fields(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Original", description="Original desc", value=Decimal("10.00")),
        )
        original_updated_at = expense.updated_at

        updated = update_expense(
            session=session,
            expense=expense,
            expense_in=ExpenseUpdate(name="Updated", description="Updated desc", value=Decimal("25.00")),
        )

        assert updated.name == "Updated"
        assert updated.description == "Updated desc"
        assert updated.value == Decimal("25.00")
        assert updated.updated_at > original_updated_at

    def test_partial_update(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Original", description="Original desc", value=Decimal("10.00")),
        )

        # Only update name
        updated = update_expense(session=session, expense=expense, expense_in=ExpenseUpdate(name="Updated Name"))

        assert updated.name == "Updated Name"
        assert updated.description == "Original desc"  # Unchanged
        assert updated.value == Decimal("10.00")  # Unchanged


class TestDeleteExpense:
    def test_deletes_expense(self, session: Session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        assert group.id is not None
        assert user.id is not None
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="To Delete", value=Decimal("10.00")),
        )
        expense_id = expense.id

        delete_expense(session=session, expense=expense)

        assert expense_id is not None
        assert get_expense_by_id(session=session, expense_id=expense_id) is None
