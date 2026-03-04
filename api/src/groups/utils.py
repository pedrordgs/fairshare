import secrets
from decimal import Decimal
from typing import TypeVar

from fastapi import HTTPException, status
from sqlmodel import Session

INVITE_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
INVITE_CODE_LENGTH = 10

T = TypeVar("T", str, str | None)


def _validate_group_name(value: T) -> T:
    """Validate group name by stripping whitespace and ensuring it's not empty."""
    if value is None:
        return value
    value = value.strip()
    if not value:
        raise ValueError("Group name must not be empty")
    return value


def normalize_invite_code(value: str) -> str:
    return value.strip().upper().replace("-", "").replace(" ", "")


def generate_invite_code() -> str:
    return "".join(secrets.choice(INVITE_CODE_ALPHABET) for _ in range(INVITE_CODE_LENGTH))


def validate_settlement_creditor_and_amount(
    session: Session,
    group_id: int,
    debtor_id: int,
    creditor_id: int,
    amount: Decimal,
    existing_amount: Decimal | None = None,
) -> None:
    """Validate creditor membership and settlement amount against outstanding debt."""
    from .service import calculate_user_debts, get_member

    if creditor_id == debtor_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Creditor must be a different group member")
    if not get_member(session=session, group_id=group_id, user_id=creditor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    _, _, owed_by_user, _ = calculate_user_debts(session=session, group_id=group_id, user_id=debtor_id)
    owed_entry = next((entry for entry in owed_by_user if entry.user_id == creditor_id), None)
    max_allowed = (owed_entry.amount if owed_entry else Decimal("0.00")) + (existing_amount or Decimal("0.00"))
    if amount > max_allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount exceeds outstanding debt")
