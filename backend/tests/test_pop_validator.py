import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from backend.services.pop_validator import validate_pop

@patch("backend.services.pop_validator.supabase")
def test_validate_pop_worker_present(mock_supabase):
    """Worker has exactly 3 pings in the disrupted hex within 90 min -> present=True"""
    disruption_start = datetime.now(timezone.utc)
    
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {"hex_id": "89618928cajff"},
        {"hex_id": "89618928cajff"},
        {"hex_id": "89618928cajff"}
    ]
    
    # Mocking the Supabase chain
    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value = mock_execute
    
    res = validate_pop("worker-123", "89618928cajff", disruption_start)
    assert res['present'] is True
    assert res['ping_count'] == 3
    assert res['zone_hop_flag'] is False

@patch("backend.services.pop_validator.supabase")
def test_validate_pop_worker_below_threshold(mock_supabase):
    """Worker has 2 pings in the disrupted hex -> present=False"""
    disruption_start = datetime.now(timezone.utc)
    
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [
        {"hex_id": "89618928cajff"},
        {"hex_id": "89618928cajff"}
    ]
    
    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value = mock_execute
    res = validate_pop("worker-123", "89618928cajff", disruption_start)
    
    assert res['present'] is False
    assert res['ping_count'] == 2
    assert res['zone_hop_flag'] is False

@patch("backend.services.pop_validator.supabase")
def test_validate_pop_zone_hop_detected(mock_supabase):
    """Worker has active pings, but 0 in the disrupted hex -> present=False, zone_hop_flag=True"""
    disruption_start = datetime.now(timezone.utc)
    
    mock_execute = MagicMock()
    # Pings in a totally DIFFERENT hex
    mock_execute.execute.return_value.data = [
        {"hex_id": "89618999ffff"},
        {"hex_id": "89618999ffff"}
    ]
    
    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value = mock_execute
    res = validate_pop("worker-123", "89618928cajff", disruption_start)
    
    assert res['present'] is False
    assert res['ping_count'] == 0
    assert res['zone_hop_flag'] is True
