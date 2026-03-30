from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)

@router.get("/hex-zones")
async def get_live_hex_zones() -> List[Dict[str, Any]]:
    """
    Returns live H3 hex zones with current DCI scores.
    """
    return [
        {"h3_index": "8a283082a677fff", "dci_score": 0.88, "status": "DISRUPTED"},
        {"h3_index": "8a283082a677ffe", "dci_score": 0.72, "status": "ELEVATED"},
        {"h3_index": "8a283082a677ffd", "dci_score": 0.45, "status": "NORMAL"}
    ]

@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    """
    Returns aggregate stats for policies, claims, and payouts.
    """
    return {
        "active_policies": 1420,
        "pending_claims": 45,
        "total_payouts_inr": 250000,
        "avg_fraud_score": 0.12
    }