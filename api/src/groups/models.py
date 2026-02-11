from datetime import UTC, datetime
from decimal import Decimal

from pydantic import EmailStr, field_serializer, field_validator
from sqlmodel import Field, SQLModel, UniqueConstraint

from .utils import _validate_group_name, normalize_invite_code


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
    invite_code: str = Field(unique=True)


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
    invite_code: str


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
        return float(user_balance)


class JoinGroupRequest(SQLModel):
    code: str

    @field_validator("code")
    @classmethod
    def _normalize_code(cls, value: str) -> str:
        normalized = normalize_invite_code(value)
        if not normalized:
            raise ValueError("Invite code must not be empty")
        return normalized
