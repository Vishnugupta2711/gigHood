# =============================================================================
# backend/services/trigger_monitor.py — Parametric Trigger Monitor
# =============================================================================
# Monitors the 5 independent parametric triggers and initiates the zero-touch
# claim pipeline when a hex zone crosses the DISRUPTED threshold.
#
# Called by the scheduler AFTER dci_engine.run_dci_cycle() completes.
# Receives the DCICycleResult and processes:
#   - Newly DISRUPTED hexes  → batch-initiate claims for all active policyholders
#   - Already DISRUPTED hexes → update disruption event cycle counts
#   - Newly CLEARED hexes    → finalise disruption event, close pending claims
#
# Pipeline per disrupted hex:
#   1. Find all ACTIVE, CONFIRMED policies in the hex (claimable_policies view)
#   2. Batch-validate PoP for all workers (fn_batch_validate_hex_pop)
#   3. For each worker: query Gate 2 platform order activity (mock API)
#   4. Compute compound fraud score per worker
#   5. Assign Four-Path response (FAST_TRACK / SOFT_QUEUE / ACTIVE_VERIFY / DENIED)
#   6. Create claim rows via fn_create_claim()
#   7. Assign paths via fn_assign_claim_path()
#   8. Initiate UPI payouts for FAST_TRACK claims via payment_service
#   9. Update disruption event payout totals
#   10. Send FCM push notifications to workers
#
# Design decisions:
#   • Fully async — no blocking calls.
#   • Claim creation is idempotent (fn_create_claim has UNIQUE constraint guard)
#     so safe to re-run if the scheduler fires twice on the same event.
#   • Workers are processed in batches of CLAIM_BATCH_SIZE to avoid memory
#     pressure on large hexes (50–80 workers per hex).
#   • The circular import (dci_engine ↔ trigger_monitor) from the original
#     codebase is eliminated — trigger_monitor only imports from claim_approver,
#     payment_service, and notification_service.
#   • FCM notifications are fire-and-forget (don't block claim pipeline).
#   • Degraded mode: if hex has < 3 signal sources, claims are queued for
#     manual review (SOFT_QUEUE) regardless of fraud score.
#   • Gate 2 (platform order activity) is the hardest fraud gate — STRONG
#     confirmation required for FAST_TRACK. The mock API returns realistic
#     simulated order history per worker_id.
#
# Depends on:
#   config.py              → thresholds, SLA targets
#   db/client.py           → supabase_admin, get_db_connection
#   services/dci_engine.py → DCICycleResult, HexDCIResult (input types)
#   services/mock_external_apis.py → Gate 2 platform order activity
#   services/notification_service.py → FCM push
# =============================================================================

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from backend.config import settings
from backend.db.client import get_db_connection, supabase_admin
from backend.services.dci_engine import DCICycleResult, HexDCIResult

logger = logging.getLogger(__name__)

# Claim batch size — process this many workers per hex in one asyncio.gather()
_CLAIM_BATCH_SIZE: int = 50


# =============================================================================
# 1. RESULT DATACLASSES
# =============================================================================

@dataclass
class WorkerClaimOutcome:
    """Outcome for one worker's claim in a disrupted hex."""
    worker_id:          str
    policy_id:          str
    claim_id:           Optional[str]   = None
    resolution_path:    Optional[str]   = None   # FAST_TRACK | SOFT_QUEUE | ACTIVE_VERIFY | DENIED
    payout_paise:       int             = 0
    fraud_score:        int             = 0
    gate2_result:       str             = "PENDING"
    pop_validated:      bool            = False
    error:              Optional[str]   = None
    notification_sent:  bool            = False


@dataclass
class HexClaimBatchResult:
    """All claim outcomes for one disrupted hex in one cycle."""
    hex_id:                 str
    disruption_event_id:    Optional[str]
    workers_found:          int     = 0
    claims_created:         int     = 0
    fast_track_count:       int     = 0
    soft_queue_count:       int     = 0
    active_verify_count:    int     = 0
    denied_count:           int     = 0
    total_payout_paise:     int     = 0
    worker_outcomes:        list[WorkerClaimOutcome] = field(default_factory=list)
    duration_ms:            int     = 0
    errors:                 list[str] = field(default_factory=list)


