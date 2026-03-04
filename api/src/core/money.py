from decimal import Decimal, ROUND_UP
from typing import Annotated

from pydantic import AfterValidator


def quantize_currency(value: Decimal) -> Decimal:
    """Normalize currency to 2 decimal places, rounding up."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_UP)


def _validate_price(value: Decimal) -> Decimal:
    if value <= Decimal("0"):
        raise ValueError("Price must be greater than zero")
    return quantize_currency(value)


Price = Annotated[Decimal, AfterValidator(_validate_price)]
