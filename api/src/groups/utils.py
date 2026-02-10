import secrets
from typing import TypeVar

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
