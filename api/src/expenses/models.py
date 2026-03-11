from datetime import UTC, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel, UniqueConstraint

from core.money import PRICING_DECIMAL_PLACES, PositiveDecimal


class ExpenseBase(SQLModel):
    """Base expense fields shared between DB model and schemas."""

    name: str
    description: str | None = None
    value: PositiveDecimal = Field(decimal_places=PRICING_DECIMAL_PLACES)


class Expense(ExpenseBase, table=True):
    """Expense database model."""

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="expensegroup.id", ondelete="CASCADE")
    created_by: int = Field(foreign_key="user.id")
    creditor_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ExpenseSplit(SQLModel, table=True):
    """Snapshot of how an expense is split among members."""

    __table_args__ = (UniqueConstraint("expense_id", "user_id"),)

    id: int | None = Field(default=None, primary_key=True)
    expense_id: int = Field(foreign_key="expense.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="user.id")
    share: Decimal = Field(decimal_places=PRICING_DECIMAL_PLACES)


class ExpenseCreate(ExpenseBase):
    """Schema for creating an expense."""

    creditor_id: int | None = None


class ExpenseUpdate(SQLModel):
    """Schema for updating an expense. All fields optional."""

    name: str | None = None
    description: str | None = None
    value: PositiveDecimal | None = Field(default=None, decimal_places=PRICING_DECIMAL_PLACES)
    creditor_id: int | None = None


class ExpensePublic(ExpenseBase):
    """Schema for expense API responses."""

    id: int
    group_id: int
    created_by: int
    creditor_id: int
    created_at: datetime
    updated_at: datetime


class ExpenseList(SQLModel):
    """Paginated list of expenses."""

    items: list[ExpensePublic]
    total: int
    offset: int
    limit: int
