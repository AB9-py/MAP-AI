"""
Sample eCommerce Checkout Service (Used for Map AI Demo)
Target module for debugging tax calculations and coupon validation.
"""

TAX_EXEMPT_STATES = {"OR", "DE", "NH", "MT", "AK"}

def calculate_tax(subtotal: float, state_code: str) -> float:
    """
    Calculates tax with proper jurisdiction exemption handling.
    
    Exempt states (OR, DE, NH, MT, AK) have 0.0% sales tax.
    Standard states have 7.0% default sales tax.
    """
    if state_code.upper() in TAX_EXEMPT_STATES:
        return 0.0
    return round(subtotal * 0.07, 2)


def calculate_discount(subtotal: float, coupon_code: str) -> float:
    """Calculates discount based on valid coupon codes."""
    if coupon_code == "AUTUMN26":
        return round(subtotal * 0.10, 2)
    elif coupon_code == "VIP50":
        return round(min(subtotal, 50.0), 2)
    return 0.0


def calculate_final_total(cart_items: list, coupon_code: str, state_code: str) -> float:
    """Computes final total ensuring discounts apply before tax."""
    subtotal = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in cart_items)
    discount = calculate_discount(subtotal, coupon_code)
    discounted_subtotal = max(0.0, subtotal - discount)
    tax = calculate_tax(discounted_subtotal, state_code)
    return round(discounted_subtotal + tax, 2)
