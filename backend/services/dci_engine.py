# =============================================================================
# backend/services/dci_engine.py — Demand Collapse Index Engine
# =============================================================================
# Computes the DCI for every active H3 hex zone every 5 minutes.
# Called by APScheduler on DCI_JOB_CRON_MINUTE (offset from signal job).
#
# Pipeline per cycle:
#   1. Batch-fetch all signal scores via fn_get_hex_signals() (single SQL call)
#   2. For each hex: compute DCI = σ(α·W + β·T + γ·P + δ·S)
#   3. Detect state transition (NORMAL → DISRUPTED etc.) with hysteresis
#   4. Write DCI record to dci_history via fn_insert_dci_record()
#   5. Update hex_zones.current_dci + dci_status via fn_bulk_update_hex_dci()
#   6. On DISRUPTED transition: open disruption event, hand off to trigger_monitor
#   7. On CLEARED transition: close disruption event
#
# Design decisions:
#   • Fully async — no time.sleep(), no asyncio.run() inside sync functions.
#   • fn_get_hex_signals() fetches ALL hex signals in ONE asyncpg round-trip
#     (not N Supabase REST calls). At 150 hexes this saves ~149 HTTP round-trips.
#   • fn_bulk_update_hex_dci() updates ALL hex_zones in ONE asyncpg call with
#     array parameters. The DB triggers fire per-row (recompute_dci →
#     sync_dci_status with hysteresis) so hysteresis state machine runs in SQL.
#   • fn_insert_dci_record() is called per-hex (not bulk) because it needs to
#     return the transition flag per hex to drive disruption event management.
#   • AQI is combined with Weather into the W composite score:
#     W_combined = W_weather + W_aqi. Both reach 1.0 at their trigger threshold.
#     Extreme AQI + moderate rain → W > 1.5 → sigmoid correctly maps to ~0.99.
#   • Previous DCI state is read from the hex_zones row (not a local variable)
#     so the hysteresis state machine survives scheduler restarts.
#   • Weights are read from system_config once per cycle (not per hex) —
#     they change weekly via XGBoost retraining, not per-cycle.
#   • The circular import (dci_engine ↔ trigger_monitor) from the original
#     is eliminated by passing disruption data back to the caller (scheduler)
#     which calls trigger_monitor separately.
#
# Depends on:
#   config.py              → DCI thresholds, weights, sleep timings
#   db/client.py           → supabase_admin (REST), get_db_connection (asyncpg)
#   services/spatial.py    → get_hex_centroid (fallback coords)
# =============================================================================

from __future__ import annotations

import asyncio
import logging
import math
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Coroutine, Optional

from backend.config import settings
from backend.db.client import get_db_connection, get_db_transaction, supabase_admin

logger = logging.getLogger(__name__)

# =============================================================================
# CONCURRENCY SETTINGS
# =============================================================================
# Limit how many hexes are computed in parallel to avoid starving the asyncpg
# connection pool.  30 parallel coroutines is safe for pools of size 10+.
_COMPUTE_SEMAPHORE = asyncio.Semaphore(30)

# =============================================================================
# WEIGHT CACHE (5-minute TTL)
# =============================================================================
# DCI weights change weekly via XGBoost retraining. Caching for 5 minutes
# avoids a DB round-trip on every cycle while staying close to real-time.
_WEIGHTS_CACHE: dict[str, Any] | None = None
_WEIGHTS_CACHE_AT: datetime | None = None
_WEIGHTS_TTL = timedelta(minutes=5)

# =============================================================================
# SIGNAL CACHE (30-second TTL per hex batch)
# =============================================================================
# Caches the last fn_get_hex_signals() call so rapid successive cycles
# (e.g. during stress tests) don't hammer the DB.
_SIGNAL_CACHE: dict[str, dict] = {}
_SIGNAL_CACHE_AT: datetime | None = None
_SIGNAL_TTL = timedelta(seconds=30)


# =============================================================================
# 1. PURE MATH — sigmoid + DCI formula
# =============================================================================

