from fastapi import APIRouter, Depends, HTTPException
from backend.services.auth_service import get_current_worker
from backend.services.policy_manager import create_policy
from backend.db.client import supabase

router = APIRouter()

@router.post("/create")
def register_for_policy(worker: dict = Depends(get_current_worker)):
    """
    Onboards the authenticated worker physically tracking their spatial risk to issue 
    their first 7-day initial policy securely bounded by ML limits.
    """
    worker_id = worker.get("id")
    if not worker_id:
        raise HTTPException(status_code=401, detail="Worker ID missing from context.")
        
    # Prevent creating duplicate active policies if one is already active 
    existing = supabase.table('policies').select('id').eq('worker_id', worker_id).eq('status', 'active').execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Worker already possesses an active policy limit.")
        
    try:
        policy_res = create_policy(worker_id)
        return {"message": "Policy safely engineered and issued.", "policy": policy_res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
