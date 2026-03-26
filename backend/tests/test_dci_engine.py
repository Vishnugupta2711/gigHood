import pytest
import math
from unittest.mock import patch, MagicMock
from backend.services.dci_engine import sigmoid, compute_dci, get_dci_status, run_dci_cycle
from backend.services.trigger_monitor import evaluate_disruptions

def test_sigmoid_values():
    """Verify exact output of the sigmoid boundary function."""
    assert sigmoid(0) == 0.5
    assert math.isclose(sigmoid(2), 0.88079, rel_tol=1e-3)
    assert math.isclose(sigmoid(-2), 0.11920, rel_tol=1e-3)

def test_compute_dci_formula():
    """
    Test exact formula inputs from IMPLEMENTATION.md Section 8.1:
    σ(0.45×1.0 + 0.25×0.8 + 0.20×0.9 + 0.10×0.5) = σ(0.88) ≈ 0.70682
    """
    res = compute_dci(w=1.0, t=0.8, p=0.9, s=0.5)
    assert math.isclose(res, 0.70682, rel_tol=1e-4)

def test_get_dci_status():
    """Validate status definitions based on exact float boundaries."""
    assert get_dci_status(0.60) == 'normal'
    assert get_dci_status(0.65) == 'normal' # <= 0.65 is normal
    assert get_dci_status(0.66) == 'elevated'
    assert get_dci_status(0.85) == 'elevated' # <= 0.85 is elevated
    assert get_dci_status(0.86) == 'disrupted'

@patch("backend.services.dci_engine.supabase")
def test_run_dci_cycle_degraded_mode(mock_supabase):
    """If < 3 signals are available for a hex, the cycle should fail safely to 'normal'."""
    # Mock supabase response to return only 2 signals
    mock_response = MagicMock()
    mock_response.data = [
        {"hex_id": "hex123", "signal_type": "WEATHER", "normalized_score": 0.8},
        {"hex_id": "hex123", "signal_type": "TRAFFIC", "normalized_score": 0.5}
    ]
    
    mock_supabase.table().select().in_().execute.return_value = mock_response
    
    results = run_dci_cycle(["hex123"])
    
    assert "hex123" in results
    assert results["hex123"]["status"] == "degraded (insufficient signals)"
    assert results["hex123"]["dci"] is None

@patch("backend.services.trigger_monitor.supabase")
def test_hysteresis_flapping_sequence(mock_supabase):
    """
    Simulate DCI sequence: [0.87, 0.82, 0.91, 0.61, 0.60]
    This maps to statuses: [disrupted, elevated, disrupted, normal, normal]
    
    We will mock the DB response to cycle through these states and verify `evaluate_disruptions`.
    """
    # Helper to build mock zone response
    def make_zone(status, cycles):
        return [{"hex_id": "hex123", "current_dci": 0.0, "dci_status": status, "consecutive_normal_cycles": cycles}]
        
    def make_event(has_active):
        return [{"id": "ev_123"}] if has_active else []
        
    table_mock = MagicMock()
    mock_supabase.table.return_value = table_mock
    
    # --- Step 1: 0.87 -> disrupted (No active event) -> Expect OPENED
    table_mock.select().in_().execute().data = make_zone('disrupted', 0)
    table_mock.select().eq().is_().execute().data = make_event(False)
    
    res1 = evaluate_disruptions(["hex123"])
    assert res1["hex123"]["action"] == "OPENED"
    assert res1["hex123"]["consecutive_normal_cycles"] == 0
    
    # --- Step 2: 0.82 -> elevated (Has active event) -> Expect MAINTAINED_OPEN, cycles reset
    table_mock.select().in_().execute().data = make_zone('elevated', 0)
    table_mock.select().eq().is_().execute().data = make_event(True)
    
    res2 = evaluate_disruptions(["hex123"])
    assert res2["hex123"]["action"] == "MAINTAINED_OPEN"
    assert res2["hex123"]["consecutive_normal_cycles"] == 0

    # --- Step 3: 0.91 -> disrupted (Has active event) -> Expect MAINTAINED_OPEN, cycles reset
    table_mock.select().in_().execute().data = make_zone('disrupted', 0)
    table_mock.select().eq().is_().execute().data = make_event(True)
    
    res3 = evaluate_disruptions(["hex123"])
    assert res3["hex123"]["action"] == "MAINTAINED_OPEN"
    assert res3["hex123"]["consecutive_normal_cycles"] == 0

    # --- Step 4: 0.61 -> normal (Has active event) -> Expect WAITING_TO_CLOSE, cycles = 1
    table_mock.select().in_().execute().data = make_zone('normal', 0)
    table_mock.select().eq().is_().execute().data = make_event(True)
    
    res4 = evaluate_disruptions(["hex123"])
    assert res4["hex123"]["action"] == "WAITING_TO_CLOSE"
    assert res4["hex123"]["consecutive_normal_cycles"] == 1

    # --- Step 5: 0.60 -> normal (Has active event, cycles=1) -> Expect CLOSED, cycles reset to 0
    table_mock.select().in_().execute().data = make_zone('normal', 1)
    table_mock.select().eq().is_().execute().data = make_event(True)
    
    res5 = evaluate_disruptions(["hex123"])
    assert res5["hex123"]["action"] == "CLOSED"
    assert res5["hex123"]["consecutive_normal_cycles"] == 0