def sigmoid(x: float) -> float:
    """
    Standard sigmoid: σ(x) = 1 / (1 + e^-x).
    Clamps at x < -500 to avoid math.exp overflow (x > 500 returns 1.0 naturally).
    Output is always in (0, 1).
    """
    if x < -500:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def compute_dci(
    w: float, t: float, p: float, s: float,
    alpha: float = 0.45,
    beta:  float = 0.25,
    gamma: float = 0.20,
    delta: float = 0.10,
) -> tuple[float, float]:
    """
    Computes the Demand Collapse Index for a hex zone.

    Formula: DCI_h = σ(α·W + β·T + γ·P + δ·S)

    Args:
        w:     Weather composite score (rainfall + wind + AQI contribution)
        t:     Traffic congestion index (0–1+)
        p:     Platform outage/order-drop score (0–1)
        s:     Social disruption score (0.0 or 1.0)
        alpha–delta: Sigmoid weights (cold-start priors; updated weekly by XGBoost)

    Returns:
        (dci_score, raw_sum) where:
          dci_score ∈ (0, 1): the sigmoid output
          raw_sum:  the pre-sigmoid weighted sum (stored for XGBoost training)
    """
    raw = (alpha * w) + (beta * t) + (gamma * p) + (delta * s)
    return sigmoid(raw), raw


def get_dci_status(dci: float) -> str:
    """
    Maps a DCI value to its DB zone_status ENUM string.
    Thresholds sourced from settings (not hardcoded) so they can be tuned.

    Returns: 'disrupted' | 'elevated' | 'normal'
    """
    if dci > settings.DCI_THRESHOLD_DISRUPTED:
        return "disrupted"
    if dci > settings.DCI_THRESHOLD_ELEVATED_WATCH:
        return "elevated"
    return "normal"


# =============================================================================
# 2. RESULT DATACLASSES
# =============================================================================

@dataclass
class HexDCIResult:
    """Per-hex DCI computation outcome for a single cycle."""
    hex_id:                  str
    dci_score:               float
    dci_raw_sum:             float
    dci_status:              str        # NORMAL | ELEVATED_WATCH | DISRUPTED
    status_before:           str        # Status from previous cycle
    w_score:                 float
    t_score:                 float
    p_score:                 float
    s_score:                 float
    aqi_score:               float
    signal_sources_available: int
    is_degraded:             bool
    is_transition_to_disrupted: bool    = False
    is_transition_to_cleared:   bool    = False
    weather_breached:        bool       = False
    aqi_breached:            bool       = False
    traffic_breached:        bool       = False
    platform_breached:       bool       = False
    social_breached:         bool       = False
    dci_history_record_id:   Optional[int] = None
    disruption_event_id:     Optional[str] = None
    computation_ms:          int        = 0
    error:                   Optional[str] = None


@dataclass
class DCICycleResult:
    """Summary of a complete DCI computation cycle across all hexes."""
    cycle_started_at:        datetime
    hexes_processed:         int     = 0
    hexes_disrupted:         int     = 0
    hexes_elevated_watch:    int     = 0
    hexes_normal:            int     = 0
    hexes_degraded:          int     = 0
    transitions_to_disrupted: int    = 0
    transitions_to_cleared:  int     = 0
    disruption_events_opened: int    = 0
    disruption_events_closed: int    = 0
    claims_initiated:        int     = 0
    dci_history_written:     int     = 0
    duration_ms:             int     = 0
    errors:                  list[str] = field(default_factory=list)
    hex_results:             list[HexDCIResult] = field(default_factory=list)


# =============================================================================
# 3. SYSTEM CONFIG WEIGHTS FETCH
# =============================================================================

async def _fetch_current_weights() -> dict[str, float]:
    """
    Reads the current DCI weights from system_config.
    Cached for 5 minutes to avoid a DB round-trip on every cycle.
    Falls back to cold-start priors from settings on any DB failure.
    """
    global _WEIGHTS_CACHE, _WEIGHTS_CACHE_AT

    now = datetime.now(timezone.utc)
    if (
        _WEIGHTS_CACHE is not None
        and _WEIGHTS_CACHE_AT is not None
        and (now - _WEIGHTS_CACHE_AT) < _WEIGHTS_TTL
    ):
        return dict(_WEIGHTS_CACHE)  # return a copy so callers can pop safely

    try:
        response = (
            supabase_admin.raw()
            .table("system_config")
            .select(
                "dci_weight_alpha, dci_weight_beta, "
                "dci_weight_gamma, dci_weight_delta, "
                "weights_model_version"
            )
            .eq("id", 1)
            .limit(1)
            .execute()
        )
        if response.data:
            row = response.data[0]
            _WEIGHTS_CACHE = {
                "alpha":         float(row["dci_weight_alpha"]),
                "beta":          float(row["dci_weight_beta"]),
                "gamma":         float(row["dci_weight_gamma"]),
                "delta":         float(row["dci_weight_delta"]),
                "model_version": row.get("weights_model_version", "cold-start"),
            }
            _WEIGHTS_CACHE_AT = now
            return dict(_WEIGHTS_CACHE)
    except Exception as exc:
        logger.warning("Failed to fetch DCI weights from system_config: %s", exc)

    # Fallback to cold-start priors from settings
    fallback = {
        "alpha":         settings.DCI_WEIGHT_ALPHA,
        "beta":          settings.DCI_WEIGHT_BETA,
        "gamma":         settings.DCI_WEIGHT_GAMMA,
        "delta":         settings.DCI_WEIGHT_DELTA,
        "model_version": "cold-start",
    }
    return fallback


