from typing import Annotated

from fastapi import Depends, HTTPException, Path, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession
from groups.service import is_member

from .models import Expense
from .service import get_expense_by_id


async def get_expense_as_member(
    session: DbSession, authenticated_user: AuthenticatedUser, expense_id: Annotated[int, Path()]
) -> Expense:
    """
    Dependency that fetches an expense and verifies the user is a member of its group.
    Returns 404 if expense doesn't exist or user is not a group member.
    """
    expense = get_expense_by_id(session=session, expense_id=expense_id)
    if not expense or not is_member(session=session, group_id=expense.group_id, user_id=authenticated_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


async def get_expense_as_creator(
    session: DbSession, authenticated_user: AuthenticatedUser, expense_id: Annotated[int, Path()]
) -> Expense:
    """
    Dependency that fetches an expense and verifies the user is the creator.
    Returns 404 if expense doesn't exist or user is not a group member.
    Returns 403 if user is a member but not the creator.
    """
    expense = get_expense_by_id(session=session, expense_id=expense_id)
    if not expense or not is_member(session=session, group_id=expense.group_id, user_id=authenticated_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    if expense.created_by != authenticated_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this expense")
    return expense


# Type aliases for cleaner route signatures
ExpenseAsMember = Annotated[Expense, Depends(get_expense_as_member)]
ExpenseAsCreator = Annotated[Expense, Depends(get_expense_as_creator)]
