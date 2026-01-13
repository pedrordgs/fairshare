from fastapi import APIRouter, Query, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession
from groups.dependencies import GroupAsMember

from .dependencies import ExpenseAsCreator, ExpenseAsMember
from .models import ExpenseCreate, ExpenseList, ExpensePublic, ExpenseUpdate
from .service import count_expenses_for_group, create_expense, delete_expense, get_expenses_for_group, update_expense

router = APIRouter(tags=["expenses"])


@router.post("/groups/{group_id}/expenses", response_model=ExpensePublic, status_code=status.HTTP_201_CREATED)
async def create_group_expense(
    *, session: DbSession, authenticated_user: AuthenticatedUser, group: GroupAsMember, expense_in: ExpenseCreate
) -> ExpensePublic:
    """Create a new expense in a group. User must be a group member."""
    expense = create_expense(session=session, group_id=group.id, user_id=authenticated_user.id, expense_in=expense_in)
    return ExpensePublic.model_validate(expense)


@router.get("/groups/{group_id}/expenses", response_model=ExpenseList)
async def list_group_expenses(
    *,
    session: DbSession,
    group: GroupAsMember,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> ExpenseList:
    """List expenses in a group with pagination. User must be a group member."""
    expenses = get_expenses_for_group(session=session, group_id=group.id, offset=offset, limit=limit)
    total = count_expenses_for_group(session=session, group_id=group.id)
    return ExpenseList(
        items=[ExpensePublic.model_validate(e) for e in expenses], total=total, offset=offset, limit=limit
    )


@router.get("/expenses/{expense_id}", response_model=ExpensePublic)
async def get_expense(*, expense: ExpenseAsMember) -> ExpensePublic:
    """Get expense details. User must be a member of the expense's group."""
    return ExpensePublic.model_validate(expense)


@router.patch("/expenses/{expense_id}", response_model=ExpensePublic)
async def update_group_expense(
    *, session: DbSession, expense: ExpenseAsCreator, expense_in: ExpenseUpdate
) -> ExpensePublic:
    """Update an expense. Only the creator can update."""
    updated = update_expense(session=session, expense=expense, expense_in=expense_in)
    return ExpensePublic.model_validate(updated)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_expense(*, session: DbSession, expense: ExpenseAsCreator) -> None:
    """Delete an expense. Only the creator can delete."""
    delete_expense(session=session, expense=expense)