# =============================================================================
# 4. BATCH SIGNAL FETCH via asyncpg
# =============================================================================

async def _with_retry(
    coro_fn: Callable[[], Coroutine[Any, Any, Any]],
    label: str,
    retries: int = 3,
    fallback: Any = None,
) -> Any:
    """
    Retry wrapper with exponential backoff for async DB calls.
    Returns `fallback` if all attempts fail.
    """
    delay = 0.1
    for attempt in range(1, retries + 1):
        try:
            return await coro_fn()
        except Exception as exc:
            logger.warning(
                "[dci_engine] %s failed (attempt %d/%d): %s",
                label, attempt, retries, exc,
            )
            if attempt < retries:
                await asyncio.sleep(delay)
                delay *= 2
    return fallback


async def _fetch_hex_signals_batch(hex_ids: list[str]) -> dict[str, dict]:
    """
    Calls fn_get_hex_signals() via asyncpg to fetch all 5 signal scores
    for all hexes in a single SQL round-trip.
    Cached for 30 seconds to reduce DB load during frequent cycles.
    Falls back to empty dict if the batch call fails after retries.
    """
    global _SIGNAL_CACHE, _SIGNAL_CACHE_AT

    if not hex_ids:
        return {}

    now = datetime.now(timezone.utc)
    if (
        _SIGNAL_CACHE
        and _SIGNAL_CACHE_AT is not None
        and (now - _SIGNAL_CACHE_AT) < _SIGNAL_TTL
    ):
        return _SIGNAL_CACHE

    async def _do_fetch() -> dict[str, dict]:
        async with get_db_connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM public.fn_get_hex_signals($1::text[])",
                hex_ids,
            )
        return {row["hex_id"]: dict(row) for row in rows}

    result = await _with_retry(_do_fetch, "fn_get_hex_signals", fallback={})
    if result:
        _SIGNAL_CACHE = result
        _SIGNAL_CACHE_AT = now
    return result or {}


# =============================================================================
# 5. CURRENT HEX STATE FETCH (for status_before)
# =============================================================================

async def _fetch_hex_states(hex_ids: list[str]) -> dict[str, dict]:
    """
    Fetches the current dci_status and disruption_started_at for all hexes.
    Used to determine status_before for the hysteresis state machine.
    Retries up to 3 times with exponential backoff.
    """
    async def _do_fetch() -> dict[str, dict]:
        response = (
            supabase_admin.raw()
            .table("hex_zones")
            .select("hex_id, dci_status, disruption_started_at, active_policy_count")
            .in_("hex_id", hex_ids)
            .execute()
        )
        return {row["hex_id"]: row for row in (response.data or [])}

    return await _with_retry(_do_fetch, "_fetch_hex_states", fallback={})


# =============================================================================
# 6. PER-HEX DCI COMPUTATION
# =============================================================================

