import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.checkout import calculate_tax, calculate_discount, calculate_final_total

def test_cart_total_basic():
    items = [{"price": 10.0, "quantity": 2}, {"price": 5.0, "quantity": 1}]
    total = calculate_final_total(items, "", "CA")
    assert total == 26.75  # $25 + 7% tax ($1.75)

def test_coupon_autumn26():
    items = [{"price": 100.0, "quantity": 1}]
    total = calculate_final_total(items, "AUTUMN26", "CA")
    assert total == 96.30  # $90 + 7% tax ($6.30)

def test_tax_standard_ca():
    assert calculate_tax(100.0, "CA") == 7.00
    assert calculate_tax(50.0, "NY") == 3.50

def test_tax_exempt_states_or_de():
    # Oregon, Delaware, New Hampshire, Montana, Alaska have 0% sales tax
    assert calculate_tax(100.0, "OR") == 0.00
    assert calculate_tax(100.0, "DE") == 0.00
    assert calculate_tax(100.0, "NH") == 0.00
    assert calculate_tax(100.0, "MT") == 0.00
    assert calculate_tax(100.0, "AK") == 0.00

def test_negative_cart_rejection():
    items = [{"price": 20.0, "quantity": 1}]
    total = calculate_final_total(items, "VIP50", "OR")
    assert total == 0.00  # $20 - $50 discount clamped to $0

def test_multi_item_discounts():
    items = [{"price": 15.0, "quantity": 4}]
    discount = calculate_discount(60.0, "AUTUMN26")
    assert discount == 6.00
