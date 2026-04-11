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
from datetime import datetime, timezone
from typing import Optional

from backend.config import settings
from backend.db.client import get_db_connection, get_db_transaction, supabase_admin

logger = logging.getLogger(__name__)


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
    Reads the current DCI weights from system_config (single row).
    Weights change weekly via XGBoost retraining — this ensures the engine
    always uses the most recently trained weights.

    Returns the cold-start priors from settings if the DB read fails.
    """
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
            return {
                "alpha":         float(row["dci_weight_alpha"]),
                "beta":          float(row["dci_weight_beta"]),
                "gamma":         float(row["dci_weight_gamma"]),
                "delta":         float(row["dci_weight_delta"]),
                "model_version": row.get("weights_model_version", "cold-start"),
            }
    except Exception as exc:
        logger.warning("Failed to fetch DCI weights from system_config: %s", exc)

    # Fallback to cold-start priors from settings
    return {
        "alpha":         settings.DCI_WEIGHT_ALPHA,
        "beta":          settings.DCI_WEIGHT_BETA,
        "gamma":         settings.DCI_WEIGHT_GAMMA,
        "delta":         settings.DCI_WEIGHT_DELTA,
        "model_version": "cold-start",
    }


# =============================================================================
# 4. BATCH SIGNAL FETCH via asyncpg
# =============================================================================

async def _fetch_hex_signals_batch(hex_ids: list[str]) -> dict[str, dict]:
    """
    Calls fn_get_hex_signals() via asyncpg to fetch all 5 signal scores
    for all hexes in a single SQL round-trip.

    Returns:
        {hex_id: {weather_score, aqi_score, traffic_score, platform_score,
                  social_score, sources_available,
                  weather_breached, aqi_breached, traffic_breached,
                  platform_breached, social_breached, any_stale}}

    Falls back to empty dict per hex if the batch call fails.
    """
    if not hex_ids:
        return {}

    try:
        async with get_db_connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM public.fn_get_hex_signals($1::text[])",
                hex_ids,
            )
        return {
            row["hex_id"]: dict(row)
            for row in rows
        }
    except Exception as exc:
        logger.error("fn_get_hex_signals batch failed: %s", exc)
        return {}


# =============================================================================
# 5. CURRENT HEX STATE FETCH (for status_before)
# =============================================================================

async def _fetch_hex_states(hex_ids: list[str]) -> dict[str, dict]:
    """
    Fetches the current dci_status and disruption_started_at for all hexes.
    Used to determine status_before for the hysteresis state machine.
    """
    try:
        response = (
            supabase_admin.raw()
            .table("hex_zones")
            .select("hex_id, dci_status, disruption_started_at, active_policy_count")
            .in_("hex_id", hex_ids)
            .execute()
        )
        return {row["hex_id"]: row for row in (response.data or [])}
    except Exception as exc:
        logger.error("_fetch_hex_states failed: %s", exc)
        return {}


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
    w_weather = float(signals.get("weather_score", 0.0))
    aqi       = float(signals.get("aqi_score",     0.0))
    t_score   = float(signals.get("traffic_score", 0.0))
    p_score   = float(signals.get("platform_score",0.0))
    s_score   = float(signals.get("social_score",  0.0))

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
    The DB triggers fire per-row:
      trg_hex_zones_recompute_dci    → recomputes current_dci from signals
      trg_hex_zones_sync_dci_status  → applies hysteresis state machine
      trg_hex_zones_check_bcr        → suspends enrolment if BCR > 0.85

    After this call, hex_zones.dci_status reflects the authoritative state
    (including hysteresis — the status may differ from r.dci_status if the
    DB held DISRUPTED state through a hysteresis cycle).
    """
    if not results:
        return

    valid = [r for r in results if not r.error]
    if not valid:
        return

    try:
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
    except Exception as exc:
        logger.error("fn_bulk_update_hex_dci failed: %s", exc)
        # Fallback: update hexes individually via REST
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

