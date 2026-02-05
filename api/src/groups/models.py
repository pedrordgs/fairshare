from datetime import UTC, datetime
from decimal import Decimal

from pydantic import EmailStr, field_serializer, field_validator
from sqlmodel import Field, SQLModel, UniqueConstraint

from .utils import _validate_group_name


class ExpenseGroupBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def _validate_name_field(cls, value: str) -> str:
        return _validate_group_name(value)


class ExpenseGroup(ExpenseGroupBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ExpenseGroupMember(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("group_id", "user_id"),)

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="expensegroup.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="user.id")


class ExpenseGroupCreate(ExpenseGroupBase):
    pass


class ExpenseGroupUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def _validate_name_field(cls, value: str | None) -> str | None:
        return _validate_group_name(value)


class ExpenseGroupPublic(ExpenseGroupBase):
    id: int
    created_by: int


class ExpenseGroupMemberPublic(SQLModel):
    user_id: int
    name: str
    email: EmailStr


class ExpenseGroupDetail(ExpenseGroupPublic):
    members: list[ExpenseGroupMemberPublic] = []
    created_at: datetime
    expense_count: int
    user_balance: Decimal
    last_activity_at: datetime | None

    @field_serializer("user_balance")
    def _serialize_user_balance(self, user_balance: Decimal) -> float:
        # JSON has no Decimal type; we expose this as a numeric field.
        return float(user_balance)

    @field_serializer("created_at", "last_activity_at")
    def _serialize_datetimes(self, value: datetime | None) -> str | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        # Use Z for UTC to match frontend ISO datetime validation.
        return value.isoformat().replace("+00:00", "Z")


class AddMemberRequest(SQLModel):
    user_id: int


class PaginatedGroupsResponse(SQLModel):
    items: list[ExpenseGroupDetail]
    total: int
    offset: int
    limit: int
