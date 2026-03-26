from fastapi import APIRouter, Request, HTTPException, Header, Depends
import logging
from backend.services.payment_service import handle_payout_webhook
from backend.services.auth_service import get_current_worker
from backend.db.client import supabase

logger = logging.getLogger("api")
router = APIRouter()

@router.get("")
def get_my_claims(worker: dict = Depends(get_current_worker)):
    """
    Returns authentic worker's full claim history dynamically resolving pipeline steps natively.
    """
    worker_id = worker.get("id")
    try:
        res = supabase.table('claims').select('*').eq('worker_id', worker_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    """
    Ingests state change callbacks from Razorpay asynchronously.
    Only allows legitimate signatures confirming a payout process success state.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    is_valid = handle_payout_webhook(payload, x_razorpay_signature)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
    # We only care when payouts succeed fully
    if payload.get("event") == "payout.processed":
        try:
             # Extract the reference ID which we mapped to our internal Claim UUID securely
             payout_entity = payload.get("payload", {}).get("payout", {}).get("entity", {})
             reference_id = payout_entity.get("reference_id")
             
             if reference_id:
                 # Update the Claim status safely to paid
                 logger.info(f"Webhook confirming payout {reference_id} processed. Updating database...")
                 supabase.table('claims').update({
                     "status": "paid"
                 }).eq("id", reference_id).execute()
                 
        except Exception as e:
             logger.error(f"Failed to parse and update database from Razorpay Webhook: {e}")
             
    return {"status": "success"}
