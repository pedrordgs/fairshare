from datetime import UTC, datetime

from sqlmodel import Session, col, func, select

from .models import Expense, ExpenseCreate, ExpenseUpdate


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
    session.commit()
    session.refresh(db_expense)
    return db_expense


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
