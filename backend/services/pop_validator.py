from datetime import datetime, timedelta
import logging
from backend.db.client import supabase

logger = logging.getLogger("api")

def validate_pop(worker_id: str, hex_id: str, disruption_start: datetime) -> dict:
    """
    Validates physical Proof-of-Presence (PoP) for a worker inside a declared disruption zone.
    Requires >= 3 pings within the preceding 90 minutes to safely grant coverage without fraud.
    """
    start_window = disruption_start - timedelta(minutes=90)
    
    # Supabase expects ISO strings for TIMESTAMPTZ comparisons
    start_iso = start_window.isoformat()
    end_iso = disruption_start.isoformat()
    
    # Base response
    result = {
        'present': False,
        'ping_count': 0,
        'zone_hop_flag': False
    }
    
    try:
        # First query all pings for the worker in that time window broadly
        # This helps us differentiate "no pings at all" vs "pinging somewhere else"
        all_pings_res = supabase.table('location_pings') \
            .select('hex_id') \
            .eq('worker_id', worker_id) \
            .gte('pinged_at', start_iso) \
            .lte('pinged_at', end_iso) \
            .execute()
            
        if not all_pings_res.data:
            # Ghosting / Phone Off
            return result
            
        # Count identical hex pings inside the disrupted zone
        valid_pings = [p for p in all_pings_res.data if p.get('hex_id') == hex_id]
        ping_count = len(valid_pings)
        
        result['ping_count'] = ping_count
        
        # Determine strict > 3 PoP tracking presence bounds
        if ping_count >= 3:
            result['present'] = True
        else:
            result['present'] = False
            
            # If they had active pings, but NONE were in the required disrupted hex:
            # This triggers the specific zone hop flag tracking spatial fraud attempts
            if ping_count == 0 and len(all_pings_res.data) > 0:
                result['zone_hop_flag'] = True
                logger.warning(f"PoP Spatial Zone-Hop detected for worker {worker_id}!")
                
    except Exception as e:
        logger.error(f"Failed to aggressively validate PoP for {worker_id}: {e}")
        
    return result