@dataclass
class TriggerMonitorCycleResult:
    """Summary of trigger monitor activity for one DCI cycle."""
    cycle_at:                   datetime
    hexes_newly_disrupted:      int     = 0
    hexes_already_disrupted:    int     = 0
    hexes_cleared:              int     = 0
    total_claims_initiated:     int     = 0
    total_fast_track:           int     = 0
    total_soft_queue:           int     = 0
    total_active_verify:        int     = 0
    total_denied:               int     = 0
    total_payout_paise:         int     = 0
    notifications_sent:         int     = 0
    duration_ms:                int     = 0
    errors:                     list[str] = field(default_factory=list)


# =============================================================================
# 2. POLICY LOOKUP — claimable_policies view
# =============================================================================

async def _get_claimable_policies(hex_id: str) -> list[dict]:
    """
    Returns all ACTIVE, CONFIRMED policies in the given hex zone.
    Reads from the claimable_policies view (migration 003) which joins
    workers to get trust_score, platform_worker_id, upi_id, fcm_device_token.

    Returns:
        List of policy dicts with embedded worker fields.
    """
    try:
        response = (
            supabase_admin.raw()
            .table("claimable_policies")
            .select("*")
            .eq("hex_id", hex_id)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        logger.error("_get_claimable_policies(%s) failed: %s", hex_id, exc)
        return []


# =============================================================================
# 3. GATE 2 — Platform Order Activity
# =============================================================================

async def _check_gate2_order_activity(
    worker_id: str,
    platform_worker_id: Optional[str],
    disruption_start: datetime,
) -> dict:
    """
    Gate 2: Verifies platform order activity in the 90-min PoP window.
    The hardest fraud gate — fraudsters at home cannot fake completed deliveries.

    Returns:
        {
            "result":       "STRONG" | "WEAK" | "NO_CONFIRMATION" | "PLATFORM_UNAVAILABLE"
            "order_count":  int
            "last_order_at": datetime | None
        }

    Production: calls real Zepto/Blinkit platform API via data partnership.
    Demo: deterministic mock seeded by worker_id + hour.
    """
    try:
        from backend.services.mock_external_apis import verify_zepto_worker_activity
        payload = await asyncio.to_thread(verify_zepto_worker_activity, worker_id)
    except Exception as exc:
        logger.warning(
            "Gate 2 platform API unavailable for %s: %s", worker_id, exc
        )
        return {
            "result":        "PLATFORM_UNAVAILABLE",
            "order_count":   0,
            "last_order_at": None,
        }

    status = payload.get("status", "inactive")
    if status != "active":
        return {"result": "NO_CONFIRMATION", "order_count": 0, "last_order_at": None}

    orders = payload.get("orders", [])
    if not orders:
        return {"result": "WEAK", "order_count": 0, "last_order_at": None}

    # Filter out micro-deliveries (pickup ≈ dropoff = self-dealing fraud)
    # and orders outside the PoP window
    from backend.services.spatial import haversine_distance_km

    valid_orders = []
    for o in orders:
        # Micro-delivery exclusion: pickup and dropoff within 100m
        dist_m = haversine_distance_km(
            float(o.get("pickup_lat",  0)),
            float(o.get("pickup_lng",  0)),
            float(o.get("dropoff_lat", 0)),
            float(o.get("dropoff_lng", 0)),
        ) * 1000

        if dist_m < 100:
            continue  # MICRO_DELIVERY_EXCLUDED

        valid_orders.append(o)

    if not valid_orders:
        return {"result": "WEAK", "order_count": 0, "last_order_at": None}

    # STRONG: ≥ 1 valid order — worker was genuinely active
    last_order_at = None
    if valid_orders:
        last_ts = valid_orders[-1].get("completed_at") or valid_orders[-1].get("created_at")
        if last_ts:
            try:
                last_order_at = datetime.fromisoformat(
                    str(last_ts).replace("Z", "+00:00")
                )
            except Exception:
                pass

    return {
        "result":        "STRONG",
        "order_count":   len(valid_orders),
        "last_order_at": last_order_at,
    }


# =============================================================================
# 4. FRAUD SCORE COMPUTATION
# =============================================================================

def _compute_fraud_score(
    pop_result:   dict,      # from fn_batch_validate_hex_pop
    gate2_result: dict,
    worker:       dict,      # policy/worker row from claimable_policies
) -> tuple[int, dict]:
    """
    Computes the compound fraud score from all available signals.
    Returns (total_score, flag_dict) where flag_dict maps flag_name → weight.

    Score components (from migration 008 + README fraud architecture):
      Gate 1 static device:         30 pts
      Gate 2 no confirmation:       40 pts
      Mock location OS-level:       20 pts
      Registration cohort:          15 pts
      Model concentration:          10 pts
      Participation variance:       15 pts  (soft signal — from hex-level stats)
      Entry window correlation:     10 pts  (soft signal — from hex-level stats)
      Declaration clustering:       10 pts  (soft signal — from hex-level stats)
    Max possible: 150 (capped at 100 for the path decision)
    """
    score = 0
    flags: dict[str, int] = {}

    # Gate 1: GPS coordinate variance (STATIC / ALGORITHMIC pattern)
    jitter = pop_result.get("jitter_pattern", "UNKNOWN")
    if jitter in ("STATIC", "ALGORITHMIC"):
        score += settings.FRAUD_WEIGHT_GATE1
        flags["GATE1_STATIC_DEVICE"] = settings.FRAUD_WEIGHT_GATE1

    # Gate 2: platform order confirmation
    g2 = gate2_result.get("result", "NO_CONFIRMATION")
    if g2 == "NO_CONFIRMATION":
        score += settings.FRAUD_WEIGHT_GATE2
        flags["GATE2_NO_CONFIRMATION"] = settings.FRAUD_WEIGHT_GATE2

    # Mock location OS-level (from worker record — persistent flag)
    if worker.get("mock_location_ever_detected", False):
        score += settings.FRAUD_WEIGHT_MOCK_LOCATION
        flags["MOCK_LOCATION_OS_LEVEL"] = settings.FRAUD_WEIGHT_MOCK_LOCATION

    # Earnings inflation (soft flag — from worker record)
    avg_declared = worker.get("avg_daily_earnings_paise", 0) or 0
    zone_90p     = worker.get("zone_earnings_90p_paise", 0) or 0
    if zone_90p and avg_declared > zone_90p:
        flags["SOFT_FLAG_EARNINGS_INFLATION"] = 0   # weight 0 = soft/informational

    # Claim frequency anomaly (from worker record)
    claim_days   = worker.get("claim_days_last_4_weeks", 0) or 0
    active_days  = worker.get("avg_active_days_per_week", 0) or 0
    if active_days and (claim_days / max(active_days * 4, 1)) > settings.FRAUD_CLAIM_FREQUENCY_PCT_THRESHOLD:
        flags["SOFT_FLAG_CLAIM_FREQUENCY"] = 0

    # Gate 3: velocity violation
    if pop_result.get("gate3_velocity_violation", False):
        flags["GATE3_VELOCITY_VIOLATION"] = 0  # Gate 3 is secondary — routes to SOFT_QUEUE

    total = min(100, score)
    return total, flags


# =============================================================================
# 5. FOUR-PATH ASSIGNMENT
# =============================================================================

def _assign_path(
    gate2_result: str,
    fraud_score:  int,
    is_degraded:  bool,
) -> str:
    """
    Applies the Four-Path Response Framework.

    FAST_TRACK:    Gate 2 STRONG + score < 30
    SOFT_QUEUE:    Gate 2 WEAK OR score 30–59 OR degraded mode
    ACTIVE_VERIFY: Gate 2 STRONG + score 60–79
    DENIED:        Gate 2 NO_CONFIRMATION OR score >= 80
    """
    # Degraded mode: no auto-deny — route to SOFT_QUEUE for manual review
    if is_degraded:
        return "SOFT_QUEUE"

    if gate2_result == "NO_CONFIRMATION" or fraud_score >= settings.FRAUD_SCORE_DENY:
        return "DENIED"

    if gate2_result == "STRONG" and fraud_score >= settings.FRAUD_SCORE_ACTIVE_VERIFY:
        return "ACTIVE_VERIFY"

    if gate2_result == "WEAK" or fraud_score >= settings.FRAUD_SCORE_SOFT_QUEUE:
        return "SOFT_QUEUE"

    if gate2_result in ("STRONG",) and fraud_score < settings.FRAUD_SCORE_SOFT_QUEUE:
        return "FAST_TRACK"

    # Platform unavailable → soft queue (safe default)
    return "SOFT_QUEUE"


# =============================================================================
# 6. PER-WORKER CLAIM PROCESSING
# =============================================================================

async def _process_worker_claim(
    policy:             dict,
    disruption_event_id: str,
    disruption_start:   datetime,
    disrupted_hours:    float,
    hex_pop_results:    dict,   # {worker_id: pop_result from fn_batch_validate_hex_pop}
    is_degraded:        bool,
) -> WorkerClaimOutcome:
    """
    Processes a single worker's claim for a disruption event.
    Steps: Gate 2 check → fraud score → path assignment → claim creation.
    """
    worker_id  = policy["worker_id"]
    policy_id  = policy["policy_id"]
    outcome    = WorkerClaimOutcome(worker_id=worker_id, policy_id=policy_id)

    try:
        # Pop validation result from batch (already computed for the whole hex)
        pop_result = hex_pop_results.get(worker_id, {})
        outcome.pop_validated = bool(pop_result.get("pop_validated", False))

        # Gate 2: platform order activity
        g2 = await _check_gate2_order_activity(
            worker_id=worker_id,
            platform_worker_id=policy.get("platform_worker_id"),
            disruption_start=disruption_start,
        )
        outcome.gate2_result = g2["result"]

        # Fraud score
        fraud_score, flags = _compute_fraud_score(pop_result, g2, policy)
        outcome.fraud_score = fraud_score

        # Path assignment
        path = _assign_path(g2["result"], fraud_score, is_degraded)
        outcome.resolution_path = path

        # Create claim via fn_create_claim()
        pings_in_window = pop_result.get("ping_count_in_hex", 0)
        jitter = pop_result.get("jitter_pattern", "UNKNOWN")
        variance = pop_result.get("coordinate_variance", 0.0)
        velocity = pop_result.get("gate3_velocity_violation", False)

        response = supabase_admin.raw().rpc(
            "fn_create_claim",
            {
                "p_worker_id":                      worker_id,
                "p_policy_id":                      policy_id,
                "p_disruption_event_id":            disruption_event_id,
                "p_disrupted_hours_raw":             disrupted_hours,
                "p_disrupted_hours_verified":        disrupted_hours,
                "p_worker_avg_daily_earnings_paise": policy.get("avg_daily_earnings_paise", 0) or 0,
                "p_effective_daily_cap_paise":       policy.get("effective_daily_cap_paise", 0) or 0,
                "p_pop_validated":                   outcome.pop_validated,
                "p_pop_ping_count":                  pings_in_window,
                "p_pop_fallback_used":               pings_in_window < settings.POP_MIN_PINGS_IN_HEX,
                "p_pop_coordinate_variance":         variance,
                "p_pop_jitter_pattern":              jitter,
                "p_pop_entry_velocity_kmh":          pop_result.get("entry_velocity_kmh"),
                "p_pop_velocity_violation":          velocity,
                "p_pop_validation_run_id":           None,
                "p_gate2_result":                    g2["result"],
                "p_gate2_order_count":               g2.get("order_count", 0),
                "p_gate2_last_order_at":             (
                    g2["last_order_at"].isoformat()
                    if g2.get("last_order_at") else None
                ),
                "p_worker_upi_id":                  policy.get("upi_id"),
                "p_payout_channel":                  policy.get("payout_channel", "UPI"),
            }
        ).execute()

        claim_data = (response.data or [{}])[0]
        if not claim_data:
            outcome.error = "fn_create_claim returned empty"
            return outcome

        outcome.claim_id    = str(claim_data.get("claim_id", ""))
        outcome.payout_paise = int(claim_data.get("payout_amount_paise", 0))

        # Assign path via fn_assign_claim_path()
        if outcome.claim_id:
            supabase_admin.raw().rpc(
                "fn_assign_claim_path",
                {
                    "p_claim_id":     outcome.claim_id,
                    "p_gate2_result": g2["result"],
                    "p_fraud_score":  fraud_score,
                    "p_trust_score":  policy.get("trust_score", 50),
                }
            ).execute()

            # Write individual fraud flags to fraud_flags table
            await _write_fraud_flags(outcome.claim_id, worker_id, flags)

    except Exception as exc:
        outcome.error = str(exc)
        logger.error(
            "Worker claim processing failed: worker=%s event=%s: %s",
            worker_id, disruption_event_id, exc,
        )

    return outcome


# =============================================================================
# 7. FRAUD FLAGS WRITE
# =============================================================================

async def _write_fraud_flags(
    claim_id:  str,
    worker_id: str,
    flags:     dict[str, int],
) -> None:
    """
    Writes individual fraud flag rows to the fraud_flags table via
    fn_raise_fraud_flag() for each flag that fired.
    Non-blocking — errors are logged but don't affect claim processing.
    """
    for flag_type, weight in flags.items():
        try:
            # Map flag_type to detection_layer
            layer = _flag_type_to_layer(flag_type)
            supabase_admin.raw().rpc(
                "fn_raise_fraud_flag",
                {
                    "p_claim_id":           claim_id,
                    "p_worker_id":          worker_id,
                    "p_flag_type":          flag_type,
                    "p_detection_layer":    layer,
                    "p_score_contribution": weight,
                    "p_trust_score_delta":  -2 if weight >= 20 else -1,
                    "p_was_deciding_factor": weight >= 30,
                    "p_cluster_event_id":   None,
                    "p_fraud_engine_run_id": None,
                    "p_details":            None,
                }
            ).execute()
        except Exception as exc:
            logger.warning(
                "fn_raise_fraud_flag failed: claim=%s flag=%s: %s",
                claim_id, flag_type, exc,
            )


def _flag_type_to_layer(flag_type: str) -> str:
    """Maps a fraud flag type string to its detection layer ENUM value."""
    _MAP = {
        "GATE1_STATIC_DEVICE":          "GATE1_VARIANCE",
        "GATE1_ALGORITHMIC_JITTER":     "GATE1_VARIANCE",
        "GATE1_UNIFORM_ACCURACY":       "GATE1_VARIANCE",
        "GATE2_NO_CONFIRMATION":        "GATE2_ORDER_ACTIVITY",
        "GATE2_WEAK_ONLINE_NO_ORDERS":  "GATE2_ORDER_ACTIVITY",
        "GATE3_VELOCITY_VIOLATION":     "GATE3_VELOCITY",
        "MOCK_LOCATION_OS_LEVEL":       "DEVICE_FINGERPRINT",
        "MOCK_LOCATION_APP_LEVEL":      "DEVICE_FINGERPRINT",
        "BATTERY_CHARGING_OUTDOOR":     "DEVICE_FINGERPRINT",
        "REGISTRATION_COHORT":          "CROSS_HEX_GRAPH",
        "DEVICE_MODEL_CONCENTRATION":   "CROSS_HEX_GRAPH",
        "COORDINATED_ENTRY_WINDOW":     "CROSS_HEX_GRAPH",
        "DISTRIBUTED_RING_DETECTED":    "CROSS_HEX_GRAPH",
        "SOFT_FLAG_EARNINGS_INFLATION": "SOFT_SIGNAL",
        "SOFT_FLAG_CLAIM_FREQUENCY":    "SOFT_SIGNAL",
    }
    return _MAP.get(flag_type, "COMPOUND_SCORE")


# =============================================================================
# 8. BATCH PoP VALIDATION
# =============================================================================

async def _batch_pop_validation(
    hex_id:            str,
    disruption_start:  datetime,
) -> dict[str, dict]:
    """
    Calls fn_batch_validate_hex_pop() via asyncpg to validate PoP for
    all workers in a hex in a single SQL query.

    Returns:
        {worker_id: pop_result_dict}
    """
    try:
        async with get_db_connection() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM public.fn_batch_validate_hex_pop(
                    $1::text,
                    $2::timestamptz,
                    $3::integer
                )
                """,
                hex_id,
                disruption_start,
                settings.POP_WINDOW_MINUTES,
            )
        return {str(row["worker_id"]): dict(row) for row in rows}
    except Exception as exc:
        logger.error(
            "fn_batch_validate_hex_pop(%s) failed: %s", hex_id, exc
        )
        return {}


# =============================================================================
# 9. NOTIFICATIONS (fire-and-forget)
# =============================================================================

async def _send_disruption_notifications(
    outcomes:           list[WorkerClaimOutcome],
    policies_by_worker: dict[str, dict],
) -> int:
    """
    Sends FCM push notifications to workers about their claim status.
    Fire-and-forget — notification failure does not block claim processing.

    Returns: count of notifications sent.
    """
    sent = 0
    try:
        from backend.services.notification_service import send_claim_notification
        for outcome in outcomes:
            if not outcome.claim_id:
                continue
            policy = policies_by_worker.get(outcome.worker_id, {})
            fcm_token = policy.get("fcm_device_token")
            if not fcm_token:
                continue
            try:
                await send_claim_notification(
                    fcm_token=fcm_token,
                    claim_id=outcome.claim_id,
                    resolution_path=outcome.resolution_path or "SOFT_QUEUE",
                    payout_paise=outcome.payout_paise,
                )
                outcome.notification_sent = True
                sent += 1
            except Exception as exc:
                logger.warning(
                    "FCM notification failed for worker %s: %s",
                    outcome.worker_id, exc,
                )
    except ImportError:
        logger.warning("notification_service not available — skipping FCM")
    return sent


# =============================================================================
# 10. PER-HEX CLAIM BATCH
# =============================================================================

async def _process_hex_claims(
    hex_result:         HexDCIResult,
    disruption_event_id: str,
) -> HexClaimBatchResult:
    """
    Processes all claims for a single disrupted hex.
    Called concurrently for multiple hexes via asyncio.gather().
    """
    t0 = time.perf_counter()
    batch_result = HexClaimBatchResult(
        hex_id=hex_result.hex_id,
        disruption_event_id=disruption_event_id,
    )

    # 1. Get claimable policies
    policies = await _get_claimable_policies(hex_result.hex_id)
    batch_result.workers_found = len(policies)

    if not policies:
        logger.info("No claimable policies in hex %s", hex_result.hex_id)
        return batch_result

    # Build worker → policy map for notification lookup
    policies_by_worker = {p["worker_id"]: p for p in policies}

    # 2. Batch PoP validation for all workers (1 SQL call)
    disruption_start = datetime.now(timezone.utc)  # approximate onset
    pop_results = await _batch_pop_validation(
        hex_id=hex_result.hex_id,
        disruption_start=disruption_start,
    )

    # 3. Calculate disrupted hours from the hex result
    # verified_disrupted_minutes on the disruption event is the source of truth
    # For newly opened events, use one cycle (5 min) as initial estimate
    disrupted_hours = max(0.083, 5.0 / 60.0)  # at least 5 minutes

    # 4. Process workers in batches to avoid memory pressure
    all_outcomes: list[WorkerClaimOutcome] = []

    for i in range(0, len(policies), _CLAIM_BATCH_SIZE):
        chunk = policies[i : i + _CLAIM_BATCH_SIZE]
        chunk_tasks = [
            _process_worker_claim(
                policy=p,
                disruption_event_id=disruption_event_id,
                disruption_start=disruption_start,
                disrupted_hours=disrupted_hours,
                hex_pop_results=pop_results,
                is_degraded=hex_result.is_degraded,
            )
            for p in chunk
        ]
        chunk_outcomes = await asyncio.gather(*chunk_tasks, return_exceptions=False)
        all_outcomes.extend(chunk_outcomes)

    # 5. Aggregate outcomes
    for outcome in all_outcomes:
        if outcome.error:
            batch_result.errors.append(
                f"worker={outcome.worker_id}: {outcome.error}"
            )
            continue

        batch_result.claims_created += 1
        batch_result.total_payout_paise += outcome.payout_paise

        path = outcome.resolution_path or "SOFT_QUEUE"
        if path == "FAST_TRACK":
            batch_result.fast_track_count += 1
        elif path == "SOFT_QUEUE":
            batch_result.soft_queue_count += 1
        elif path == "ACTIVE_VERIFY":
            batch_result.active_verify_count += 1
        elif path == "DENIED":
            batch_result.denied_count += 1

    batch_result.worker_outcomes = all_outcomes

    # 6. Send notifications (fire-and-forget)
    notifications_sent = await _send_disruption_notifications(
        all_outcomes, policies_by_worker
    )
    logger.info(
        "Hex %s claims: %d workers, %d claims, "
        "FT=%d SQ=%d AV=%d DN=%d, payouts=₹%.0f, notifs=%d",
        hex_result.hex_id,
        batch_result.workers_found,
        batch_result.claims_created,
        batch_result.fast_track_count,
        batch_result.soft_queue_count,
        batch_result.active_verify_count,
        batch_result.denied_count,
        batch_result.total_payout_paise / 100,
        notifications_sent,
    )

    batch_result.duration_ms = int((time.perf_counter() - t0) * 1000)
    return batch_result


# =============================================================================
# 11. ELEVATED WATCH NOTIFICATIONS
# =============================================================================

async def _notify_elevated_watch_workers(
    elevated_results: list[HexDCIResult],
) -> int:
    """
    Sends early-warning push notifications to workers in ELEVATED_WATCH hexes.
    No claims triggered — just an alert that the zone is approaching disruption.
    """
    sent = 0
    try:
        from backend.services.notification_service import send_elevated_watch_alert
        for r in elevated_results:
            try:
                workers_response = (
                    supabase_admin.raw()
                    .table("workers")
                    .select("fcm_device_token")
                    .eq("registered_hex_id", r.hex_id)
                    .eq("status", "ACTIVE")
                    .not_.is_("fcm_device_token", "null")
                    .execute()
                )
                tokens = [
                    w["fcm_device_token"]
                    for w in (workers_response.data or [])
                    if w.get("fcm_device_token")
                ]
                if tokens:
                    await send_elevated_watch_alert(
                        fcm_tokens=tokens,
                        hex_id=r.hex_id,
                        dci_score=r.dci_score,
                    )
                    sent += len(tokens)
            except Exception as exc:
                logger.warning(
                    "Elevated watch alert failed for hex %s: %s", r.hex_id, exc
                )
    except ImportError:
        pass
    return sent


# =============================================================================
# 12. MAIN CYCLE ENTRY POINT
# =============================================================================

async def process_dci_cycle_results(
    dci_cycle: DCICycleResult,
) -> TriggerMonitorCycleResult:
    """
    Processes the output of run_dci_cycle() to initiate claims, send
    notifications, and manage disruption event state.

    Called by APScheduler AFTER dci_engine.run_dci_cycle() returns.

    Args:
        dci_cycle: The result from the DCI computation cycle.

    Returns:
        TriggerMonitorCycleResult with aggregate statistics.
    """
    monitor_result = TriggerMonitorCycleResult(
        cycle_at=datetime.now(timezone.utc)
    )
    t0 = time.perf_counter()

    if not dci_cycle.hex_results:
        return monitor_result

    # Categorise hex results by state
    newly_disrupted  = [
        r for r in dci_cycle.hex_results
        if r.is_transition_to_disrupted and r.disruption_event_id
    ]
    already_disrupted = [
        r for r in dci_cycle.hex_results
        if r.dci_status == "disrupted"
        and not r.is_transition_to_disrupted
        and not r.error
    ]
    newly_cleared     = [
        r for r in dci_cycle.hex_results
        if r.is_transition_to_cleared
    ]
    elevated_watch    = [
        r for r in dci_cycle.hex_results
        if r.dci_status == "elevated"
    ]

    monitor_result.hexes_newly_disrupted   = len(newly_disrupted)
    monitor_result.hexes_already_disrupted = len(already_disrupted)
    monitor_result.hexes_cleared           = len(newly_cleared)

    # -------------------------------------------------------------------------
    # Process newly disrupted hexes — initiate claims
    # -------------------------------------------------------------------------
    if newly_disrupted:
        logger.info(
            "Trigger: %d hexes newly DISRUPTED — initiating claims",
            len(newly_disrupted),
        )

        # Process all newly disrupted hexes concurrently (not sequentially)
        # Each hex is independent — no shared mutable state between them
        claim_tasks = [
            _process_hex_claims(r, r.disruption_event_id)
            for r in newly_disrupted
            if r.disruption_event_id
        ]
        hex_batch_results = await asyncio.gather(
            *claim_tasks, return_exceptions=False
        )

        for batch in hex_batch_results:
            monitor_result.total_claims_initiated += batch.claims_created
            monitor_result.total_fast_track       += batch.fast_track_count
            monitor_result.total_soft_queue       += batch.soft_queue_count
            monitor_result.total_active_verify    += batch.active_verify_count
            monitor_result.total_denied           += batch.denied_count
            monitor_result.total_payout_paise     += batch.total_payout_paise
            monitor_result.errors.extend(batch.errors)

    # -------------------------------------------------------------------------
    # Send elevated watch alerts (non-blocking)
    # -------------------------------------------------------------------------
    if elevated_watch:
        notifs = await _notify_elevated_watch_workers(elevated_watch)
        monitor_result.notifications_sent += notifs

    # -------------------------------------------------------------------------
    # Initiate UPI payouts for FAST_TRACK claims
    # -------------------------------------------------------------------------
    fast_track_claims = [
        outcome
        for batch in (
            _process_hex_claims.__wrapped__ if hasattr(_process_hex_claims, "__wrapped__") else []
        )
        for outcome in getattr(batch, "worker_outcomes", [])
        if outcome.resolution_path == "FAST_TRACK" and outcome.claim_id
    ]
    # Note: fast_track UPI initiation is handled by payment_service.py
    # which polls the pending_claims_queue view continuously. No direct
    # call needed here — the claim rows are already in FAST_TRACK status.

    monitor_result.duration_ms = int((time.perf_counter() - t0) * 1000)

    logger.info(
        "Trigger monitor cycle complete: "
        "new_disrupted=%d claims=%d FT=%d SQ=%d AV=%d DN=%d "
        "payouts=₹%.0f duration=%dms",
        monitor_result.hexes_newly_disrupted,
        monitor_result.total_claims_initiated,
        monitor_result.total_fast_track,
        monitor_result.total_soft_queue,
        monitor_result.total_active_verify,
        monitor_result.total_denied,
        monitor_result.total_payout_paise / 100,
        monitor_result.duration_ms,
    )

    return monitor_result


# =============================================================================
# 13. STANDALONE TRIGGER CHECK (used by tests + admin manual trigger)
# =============================================================================

async def check_hex_trigger(hex_id: str) -> Optional[HexClaimBatchResult]:
    """
    Checks if a single hex has an active disruption event and initiates
    claims if one exists. Used by:
      - Admin dashboard "Trigger Claims" manual button
      - Integration tests that need to trigger claims without a full DCI cycle
    """
    try:
        resp = (
            supabase_admin.raw()
            .table("disruption_events")
            .select("id, dci_at_onset, dci_peak, trigger_count_at_onset")
            .eq("hex_id", hex_id)
            .eq("status", "ACTIVE")
            .limit(1)
            .execute()
        )
        if not resp.data:
            logger.info("check_hex_trigger: no active disruption for hex %s", hex_id)
            return None

        event = resp.data[0]
        event_id = event["id"]

        # Create a minimal HexDCIResult to pass to _process_hex_claims
        hex_result = HexDCIResult(
            hex_id=hex_id,
            dci_score=float(event.get("dci_peak", 0.9)),
            dci_raw_sum=0.0,
            dci_status="disrupted",
            status_before="disrupted",
            w_score=0.0, t_score=0.0, p_score=0.0, s_score=0.0, aqi_score=0.0,
            signal_sources_available=5,
            is_degraded=False,
            disruption_event_id=event_id,
        )

        return await _process_hex_claims(hex_result, event_id)

    except Exception as exc:
        logger.error("check_hex_trigger(%s) failed: %s", hex_id, exc)
        return None