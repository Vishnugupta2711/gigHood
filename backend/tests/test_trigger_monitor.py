import pytest
from unittest.mock import patch, MagicMock

import backend.services.trigger_monitor as tm

@patch("backend.services.trigger_monitor.supabase")
@patch("backend.services.trigger_monitor._open_disruption_event")
@patch("backend.services.trigger_monitor._close_disruption_event")
def test_hysteresis_logic(mock_close, mock_open, mock_supabase):
    """
    Test hysteresis:
    - sequence [0.87, 0.82, 0.91, 0.61, 0.60]
    - First 0.87 creates an event (is_disrupted=False)
    - 0.82 keeps it open
    - 0.91 resets consecutive_normal_cycles keeping it open
    - 0.61 increments consecutive_normal_cycles (now 1)
    - 0.60 increments it again (now 2) -> closes the event
    """
    # Helper to simulate the loop
    def simulate_cycle(new_dci, is_disrupted, cycles):
        mock_res = MagicMock()
        mock_res.data = [{
            'is_disrupted': is_disrupted,
            'consecutive_normal_cycles': cycles
        }]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_res
        
        tm.check_trigger_transitions("hex_123", new_dci)
        
    # Cycle 1: 0.87
    simulate_cycle(0.87, False, 0)
    mock_open.assert_called_with("hex_123", 0.87)
    mock_close.assert_not_called()
    
    # Cycle 2: 0.82 (threshold elevated but not <0.65 to drop, waits in disrupted)
    # wait, dci = 0.82. Is it < 0.65? No. So it goes to else block.
    mock_open.reset_mock()
    simulate_cycle(0.82, True, 0)
    mock_open.assert_not_called()
    mock_close.assert_not_called()
    
    # Cycle 3: 0.91
    simulate_cycle(0.91, True, 0)
    mock_close.assert_not_called()

    # Cycle 4: 0.61 (First drop < 0.65)
    simulate_cycle(0.61, True, 0)
    mock_close.assert_not_called()
    
    # Cycle 5: 0.60 (Second drop < 0.65)
    # the state would have `consecutive_normal_cycles` = 1 from previous simulation
    simulate_cycle(0.60, True, 1)
    mock_close.assert_called_once_with("hex_123")
