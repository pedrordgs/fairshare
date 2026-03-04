from decimal import Decimal, ROUND_UP
from typing import Annotated

from pydantic import Field

PRICING_DECIMAL_PLACES = 2


def quantize_currency(value: Decimal) -> Decimal:
    """Normalize currency to 2 decimal places, rounding up."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_UP)


PositiveDecimal = Annotated[Decimal, Field(ge=0)]
