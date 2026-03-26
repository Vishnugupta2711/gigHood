import logging
from backend.db.client import supabase
from backend.services.policy_manager import renew_policy
from backend.services.payment_service import debit_premium_mock

logger = logging.getLogger("api")

def run_monday_policy_cycle():
    """
    Executed dynamically strictly on Mondays 00:00.
    1. Grabs all active workers.
    2. Renews their risk policy bounds checking the physical XGBoost model for current tier mappings.
    3. Calculates raw rupee premium amounts.
    4. Triggers the Razorpay Debit securely withdrawing from their wallet.
    """
    logger.info("Initializing Weekly Monday 00:00 Policy Cycle...")
    
    # 1. Grabs all active workers securely
    try:
        workers_res = supabase.table('workers').select('id, name, upi_id').eq('status', 'active').execute()
        if not workers_res.data:
            logger.info("No active workers in database. Skipping cycle.")
            return
            
        success_count = 0
            
        for worker in workers_res.data:
             worker_id = worker['id']
             upi = worker['upi_id']
             
             # 2. Renew their structural bounds
             try:
                 new_policy = renew_policy(worker_id)
                 if new_policy:
                     premium = new_policy.get('weekly_premium', 0.0)
                     
                     # 3/4. Run automatic Debit process mimicking Razorpay mandates 
                     debit_premium_mock(upi, premium, worker_id)
                     success_count += 1
                     
             except Exception as policy_err:
                 logger.error(f"Failed handling Monday Rollover for Worker {worker_id}: {policy_err}")
                 
        logger.info(f"Monday Cycle completed completely terminating. Mapped {success_count} renewed workers.")
        
    except Exception as db_err:
        logger.error(f"Failed fetching active workers during cycle boot: {db_err}")