def _compute_hex_dci(
    hex_id:   str,
    signals:  dict,
    state:    dict,
    weights:  dict[str, float],
) -> HexDCIResult:
    """
    Computes DCI for a single hex from fetched signals.
    Pure computation — no DB calls (those happen in batch after this).

    AQI is added to the Weather W score:
        W_combined = W_weather + W_aqi
    This is correct because:
      - At AQI = 300 (trigger): W_aqi = 300/300 = 1.0
      - At rainfall = 35mm/hr (trigger): W_rain = 35/35 = 1.0
      - Both reaching 1.0 simultaneously → W_combined = 2.0
      - sigmoid(α × 2.0 + ...) ≈ 0.99 → strongly DISRUPTED (correct)

    Args:
        hex_id:  H3 cell index
        signals: Row from fn_get_hex_signals() (may be empty if no data)
        state:   Row from hex_zones (current status before this cycle)
        weights: DCI sigmoid weights from system_config

    Returns:
        HexDCIResult with computed DCI and transition flags.
    """
    t0 = time.perf_counter()

    # Extract signal scores (default 0.0 if missing)
    # Clamp all values to [0, 2] to prevent sigmoid blow-up from bad sensor data.
    # At W=2, sigmoid(α*2) ≈ 0.99 — the model correctly reads extreme disruption.
    # At W=10 (unclamped bad data), the output is indistinguishable from W=5,
    # but it masks the true signal quality and makes XGBoost training noisy.
    def _clamp(v: float) -> float:
        return max(0.0, min(2.0, v))

    w_weather = _clamp(float(signals.get("weather_score", 0.0)))
    aqi       = _clamp(float(signals.get("aqi_score",     0.0)))
    t_score   = _clamp(float(signals.get("traffic_score", 0.0)))
    p_score   = _clamp(float(signals.get("platform_score",0.0)))
    s_score   = _clamp(float(signals.get("social_score",  0.0)))

    sources_available = int(signals.get("sources_available", 0))
    is_degraded       = sources_available < settings.SIGNAL_DEGRADED_MODE_THRESHOLD

    # AQI contributes to the Weather composite (not as a separate sigmoid input)
    w_combined = w_weather + aqi

    # Previous zone status (for transition detection + hysteresis)
    status_before = (state.get("dci_status") or "normal").upper()

    # Compute DCI
    dci_score, raw_sum = compute_dci(
        w=w_combined, t=t_score, p=p_score, s=s_score,
        alpha=weights["alpha"],
        beta=weights["beta"],
        gamma=weights["gamma"],
        delta=weights["delta"],
    )
    dci_status = get_dci_status(dci_score)

    # Transition detection
    # Note: The DB trigger handles hysteresis (requires 2 cycles below 0.75
    # to exit DISRUPTED). We detect the raw transition here for logging;
    # the authoritative status_after comes from the DB after the update.
    is_to_disrupted = (
        status_before != "disrupted"
        and dci_status == "disrupted"
    )
    is_to_cleared = (
        status_before == "disrupted"
        and dci_status != "disrupted"
    )

    return HexDCIResult(
        hex_id=hex_id,
        dci_score=round(dci_score, 6),
        dci_raw_sum=round(raw_sum, 6),
        dci_status=dci_status,
        status_before=status_before,
        w_score=round(w_combined, 6),
        t_score=round(t_score, 6),
        p_score=round(p_score, 6),
        s_score=round(s_score, 6),
        aqi_score=round(aqi, 6),
        signal_sources_available=sources_available,
        is_degraded=is_degraded,
        is_transition_to_disrupted=is_to_disrupted,
        is_transition_to_cleared=is_to_cleared,
        weather_breached=bool(signals.get("weather_breached", False)),
        aqi_breached=bool(signals.get("aqi_breached", False)),
        traffic_breached=bool(signals.get("traffic_breached", False)),
        platform_breached=bool(signals.get("platform_breached", False)),
        social_breached=bool(signals.get("social_breached", False)),
        computation_ms=int((time.perf_counter() - t0) * 1000),
    )


# =============================================================================
# 7. BATCH DCI HISTORY INSERT via asyncpg
# =============================================================================

