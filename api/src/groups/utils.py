from typing import TypeVar

T = TypeVar("T", str, str | None)


def _validate_group_name(value: T) -> T:
    """Validate group name by stripping whitespace and ensuring it's not empty."""
    if value is None:
        return value
    value = value.strip()
    if not value:
        raise ValueError("Group name must not be empty")
    return value
