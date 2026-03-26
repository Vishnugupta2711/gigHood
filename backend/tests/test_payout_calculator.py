import pytest
from unittest.mock import patch, MagicMock
from backend.services.payout_calculator import calculate_payout, get_4w_avg_payout

def test_payout_calculator_basic_math_no_cap():
    """₹600 earnings × 4 hours = ₹300. Max limits won't cap it."""
    with patch('backend.services.payout_calculator.get_4w_avg_payout', return_value=500.0):
        res = calculate_payout(600.0, 4.0, "A", "worker-1")
        assert res == 300.0

def test_payout_calculator_tier_cap():
    """Tier A cap is ₹600.
    Math: (800 / 8) * 8 = 800.
    Tier A drops it to 600."""
    with patch('backend.services.payout_calculator.get_4w_avg_payout', return_value=800.0):
        # Even with high maturation, Tier A caps at 600
        res = calculate_payout(800.0, 8.0, "A", "worker-1")
        assert res == 600.0

def test_payout_calculator_maturation_cap():
    """Historical average is low (₹100). Maturation cap = 100 * 2.5 = 250.
    Math gives 300. Should cap at 250."""
    with patch('backend.services.payout_calculator.get_4w_avg_payout', return_value=100.0):
        res = calculate_payout(600.0, 4.0, "A", "worker-1")
        assert res == 250.0

@patch("backend.services.payout_calculator.supabase")
def test_get_4w_avg_payout_cold_start(mock_supabase):
    """Empty DB claims array returns 500 flat for generic new workers."""
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = []
    
    # 4 layers of chain: select().eq().eq().gte().execute()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte = mock_execute
    
    # Direct test
    assert get_4w_avg_payout("worker-123") == 500.0
    
    # Maturation cap math
    with patch('backend.services.payout_calculator.get_4w_avg_payout', return_value=500.0):
         # Ask for a massive payout: (2000 / 8) * 6 = 1500.
         # Maturation cap is 500 * 2.5 = 1250 (but Tier C cap is 800)
         # So it caps at 800.
         res = calculate_payout(2000.0, 6.0, "C", "worker-new")
         assert res == 800.0
