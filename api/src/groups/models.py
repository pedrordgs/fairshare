from datetime import UTC, datetime
from decimal import Decimal

from pydantic import EmailStr, field_serializer, field_validator
from sqlmodel import Field, SQLModel, UniqueConstraint

from core.money import quantize_currency
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


class ExpenseGroupSettlement(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="expensegroup.id", ondelete="CASCADE")
    debtor_id: int = Field(foreign_key="user.id")
    creditor_id: int = Field(foreign_key="user.id")
    amount: Decimal = Field(decimal_places=2)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


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


class ExpenseGroupDebtItem(SQLModel):
    user_id: int
    amount: Decimal

    @field_serializer("amount")
    def _serialize_amount(self, amount: Decimal) -> float:
        return float(amount)


class ExpenseGroupListItem(ExpenseGroupPublic):
    created_at: datetime
    expense_count: int
    owed_by_user_total: Decimal
    owed_to_user_total: Decimal
    last_activity_at: datetime | None

    @field_serializer("owed_by_user_total")
    def _serialize_owed_by_user_total(self, owed_by_user_total: Decimal) -> float:
        return float(owed_by_user_total)

    @field_serializer("owed_to_user_total")
    def _serialize_owed_to_user_total(self, owed_to_user_total: Decimal) -> float:
        return float(owed_to_user_total)


class ExpenseGroupDetail(ExpenseGroupPublic):
    members: list[ExpenseGroupMemberPublic] = []
    created_at: datetime
    expense_count: int
    owed_by_user_total: Decimal
    owed_to_user_total: Decimal
    owed_by_user: list[ExpenseGroupDebtItem] = []
    owed_to_user: list[ExpenseGroupDebtItem] = []
    last_activity_at: datetime | None

    @field_serializer("owed_by_user_total")
    def _serialize_owed_by_user_total(self, owed_by_user_total: Decimal) -> float:
        return float(owed_by_user_total)

    @field_serializer("owed_to_user_total")
    def _serialize_owed_to_user_total(self, owed_to_user_total: Decimal) -> float:
        return float(owed_to_user_total)


class JoinGroupRequest(SQLModel):
    code: str

    @field_validator("code")
    @classmethod
    def _normalize_code(cls, value: str) -> str:
        normalized = normalize_invite_code(value)
        if not normalized:
            raise ValueError("Invite code must not be empty")
        return normalized


class GroupSettlementCreate(SQLModel):
    creditor_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def _normalize_amount(cls, value: Decimal) -> Decimal:
        if value <= Decimal("0.00"):
            raise ValueError("Amount must be greater than zero")
        return quantize_currency(value)