async def _insert_dci_history_batch(
    results: list[HexDCIResult],
    weights: dict[str, float],
    model_version: str,
) -> dict[str, int]:
    """
    Inserts DCI history records for all hexes via fn_insert_dci_record().
    Called once per cycle after all per-hex computations are complete.

    Returns:
        {hex_id: dci_history_record_id}
    """
    record_ids: dict[str, int] = {}

    async with get_db_connection() as conn:
        for r in results:
            if r.error:
                continue
            try:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM public.fn_insert_dci_record(
                        $1,   -- p_hex_id
                        $2,   -- p_dci_score
                        $3,   -- p_w_score
                        $4,   -- p_t_score
                        $5,   -- p_p_score
                        $6,   -- p_s_score
                        $7,   -- p_alpha
                        $8,   -- p_beta
                        $9,   -- p_gamma
                        $10,  -- p_delta
                        $11,  -- p_status_before
                        $12,  -- p_status_after (our computed status — DB may adjust via hysteresis)
                        $13,  -- p_signal_sources_available
                        NULL, -- p_signal_cache_snapshot_ids
                        $14,  -- p_computation_duration_ms
                        $15,  -- p_model_version
                        $16,  -- p_weather_breached
                        $17,  -- p_aqi_breached
                        $18,  -- p_traffic_breached
                        $19,  -- p_platform_breached
                        $20,  -- p_social_breached
                        0     -- p_active_worker_count (updated by hex_zones trigger)
                    )
                    """,
                    r.hex_id,
                    r.dci_score,
                    r.w_score,
                    r.t_score,
                    r.p_score,
                    r.s_score,
                    weights["alpha"],
                    weights["beta"],
                    weights["gamma"],
                    weights["delta"],
                    r.status_before,
                    r.dci_status,
                    r.signal_sources_available,
                    r.computation_ms,
                    model_version,
                    r.weather_breached,
                    r.aqi_breached,
                    r.traffic_breached,
                    r.platform_breached,
                    r.social_breached,
                )
                if row:
                    record_ids[r.hex_id] = row["record_id"]
                    if row.get("is_disruption_onset"):
                        r.is_transition_to_disrupted = True
                    if row.get("is_disruption_cleared"):
                        r.is_transition_to_cleared = True

            except Exception as exc:
                logger.error(
                    "fn_insert_dci_record failed for %s: %s", r.hex_id, exc
                )

    return record_ids


# =============================================================================
# 8. BULK HEX_ZONES UPDATE via asyncpg
# =============================================================================

async def _bulk_update_hex_zones(results: list[HexDCIResult]) -> None:
    """
    Calls fn_bulk_update_hex_dci() to update all hex_zones in one SQL call.
    Retried up to 3 times before falling back to individual REST updates.
    """
    if not results:
        return

    valid = [r for r in results if not r.error]
    if not valid:
        return

    async def _do_bulk() -> None:
        async with get_db_connection() as conn:
            await conn.execute(
                """
                SELECT * FROM public.fn_bulk_update_hex_dci(
                    $1::text[],
                    $2::double precision[],
                    $3::double precision[],
                    $4::double precision[],
                    $5::double precision[],
                    $6::smallint[]
                )
                """,
                [r.hex_id   for r in valid],
                [r.w_score  for r in valid],
                [r.t_score  for r in valid],
                [r.p_score  for r in valid],
                [r.s_score  for r in valid],
                [r.signal_sources_available for r in valid],
            )

    result = await _with_retry(_do_bulk, "fn_bulk_update_hex_dci", fallback="failed")
    if result == "failed":
        logger.error("fn_bulk_update_hex_dci exhausted retries — falling back to REST")
        await _fallback_individual_hex_updates(valid)


async def _fallback_individual_hex_updates(results: list[HexDCIResult]) -> None:
    """
    Fallback: updates hex_zones individually via Supabase REST if the bulk
    asyncpg call fails. Slower but resilient.
    """
    for r in results:
        try:
            supabase_admin.raw().table("hex_zones").update({
                "signal_weather":  r.w_score,
                "signal_traffic":  r.t_score,
                "signal_platform": r.p_score,
                "signal_social":   r.s_score,
                "signal_sources_available": r.signal_sources_available,
                "is_degraded_mode": r.is_degraded,
            }).eq("hex_id", r.hex_id).execute()
        except Exception as exc:
            logger.error("Fallback hex update failed for %s: %s", r.hex_id, exc)


# =============================================================================
# 9. DISRUPTION EVENT MANAGEMENT
# =============================================================================

async def _open_disruption_events(
    disrupted_results: list[HexDCIResult],
) -> dict[str, str]:
    """
    Calls fn_open_disruption_event() for every hex that just transitioned
    to DISRUPTED. Idempotent — returns existing event_id if already open.

    Returns:
        {hex_id: disruption_event_id (UUID str)}
    """
    event_ids: dict[str, str] = {}

    for r in disrupted_results:
        try:
            response = supabase_admin.raw().rpc(
                "fn_open_disruption_event",
                {
                    "p_hex_id":                 r.hex_id,
                    "p_dci_at_onset":            r.dci_score,
                    "p_dci_onset_record_id":     r.dci_history_record_id,
                    "p_dci_onset_computed_at":   datetime.now(timezone.utc).isoformat(),
                    "p_weather_breached":        r.weather_breached,
                    "p_aqi_breached":            r.aqi_breached,
                    "p_traffic_breached":        r.traffic_breached,
                    "p_platform_breached":       r.platform_breached,
                    "p_social_breached":         r.social_breached,
                    "p_trigger_signals_json":    None,
                    "p_peak_rainfall":           None,
                    "p_peak_wind":               None,
                    "p_peak_aqi":                None,
                    "p_peak_congestion":         None,
                    "p_peak_order_drop":         None,
                }
            ).execute()
            event_id = response.data
            if event_id:
                event_ids[r.hex_id] = str(event_id)
                logger.info(
                    "Disruption event opened: hex=%s event=%s DCI=%.3f",
                    r.hex_id, event_id, r.dci_score,
                )
        except Exception as exc:
            logger.error(
                "fn_open_disruption_event failed for %s: %s", r.hex_id, exc
            )

    return event_ids


async def _update_active_disruption_events(
    active_results: list[HexDCIResult],
) -> None:
    """
    Calls fn_update_disruption_event() for hexes that are already DISRUPTED
    (not a new transition — updating the running event with new DCI peak etc.)
    """
    for r in active_results:
        try:
            # Find the active event ID for this hex
            resp = (
                supabase_admin.raw()
                .table("disruption_events")
                .select("id")
                .eq("hex_id", r.hex_id)
                .in_("status", ["ACTIVE", "CLEARING"])
                .limit(1)
                .execute()
            )
            if not resp.data:
                continue

            event_id = resp.data[0]["id"]
            supabase_admin.raw().rpc(
                "fn_update_disruption_event",
                {
                    "p_event_id":           event_id,
                    "p_current_dci":        r.dci_score,
                    "p_status":             "ACTIVE",
                    "p_weather_breached":   r.weather_breached,
                    "p_aqi_breached":       r.aqi_breached,
                    "p_traffic_breached":   r.traffic_breached,
                    "p_platform_breached":  r.platform_breached,
                    "p_social_breached":    r.social_breached,
                    "p_signal_sources":     r.signal_sources_available,
                    "p_trigger_signals_json": None,
                    "p_peak_rainfall":      None,
                    "p_peak_wind":          None,
                    "p_peak_aqi":           None,
                    "p_peak_congestion":    None,
                    "p_peak_order_drop":    None,
                }
            ).execute()
        except Exception as exc:
            logger.error(
                "fn_update_disruption_event failed for %s: %s", r.hex_id, exc
            )


async def _close_disruption_events(
    cleared_results: list[HexDCIResult],
) -> None:
    """
    Calls fn_close_disruption_event() for hexes that just cleared.
    Locks verified_disrupted_hours and finalises claims.
    """
    for r in cleared_results:
        try:
            resp = (
                supabase_admin.raw()
                .table("disruption_events")
                .select("id")
                .eq("hex_id", r.hex_id)
                .in_("status", ["ACTIVE", "CLEARING"])
                .limit(1)
                .execute()
            )
            if not resp.data:
                continue

            event_id = resp.data[0]["id"]
            supabase_admin.raw().rpc(
                "fn_close_disruption_event",
                {
                    "p_event_id":              event_id,
                    "p_dci_at_clearance":      r.dci_score,
                    "p_regulatory_description": None,
                }
            ).execute()

            logger.info(
                "Disruption event closed: hex=%s event=%s DCI=%.3f",
                r.hex_id, event_id, r.dci_score,
            )
        except Exception as exc:
            logger.error(
                "fn_close_disruption_event failed for %s: %s", r.hex_id, exc
            )


# =============================================================================
# 10. MAIN CYCLE ORCHESTRATOR
# =============================================================================

async def _run_dci_cycle_inner(hex_ids: list[str]) -> DCICycleResult:
    """
    Inner implementation of the DCI cycle — called by run_dci_cycle which
    wraps it with a timeout guard. All public API goes through run_dci_cycle.
    """
    cycle = DCICycleResult(cycle_started_at=datetime.now(timezone.utc))
    t0    = time.perf_counter()

    logger.info("DCI cycle starting: %d hexes", len(hex_ids))

    # ── Step 1: Fetch weights (cached, 5-min TTL) ─────────────────────────────
    weights = await _fetch_current_weights()
    model_version = weights.pop("model_version", "cold-start")

    # ── Step 2: Batch-fetch all signal scores (1 asyncpg call) ────────────────
    signals_by_hex = await _fetch_hex_signals_batch(hex_ids)

    # ── Step 3: Fetch current hex states (status_before for hysteresis) ───────
    hex_states = await _fetch_hex_states(hex_ids)

    # ── Step 4: Compute DCI per hex in parallel (semaphore-limited) ───────────
    # Pure Python computation — no DB calls here. Safe to run concurrently.
    # Semaphore limits to _COMPUTE_SEMAPHORE (30) parallel goroutines so we
    # don't starve the asyncpg pool when processing 1000+ hexes.

    async def _compute_one(hex_id: str) -> HexDCIResult:
        async with _COMPUTE_SEMAPHORE:
            signals = signals_by_hex.get(hex_id, {})
            state   = hex_states.get(hex_id, {})

            # Degraded-mode feature flag: if no signal data available,
            # retain the last known DCI from hex_zones instead of resetting
            # to 0.0 (which would incorrectly clear an active disruption).
            if not signals:
                last_dci    = float(state.get("current_dci") or 0.0)
                last_status = (state.get("dci_status") or "normal").lower()
                return HexDCIResult(
                    hex_id=hex_id,
                    dci_score=last_dci,
                    dci_raw_sum=0.0,
                    dci_status=last_status,
                    status_before=last_status.upper(),
                    w_score=0.0, t_score=0.0, p_score=0.0,
                    s_score=0.0, aqi_score=0.0,
                    signal_sources_available=0,
                    is_degraded=True,
                    error="No signal data — last known DCI retained",
                )

            try:
                return _compute_hex_dci(hex_id, signals, state, weights)
            except Exception as exc:
                logger.error("DCI computation failed for %s: %s", hex_id, exc)
                return HexDCIResult(
                    hex_id=hex_id,
                    dci_score=0.0, dci_raw_sum=0.0,
                    dci_status="normal", status_before="normal",
                    w_score=0.0, t_score=0.0, p_score=0.0,
                    s_score=0.0, aqi_score=0.0,
                    signal_sources_available=0, is_degraded=True,
                    error=str(exc),
                )

    tasks = [asyncio.create_task(_compute_one(h)) for h in hex_ids]
    task_results = await asyncio.gather(*tasks, return_exceptions=True)

    hex_results: list[HexDCIResult] = []
    slow_hexes: list[str] = []

    for i, res in enumerate(task_results):
        if isinstance(res, Exception):
            hid = hex_ids[i]
            logger.error("Task exception for hex %s: %s", hid, res)
            hex_results.append(HexDCIResult(
                hex_id=hid,
                dci_score=0.0, dci_raw_sum=0.0,
                dci_status="normal", status_before="normal",
                w_score=0.0, t_score=0.0, p_score=0.0,
                s_score=0.0, aqi_score=0.0,
                signal_sources_available=0, is_degraded=True,
                error=str(res),
            ))
            cycle.errors.append(f"hex={hid}: {res}")
        else:
            hex_results.append(res)
            if res.computation_ms > 50:
                slow_hexes.append(res.hex_id)

    # ── Step 5: Bulk-update hex_zones (1 asyncpg call, retried) ──────────────
    await _bulk_update_hex_zones(hex_results)

    # ── Step 6: Insert dci_history records ────────────────────────────────────
    record_ids = await _insert_dci_history_batch(hex_results, weights, model_version)
    for r in hex_results:
        r.dci_history_record_id = record_ids.get(r.hex_id)
    cycle.dci_history_written = len(record_ids)

    # ── Step 7: Disruption event management ──────────────────────────────────
    newly_disrupted   = [r for r in hex_results if r.is_transition_to_disrupted]
    already_disrupted = [
        r for r in hex_results
        if r.dci_status == "disrupted" and not r.is_transition_to_disrupted
    ]
    newly_cleared     = [r for r in hex_results if r.is_transition_to_cleared]

    if newly_disrupted:
        event_ids = await _open_disruption_events(newly_disrupted)
        for r in newly_disrupted:
            r.disruption_event_id = event_ids.get(r.hex_id)
        cycle.disruption_events_opened += len(event_ids)

    if already_disrupted:
        await _update_active_disruption_events(already_disrupted)

    if newly_cleared:
        await _close_disruption_events(newly_cleared)
        cycle.disruption_events_closed += len(newly_cleared)

    # ── Step 8: Aggregate cycle stats + rich observability log ───────────────
    valid_scores = [
        r.dci_score for r in hex_results if not r.is_degraded and not r.error
    ]
    with_signals  = len(valid_scores)
    signal_avail_pct = round(100 * with_signals / max(len(hex_results), 1), 1)

    for r in hex_results:
        cycle.hexes_processed += 1
        if r.is_degraded:
            cycle.hexes_degraded += 1
        elif r.dci_status == "disrupted":
            cycle.hexes_disrupted += 1
        elif r.dci_status == "elevated":
            cycle.hexes_elevated_watch += 1
        else:
            cycle.hexes_normal += 1

    cycle.transitions_to_disrupted = len(newly_disrupted)
    cycle.transitions_to_cleared   = len(newly_cleared)
    cycle.duration_ms               = int((time.perf_counter() - t0) * 1000)
    cycle.hex_results               = hex_results

    avg_dci = round(sum(valid_scores) / max(len(valid_scores), 1), 4)
    max_dci = round(max(valid_scores, default=0.0), 4)
    degraded_pct = round(100 * cycle.hexes_degraded / max(cycle.hexes_processed, 1), 1)

    logger.info(
        "DCI cycle complete | hexes=%d disrupted=%d watch=%d normal=%d "
        "degraded=%d(%.1f%%) | transitions +%d -%d | avg_dci=%.4f max_dci=%.4f "
        "| signal_avail=%.1f%% | slow_hexes=%d %s| %dms",
        cycle.hexes_processed,
        cycle.hexes_disrupted,
        cycle.hexes_elevated_watch,
        cycle.hexes_normal,
        cycle.hexes_degraded, degraded_pct,
        cycle.transitions_to_disrupted,
        cycle.transitions_to_cleared,
        avg_dci, max_dci,
        signal_avail_pct,
        len(slow_hexes),
        str(slow_hexes[:5]) + " " if slow_hexes else "",
        cycle.duration_ms,
    )

    return cycle


async def run_dci_cycle(hex_ids: list[str]) -> DCICycleResult:
    """
    Full DCI computation cycle for all given hexes.
    Called by APScheduler on DCI_JOB_CRON_MINUTE.

    Wraps _run_dci_cycle_inner with a 120-second timeout guard.
    If the cycle times out, a partial DCICycleResult is returned with
    an error note — the next cycle will pick up where this left off.

    Args:
        hex_ids: H3 cell indices to process this cycle

    Returns:
        DCICycleResult with aggregate stats for the /health and admin dashboard.
    """
    if not hex_ids:
        return DCICycleResult(cycle_started_at=datetime.now(timezone.utc))

    try:
        return await asyncio.wait_for(
            _run_dci_cycle_inner(hex_ids),
            timeout=120.0,
        )
    except asyncio.TimeoutError:
        logger.error(
            "DCI cycle timed out after 120s for %d hexes — returning partial result",
            len(hex_ids),
        )
        partial = DCICycleResult(cycle_started_at=datetime.now(timezone.utc))
        partial.errors.append("Cycle timed out after 120s")
        partial.duration_ms = 120_000
        return partial


# =============================================================================
# 11. PUBLIC UTILITY — compute DCI for a single hex (used by API endpoints)
# =============================================================================

async def compute_hex_dci_now(hex_id: str) -> Optional[HexDCIResult]:
    """
    Computes the current DCI for a single hex on demand.
    Used by:
      - GET /api/dci/{hex_id} — worker app Zone Risk Dashboard
      - Admin dashboard manual refresh

    Fetches signals and state, computes DCI, but does NOT write to DB.
    (DB is updated only by the scheduler cycle to maintain single-writer semantics.)
    """
    weights      = await _fetch_current_weights()
    weights.pop("model_version", None)

    signals_map  = await _fetch_hex_signals_batch([hex_id])
    states_map   = await _fetch_hex_states([hex_id])

    signals = signals_map.get(hex_id, {})
    state   = states_map.get(hex_id, {})

    if not signals:
        return None

    try:
        return _compute_hex_dci(hex_id, signals, state, weights)
    except Exception as exc:
        logger.error("compute_hex_dci_now(%s) failed: %s", hex_id, exc)
        return None