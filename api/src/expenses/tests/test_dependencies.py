from decimal import Decimal

import pytest
from fastapi import HTTPException

from auth.models import UserCreate
from auth.service import create_user
from expenses.dependencies import get_expense_as_creator, get_expense_as_member
from expenses.models import ExpenseCreate
from expenses.service import create_expense
from groups.models import ExpenseGroupCreate
from groups.service import add_member, create_group


class TestGetExpenseAsMember:
    @pytest.mark.anyio
    async def test_returns_expense_for_creator(self, session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        result = await get_expense_as_member(session=session, authenticated_user=user, expense_id=expense.id)
        assert result.id == expense.id

    @pytest.mark.anyio
    async def test_returns_expense_for_group_member(self, session) -> None:
        owner = create_user(
            session=session, user_in=UserCreate(name="Owner", email="owner@example.com", password="password")
        )
        member = create_user(
            session=session, user_in=UserCreate(name="Member", email="member@example.com", password="password")
        )
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Test Group"))
        add_member(session=session, group=group, user_id=member.id)

        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        # Member can access the expense
        result = await get_expense_as_member(session=session, authenticated_user=member, expense_id=expense.id)
        assert result.id == expense.id

    @pytest.mark.anyio
    async def test_raises_404_when_not_member(self, session) -> None:
        owner = create_user(
            session=session, user_in=UserCreate(name="Owner", email="owner@example.com", password="password")
        )
        other_user = create_user(
            session=session, user_in=UserCreate(name="Other", email="other@example.com", password="password")
        )
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Test Group"))
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_expense_as_member(session=session, authenticated_user=other_user, expense_id=expense.id)
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Expense not found"

    @pytest.mark.anyio
    async def test_raises_404_when_expense_not_found(self, session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_expense_as_member(session=session, authenticated_user=user, expense_id=99999)
        assert exc_info.value.status_code == 404


class TestGetExpenseAsCreator:
    @pytest.mark.anyio
    async def test_returns_expense_for_creator(self, session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )
        group = create_group(session=session, user=user, group_in=ExpenseGroupCreate(name="Test Group"))
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=user.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        result = await get_expense_as_creator(session=session, authenticated_user=user, expense_id=expense.id)
        assert result.id == expense.id

    @pytest.mark.anyio
    async def test_raises_403_for_non_creator_member(self, session) -> None:
        owner = create_user(
            session=session, user_in=UserCreate(name="Owner", email="owner@example.com", password="password")
        )
        member = create_user(
            session=session, user_in=UserCreate(name="Member", email="member@example.com", password="password")
        )
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Test Group"))
        add_member(session=session, group=group, user_id=member.id)

        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        # Member cannot modify the expense
        with pytest.raises(HTTPException) as exc_info:
            await get_expense_as_creator(session=session, authenticated_user=member, expense_id=expense.id)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Not authorized to modify this expense"

    @pytest.mark.anyio
    async def test_raises_404_when_not_member(self, session) -> None:
        owner = create_user(
            session=session, user_in=UserCreate(name="Owner", email="owner@example.com", password="password")
        )
        other_user = create_user(
            session=session, user_in=UserCreate(name="Other", email="other@example.com", password="password")
        )
        group = create_group(session=session, user=owner, group_in=ExpenseGroupCreate(name="Test Group"))
        expense = create_expense(
            session=session,
            group_id=group.id,
            user_id=owner.id,
            expense_in=ExpenseCreate(name="Test", value=Decimal("10.00")),
        )

        # Non-member sees 404 (not 403) to avoid leaking info
        with pytest.raises(HTTPException) as exc_info:
            await get_expense_as_creator(session=session, authenticated_user=other_user, expense_id=expense.id)
        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_raises_404_when_expense_not_found(self, session) -> None:
        user = create_user(
            session=session, user_in=UserCreate(name="Test", email="test@example.com", password="password")
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_expense_as_creator(session=session, authenticated_user=user, expense_id=99999)
        assert exc_info.value.status_code == 404
