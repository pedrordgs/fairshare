from datetime import UTC, datetime
from decimal import Decimal

from sqlmodel import Session, col, func, select

from core.money import quantize_currency
from groups.models import ExpenseGroupMember

from .models import Expense, ExpenseCreate, ExpenseSplit, ExpenseUpdate


def get_expense_by_id(*, session: Session, expense_id: int) -> Expense | None:
    """Get an expense by ID."""
    return session.get(Expense, expense_id)


def get_expenses_for_group(*, session: Session, group_id: int, offset: int = 0, limit: int = 20) -> list[Expense]:
    """Get paginated expenses for a group."""
    statement = (
        select(Expense)
        .where(Expense.group_id == group_id)
        .order_by(col(Expense.created_at).desc())
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def count_expenses_for_group(*, session: Session, group_id: int) -> int:
    """Count total expenses in a group."""
    statement = select(func.count()).select_from(Expense).where(Expense.group_id == group_id)
    return session.exec(statement).one()


def create_expense(*, session: Session, group_id: int, user_id: int, expense_in: ExpenseCreate) -> Expense:
    """Create a new expense in a group."""
    db_expense = Expense.model_validate(expense_in, update={"group_id": group_id, "created_by": user_id})
    session.add(db_expense)
    session.flush()
    _create_expense_splits(session=session, expense=db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense


def _create_expense_splits(*, session: Session, expense: Expense) -> None:
    """Create equal splits for all current group members."""
    members_statement = (
        select(ExpenseGroupMember.user_id)
        .where(ExpenseGroupMember.group_id == expense.group_id)
        .order_by(col(ExpenseGroupMember.user_id))
    )
    member_ids: list[int] = list(session.exec(members_statement))
    if not member_ids:
        return
    if expense.id is None:
        return

    total = quantize_currency(Decimal(expense.value))
    total_cents = int(total * 100)
    member_count = len(member_ids)
    base_share = total_cents // member_count
    remainder = total_cents % member_count

    splits: list[ExpenseSplit] = []
    for index, member_id in enumerate(member_ids):
        share_cents = base_share + (1 if index < remainder else 0)
        share = quantize_currency(Decimal(share_cents) / Decimal(100))
        splits.append(ExpenseSplit(expense_id=expense.id, user_id=member_id, share=share))

    session.add_all(splits)


def update_expense(*, session: Session, expense: Expense, expense_in: ExpenseUpdate) -> Expense:
    """Update an expense."""
    expense.sqlmodel_update(expense_in.model_dump(exclude_unset=True))
    expense.updated_at = datetime.now(UTC)
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


def delete_expense(*, session: Session, expense: Expense) -> None:
    """Delete an expense."""
    session.delete(expense)
    session.commit()
