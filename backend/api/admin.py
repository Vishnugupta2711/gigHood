import traceback
from fastapi import APIRouter, HTTPException
from backend.db.client import supabase

router = APIRouter()

@router.get("/dashboard/kpis")
def get_kpis():
    try:
        # 1. Active policies count
        pol_res = supabase.table('policies').select('id', count='exact').eq('status', 'active').execute()
        active_policies = pol_res.count if pol_res.count is not None else len(pol_res.data)
        
        # 2. Total premium collected
        prem_res = supabase.table('premium_payments').select('amount').execute()
        total_premium = sum(float(p['amount']) for p in prem_res.data) if prem_res.data else 0.0
        
        # 3. Total claims paid
        claims_res = supabase.table('claims').select('payout_amount').eq('status', 'paid').execute()
        total_claims_paid = sum(float(c['payout_amount'] or 0.0) for c in claims_res.data) if claims_res.data else 0.0
        
        # 4. System Loss Ratio
        loss_ratio = (total_claims_paid / total_premium * 100) if total_premium > 0 else 0.0
        
        return {
            "active_policies": active_policies,
            "total_premium": total_premium,
            "total_claims_paid": total_claims_paid,
            "system_loss_ratio": round(loss_ratio, 2)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/zones")
def get_zones():
    try:
        res = supabase.table('hex_zones').select('*').gt('current_dci', 0).execute()
        zones = []
        for z in res.data:
            zones.append({
                "city": z.get('city'),
                "h3_index": z.get('h3_index') or z.get('hex_id'),
                "dci_score": float(z.get('current_dci', 0.0)),
                "status": z.get('dci_status', 'normal')
            })
        return zones
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/risk-forecast")
def get_risk_forecast():
    # Mock data for 7-day predictive risk forecast
    return [
        {"city": "Bengaluru", "risk": 85},
        {"city": "Chennai", "risk": 40},
        {"city": "Mumbai", "risk": 15},
        {"city": "Delhi", "risk": 20},
    ]

@router.get("/dashboard/fraud-queue")
def get_fraud_queue():
    try:
        # Join logic from claims, workers, and fraud_flags
        claims_res = supabase.table('claims').select(
            'id, created_at, status, resolution_path, fraud_score, worker_id'
        ).order('created_at', desc=True).limit(50).execute()
        
        claims_data = claims_res.data or []
        worker_ids = list(set([c['worker_id'] for c in claims_data if c.get('worker_id')]))
        claim_ids = [c['id'] for c in claims_data]
        
        workers_dict = {}
        if worker_ids:
            workers_res = supabase.table('workers').select('id, name, city').in_('id', worker_ids).execute()
            for w in (workers_res.data or []):
                workers_dict[w['id']] = w
                
        flags_dict = {cid: [] for cid in claim_ids}
        if claim_ids:
            flags_res = supabase.table('fraud_flags').select('claim_id, flag_type').in_('claim_id', claim_ids).execute()
            for f in (flags_res.data or []):
                if f['claim_id'] in flags_dict:
                    flags_dict[f['claim_id']].append(f['flag_type'])
                    
        result = []
        for c in claims_data:
            c_worker = workers_dict.get(c['worker_id'], {})
            result.append({
                "claim_id": c['id'],
                "created_at": c['created_at'],
                "worker_name": c_worker.get('name', 'Unknown Worker'),
                "city": c_worker.get('city', 'Unknown City'),
                "status": c.get('status', 'unknown'),
                "resolution_path": c.get('resolution_path', 'unknown'),
                "fraud_score": c.get('fraud_score', 0),
                "flags": flags_dict.get(c['id'], [])
            })
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
