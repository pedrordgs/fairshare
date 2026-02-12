from decimal import Decimal, ROUND_UP


def quantize_currency(value: Decimal) -> Decimal:
    """Normalize currency to 2 decimal places, rounding up."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_UP)
