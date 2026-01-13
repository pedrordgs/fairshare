from datetime import UTC, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class ExpenseBase(SQLModel):
    """Base expense fields shared between DB model and schemas."""

    name: str
    description: str | None = None
    value: Decimal = Field(decimal_places=2)


class Expense(ExpenseBase, table=True):
    """Expense database model."""

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="expensegroup.id", ondelete="CASCADE")
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ExpenseCreate(ExpenseBase):
    """Schema for creating an expense."""

    pass


class ExpenseUpdate(SQLModel):
    """Schema for updating an expense. All fields optional."""

    name: str | None = None
    description: str | None = None
    value: Decimal | None = None


class ExpensePublic(ExpenseBase):
    """Schema for expense API responses."""

    id: int
    group_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime


class ExpenseList(SQLModel):
    """Paginated list of expenses."""

    items: list[ExpensePublic]
    total: int
    offset: int
    limit: int
