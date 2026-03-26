import math
from datetime import datetime, timezone
from backend.db.client import supabase

def evaluate_disruptions(hex_ids: list[str]) -> dict:
    """
    Evaluates whether to OPEN or CLOSE disruption events for the given hexes.
    Applies Hysteresis:
    - OPEN if DCI > 0.85 (dci_status == 'disrupted')
    - CLOSE only if DCI <= 0.65 (dci_status == 'normal') for >= 2 consecutive cycles.
    """
    results = {}
    
    if not hex_ids:
        return results

    # Fetch current hex states
    try:
        response = supabase.table('hex_zones').select(
            "hex_id, current_dci, dci_status, consecutive_normal_cycles"
        ).in_('hex_id', hex_ids).execute()
        zones = response.data
    except Exception as e:
        print(f"Failed to fetch hex_zones: {e}")
        return results
        
    for zone in zones:
        hex_id = zone['hex_id']
        dci_status = zone['dci_status']
        cycles = zone.get('consecutive_normal_cycles', 0)
        
        if cycles is None:
            cycles = 0
            
        # Determine if there's an active disruption event for this hex
        try:
            active_events = supabase.table('disruption_events').select("id").eq(
                'hex_id', hex_id
            ).is_('ended_at', 'null').execute().data
        except Exception:
            active_events = []
            
        has_active_event = len(active_events) > 0
        event_id = active_events[0]['id'] if has_active_event else None
        
        now_iso = datetime.now(timezone.utc).isoformat()
        action_taken = None
        new_cycles = cycles
        
        if dci_status == 'disrupted':
            # Reset normal cycles since it's disrupted
            new_cycles = 0
            if not has_active_event:
                # Open an event
                try:
                    supabase.table('disruption_events').insert({
                        "hex_id": hex_id,
                        "started_at": now_iso
                    }).execute()
                    action_taken = "OPENED"
                except Exception as e:
                    print(f"Error opening event: {e}")
                    action_taken = "ERROR"
            else:
                action_taken = "MAINTAINED_OPEN"
                
        elif dci_status == 'normal':
            if has_active_event:
                new_cycles += 1
                if new_cycles >= 2:
                    # Close the event
                    try:
                        supabase.table('disruption_events').update({
                            "ended_at": now_iso
                        }).eq('id', event_id).execute()
                        action_taken = "CLOSED"
                        new_cycles = 0 # reset after closing
                    except Exception as e:
                        print(f"Error closing event: {e}")
                        action_taken = "ERROR"
                else:
                    action_taken = "WAITING_TO_CLOSE"
            else:
                action_taken = "NONE"
                new_cycles = 0 # stay at 0 if no event is active
                
        elif dci_status == 'elevated':
            # If elevated, it doesn't trigger an open, and it resets the close counter
            new_cycles = 0
            if has_active_event:
                action_taken = "MAINTAINED_OPEN"
            else:
                action_taken = "NONE"
        else:
            action_taken = "NONE"
            new_cycles = 0

        # Update the consecutive tracker if changed
        if new_cycles != cycles:
            try:
                supabase.table('hex_zones').update({
                    "consecutive_normal_cycles": new_cycles
                }).eq('hex_id', hex_id).execute()
            except Exception as e:
                print(f"Error updating cycles: {e}")
                
        results[hex_id] = {
            "action": action_taken,
            "consecutive_normal_cycles": new_cycles
        }
        
    return results
