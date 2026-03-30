from fastapi import APIRouter
from typing import List, Dict, Any
from datetime import datetime, timezone

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


@router.get("/hex-zones")
async def get_live_hex_zones() -> List[Dict[str, Any]]:
    """
    Returns live H3 hex zones with current DCI scores and status.
    DCI > 0.85 = DISRUPTED, 0.65–0.85 = ELEVATED, ≤0.65 = NORMAL
    """
    return [
        {
            "hex_id": "8928308280fffff",
            "current_dci": 0.91,
            "dci_status": "DISRUPTED",
            "active_worker_count": 42,
            "lat": 12.9716,
            "lng": 77.5946,
        },
        {
            "hex_id": "8928308281fffff",
            "current_dci": 0.74,
            "dci_status": "ELEVATED",
            "active_worker_count": 28,
            "lat": 12.9352,
            "lng": 77.6245,
        },
        {
            "hex_id": "8928308282fffff",
            "current_dci": 0.48,
            "dci_status": "NORMAL",
            "active_worker_count": 89,
            "lat": 12.9121,
            "lng": 77.6446,
        },
        {
            "hex_id": "8928308283fffff",
            "current_dci": 0.88,
            "dci_status": "DISRUPTED",
            "active_worker_count": 15,
            "lat": 13.0012,
            "lng": 77.5900,
        },
        {
            "hex_id": "8928308284fffff",
            "current_dci": 0.62,
            "dci_status": "NORMAL",
            "active_worker_count": 67,
            "lat": 12.9550,
            "lng": 77.6100,
        },
    ]


@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    """
    Returns aggregated claim, payout, fraud, and policy summary for the admin dashboard.
    """
    return {
        "active_policies": 1420,
        "pending_claims": 45,
        "total_payouts_inr": 250000,
        "avg_payout_inr": 580,
        "avg_fraud_score": 0.12,
        "zone_hop_rate": 0.05,
        "mock_location_network_count": 3,
        "loss_ratio": 0.42,
        "disrupted_hex_count": 2,
        "elevated_hex_count": 1,
        "normal_hex_count": 2,
    }


@router.get("/claims")
async def get_recent_claims() -> List[Dict[str, Any]]:
    """
    Returns list of recent claims with resolution path, payout amount, and status.
    Path 1 = Fast Track, Path 2 = Soft Queue, Path 3 = Active Verify, Path 4 = Denied
    """
    return [
        {
            "id": "claim_001",
            "worker_id": "w_123",
            "hex_id": "8928308280fffff",
            "payout_amount": 600,
            "status": "paid",
            "resolution_path": "fast_track",
            "fraud_score": 18,
            "created_at": "2026-03-29T10:00:00Z",
        },
        {
            "id": "claim_002",
            "worker_id": "w_124",
            "hex_id": "8928308283fffff",
            "payout_amount": 420,
            "status": "paid",
            "resolution_path": "soft_queue",
            "fraud_score": 42,
            "created_at": "2026-03-29T09:30:00Z",
        },
        {
            "id": "claim_003",
            "worker_id": "w_125",
            "hex_id": "8928308280fffff",
            "payout_amount": 0,
            "status": "under_review",
            "resolution_path": "active_verify",
            "fraud_score": 78,
            "created_at": "2026-03-29T09:00:00Z",
        },
        {
            "id": "claim_004",
            "worker_id": "w_126",
            "hex_id": "8928308281fffff",
            "payout_amount": 0,
            "status": "denied",
            "resolution_path": "denied",
            "fraud_score": 112,
            "created_at": "2026-03-29T08:45:00Z",
        },
        {
            "id": "claim_005",
            "worker_id": "w_127",
            "hex_id": "8928308283fffff",
            "payout_amount": 700,
            "status": "paid",
            "resolution_path": "fast_track",
            "fraud_score": 10,
            "created_at": "2026-03-29T08:00:00Z",
        },
    ]


@router.get("/events")
async def get_trigger_events() -> List[Dict[str, Any]]:
    """
    Returns real-time log of disruption events from the Trigger Monitor.
    """
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": "event_001",
            "hex_id": "8928308280fffff",
            "dci_peak": 0.91,
            "dci_status": "DISRUPTED",
            "affected_worker_count": 42,
            "duration_minutes": 35,
            "started_at": "2026-03-29T09:25:00Z",
            "closed_at": None,
            "is_active": True,
        },
        {
            "id": "event_002",
            "hex_id": "8928308283fffff",
            "dci_peak": 0.93,
            "dci_status": "DISRUPTED",
            "affected_worker_count": 15,
            "duration_minutes": 20,
            "started_at": "2026-03-29T09:40:00Z",
            "closed_at": None,
            "is_active": True,
        },
        {
            "id": "event_003",
            "hex_id": "8928308281fffff",
            "dci_peak": 0.87,
            "dci_status": "ELEVATED",
            "affected_worker_count": 28,
            "duration_minutes": 60,
            "started_at": "2026-03-29T08:00:00Z",
            "closed_at": "2026-03-29T09:00:00Z",
            "is_active": False,
        },
    ]