async def run_dci_cycle(hex_ids: list[str]) -> DCICycleResult:
    """
    Full DCI computation cycle for all given hexes.
    Called by APScheduler on DCI_JOB_CRON_MINUTE.

    Steps:
      1. Fetch current weights from system_config (once per cycle)
      2. Batch-fetch all signal scores via fn_get_hex_signals() (1 SQL call)
      3. Fetch current hex states (status_before for hysteresis)
      4. Compute DCI per hex (pure Python — no DB)
      5. Bulk-update hex_zones via fn_bulk_update_hex_dci() (1 SQL call)
      6. Insert dci_history records per hex via fn_insert_dci_record()
      7. Open/update/close disruption events based on transitions
      8. Return cycle summary for scheduler monitoring

    Args:
        hex_ids: H3 cell indices to process this cycle

    Returns:
        DCICycleResult with aggregate stats for the /health and admin dashboard.
    """
    if not hex_ids:
        return DCICycleResult(cycle_started_at=datetime.now(timezone.utc))

    cycle = DCICycleResult(cycle_started_at=datetime.now(timezone.utc))
    t0    = time.perf_counter()

    logger.info("DCI cycle starting: %d hexes", len(hex_ids))

    # -------------------------------------------------------------------------
    # Step 1: Fetch weights from system_config
    # -------------------------------------------------------------------------
    weights = await _fetch_current_weights()
    model_version = weights.pop("model_version", "cold-start")

    # -------------------------------------------------------------------------
    # Step 2: Batch-fetch all signal scores (1 asyncpg call for all hexes)
    # -------------------------------------------------------------------------
    signals_by_hex = await _fetch_hex_signals_batch(hex_ids)

    # -------------------------------------------------------------------------
    # Step 3: Fetch current hex states (status_before)
    # -------------------------------------------------------------------------
    hex_states = await _fetch_hex_states(hex_ids)

    # -------------------------------------------------------------------------
    # Step 4: Compute DCI per hex (pure Python, concurrent-safe)
    # -------------------------------------------------------------------------
    hex_results: list[HexDCIResult] = []

    for hex_id in hex_ids:
        signals = signals_by_hex.get(hex_id, {})
        state   = hex_states.get(hex_id, {})

        # If no signals at all, mark as degraded — don't compute
        if not signals:
            r = HexDCIResult(
                hex_id=hex_id,
                dci_score=0.0,
                dci_raw_sum=0.0,
                dci_status="normal",
                status_before=(state.get("dci_status") or "normal").upper(),
                w_score=0.0, t_score=0.0, p_score=0.0, s_score=0.0, aqi_score=0.0,
                signal_sources_available=0,
                is_degraded=True,
                error="No signal data available",
            )
            hex_results.append(r)
            cycle.hexes_degraded += 1
            continue

        try:
            r = _compute_hex_dci(hex_id, signals, state, weights)
            hex_results.append(r)
        except Exception as exc:
            logger.error("DCI computation failed for %s: %s", hex_id, exc)
            hex_results.append(HexDCIResult(
                hex_id=hex_id,
                dci_score=0.0, dci_raw_sum=0.0,
                dci_status="normal", status_before="normal",
                w_score=0.0, t_score=0.0, p_score=0.0, s_score=0.0, aqi_score=0.0,
                signal_sources_available=0, is_degraded=True,
                error=str(exc),
            ))
            cycle.errors.append(f"hex={hex_id}: {exc}")

        if settings.DCI_CYCLE_HEX_SLEEP_SECONDS > 0:
            await asyncio.sleep(settings.DCI_CYCLE_HEX_SLEEP_SECONDS)

    # -------------------------------------------------------------------------
    # Step 5: Bulk-update hex_zones (1 asyncpg call — triggers fire per-row)
    # -------------------------------------------------------------------------
    await _bulk_update_hex_zones(hex_results)

    # -------------------------------------------------------------------------
    # Step 6: Insert dci_history records (per-hex — returns transition flags)
    # -------------------------------------------------------------------------
    record_ids = await _insert_dci_history_batch(
        hex_results, weights, model_version
    )
    for r in hex_results:
        r.dci_history_record_id = record_ids.get(r.hex_id)

    cycle.dci_history_written = len(record_ids)

    # -------------------------------------------------------------------------
    # Step 7: Disruption event management
    # -------------------------------------------------------------------------
    newly_disrupted    = [r for r in hex_results if r.is_transition_to_disrupted]
    already_disrupted  = [
        r for r in hex_results
        if r.dci_status == "disrupted" and not r.is_transition_to_disrupted
    ]
    newly_cleared      = [r for r in hex_results if r.is_transition_to_cleared]

    # Open new disruption events
    if newly_disrupted:
        event_ids = await _open_disruption_events(newly_disrupted)
        for r in newly_disrupted:
            r.disruption_event_id = event_ids.get(r.hex_id)
        cycle.disruption_events_opened += len(event_ids)

    # Update ongoing disruption events (peak DCI, trigger flags, cycle count)
    if already_disrupted:
        await _update_active_disruption_events(already_disrupted)

    # Close cleared disruption events
    if newly_cleared:
        await _close_disruption_events(newly_cleared)
        cycle.disruption_events_closed += len(newly_cleared)

    # -------------------------------------------------------------------------
    # Step 8: Aggregate cycle stats
    # -------------------------------------------------------------------------
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

    logger.info(
        "DCI cycle complete: %d hexes | DISRUPTED=%d WATCH=%d NORMAL=%d "
        "DEGRADED=%d | transitions +%d -%d | %dms",
        cycle.hexes_processed,
        cycle.hexes_disrupted,
        cycle.hexes_elevated_watch,
        cycle.hexes_normal,
        cycle.hexes_degraded,
        cycle.transitions_to_disrupted,
        cycle.transitions_to_cleared,
        cycle.duration_ms,
    )

    return cycle


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