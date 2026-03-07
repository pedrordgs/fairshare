import re

from zxcvbn import zxcvbn

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

UPPERCASE_REGEX = re.compile(r"[A-Z]")
NUMBERS_REGEX = re.compile(r"[0-9]")
SPECIAL_CHAR_REGEX = re.compile(r"[^A-Za-z0-9]")


def validate_password_strength(password: str) -> str:
    """Validate password against strength rules.

    Raises ValidationError with a descriptive message on the first failing rule.
    Returns the password unchanged when all rules pass.

    Args:
        password: The plain-text password to validate.
        user_inputs: Optional list of user-specific strings (e.g. name, email) to
            detect similarity and prevent trivially personalised passwords.
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters long")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_LENGTH} characters long")
    if not UPPERCASE_REGEX.search(password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not NUMBERS_REGEX.search(password):
        raise ValueError("Password must contain at least one digit")
    if not SPECIAL_CHAR_REGEX.search(password):
        raise ValueError("Password must contain at least one special character")

    result = zxcvbn(password)
    if result["score"] < 2:
        warning = result["feedback"].get("warning", "")
        suggestions = result["feedback"].get("suggestions", [])
        detail = warning or (suggestions[0] if suggestions else "Password is too weak or too common")
        raise ValueError(detail)

    return password
