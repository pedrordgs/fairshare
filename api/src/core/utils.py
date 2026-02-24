import base64
import hmac
import hashlib


def sign_value(value: str, secret_key: str) -> str:
    signature = hmac.new(secret_key.encode(), value.encode(), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{value}.{signed}"


def verify_signed_value(signed_value: str, secret_key: str) -> str | None:
    try:
        value, signature_b64 = signed_value.rsplit(".", 1)
        signature_b64 = signature_b64 + "=" * (4 - len(signature_b64) % 4)
        signature = base64.urlsafe_b64decode(signature_b64)
        expected_sig = hmac.new(secret_key.encode(), value.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        return value
    except Exception:
        return None
