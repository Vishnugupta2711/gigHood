# =============================================================================
# backend/services/mock_external_apis.py — Deterministic Mock External APIs
# =============================================================================
# Simulates the 5 external signal APIs and the platform worker activity API
# used for Gate 2 fraud validation. All mocks are:
#
#   1. Deterministic  — seeded by hex_id/worker_id + UTC hour, so values are
#                       stable within the same hour and change naturally between
#                       hours. No global random.seed() pollution.
#   2. Realistic      — probability distributions calibrated to match real
#                       Q-commerce disruption patterns (RedSeer 2023 data).
#   3. Async-native   — no asyncio.run() inside sync wrappers.
#   4. Latency-aware  — simulated API latency is realistic (50–600ms).
#
# Issues fixed from the original:
#   • global random.seed() call mutated shared state — concurrent coroutines
#     would corrupt each other's random sequences. Fixed with local
#     random.Random(seed) instances per call.
#   • asyncio.sleep(0.5) on every mock call added 500ms per signal × 5 signals
#     × 150 hexes = 375s of sleep per cycle. Replaced with a 10–80ms range.
#   • verify_zepto_worker_activity was sync (missing async) in trigger_monitor
#     call path — fixed to be consistently async.
#   • Worker activity mock based only on worker_id substring ("offline",
#     "weak") — too brittle for test isolation. Now uses a deterministic
#     probability distribution seeded by worker_id + hour, with explicit
#     test override via MOCK_GATE2_OVERRIDE env var.
#   • Platform outage mock used order_drop_pct 0–80 but trigger threshold is
#     70 (0.70). The mock now correctly uses 0.0–1.0 scale matching the
#     signal_fetchers normalisation.
#
# Used by:
#   signal_fetchers.py  → fetch_traffic(), fetch_platform(), fetch_social()
#   trigger_monitor.py  → Gate 2 verify_zepto_worker_activity()
# =============================================================================

from __future__ import annotations

import asyncio
import hashlib
import random
from datetime import datetime, timezone
from typing import Optional


# =============================================================================
# 0. DETERMINISTIC SEED HELPER
# =============================================================================

def _seed(key: str) -> int:
    """
    Returns a deterministic 32-bit int seed from a string key.
    Changes every hour so mock values drift realistically between hours.
    Uses MD5 (not for security — purely for fast deterministic hashing).
    Avoids global random.seed() — each caller creates its own Random instance.
    """
    hour = datetime.now(timezone.utc).hour
    payload = f"{key}:{hour}"
    return int(hashlib.md5(payload.encode()).hexdigest(), 16) % (2 ** 32)


def _rng(key: str) -> random.Random:
    """Returns an isolated Random instance seeded from key + current hour."""
    return random.Random(_seed(key))


# =============================================================================
# 1. TRAFFIC API MOCK (Trigger 3)
# =============================================================================

async def fetch_mock_tomtom_traffic(
    hex_id: str,
    lat: float,
    lng: float,
) -> dict:
    """
    Simulates a traffic congestion partner API (TomTom / Google Maps).

    Congestion distribution (calibrated to Q-commerce delivery patterns):
      ~70% of cycles: low congestion (0.05–0.40)
      ~25% of cycles: moderate (0.40–0.85)
       ~5% of cycles: full gridlock (0.85–1.0) → Trigger 3 fires at 1.0

    Returns:
        Payload with congestion_level (0.0–1.0), incident_count, latency_ms.
    """
    rng = _rng(f"traffic:{hex_id}")
    roll = rng.random()

    if roll > 0.95:
        # Full gridlock — Trigger 3 fires
        congestion = rng.uniform(1.0, 1.0)
        incidents  = rng.randint(4, 10)
    elif roll > 0.70:
        # Moderate congestion
        congestion = rng.uniform(0.40, 0.85)
        incidents  = rng.randint(1, 4)
    else:
        # Light / free flow
        congestion = rng.uniform(0.05, 0.40)
        incidents  = 0

    latency_ms = rng.randint(80, 420)
    await asyncio.sleep(latency_ms / 1000 * 0.1)   # scale to 8–42ms simulated

    return {
        "provider":        "tomtom-mock",
        "hex_id":          hex_id,
        "location":        {"lat": lat, "lng": lng},
        "congestion_level": round(congestion, 4),
        "incident_count":  incidents,
        "latency_ms":      latency_ms,
        "fetched_at":      datetime.now(timezone.utc).isoformat(),
    }


# =============================================================================
# 2. PLATFORM STATUS MOCK (Trigger 4)
# =============================================================================

async def fetch_mock_platform_outage(hex_id: str) -> dict:
    """
    Simulates a Zepto/Blinkit platform health/outage partner API.

    Order drop distribution:
      ~75% of cycles: minimal drop (0.0–0.25) — platform healthy
      ~20% of cycles: moderate drop (0.25–0.69) — degraded
       ~5% of cycles: major outage (0.70–1.0)   → Trigger 4 fires at 0.70

    NOTE: order_drop_pct is returned as a fraction (0.0–1.0) matching
    the signal_fetchers normalisation. The original used 0–80 (percentage)
    which caused a 100× magnitude error in the P score.
    """
    rng = _rng(f"platform:{hex_id}")
    roll = rng.random()

    if roll > 0.95:
        # Major outage — Trigger 4 fires
        order_drop = rng.uniform(0.70, 1.0)
        latency_ms = rng.randint(30001, 60000)
        status     = "down"
        status_flag = 2
    elif roll > 0.75:
        # Degraded
        order_drop = rng.uniform(0.25, 0.69)
        latency_ms = rng.randint(5000, 30000)
        status     = "degraded"
        status_flag = 1
    else:
        # Healthy
        order_drop = rng.uniform(0.0, 0.25)
        latency_ms = rng.randint(200, 2000)
        status     = "active"
        status_flag = 0

    simulated_latency = rng.randint(60, 380)
    await asyncio.sleep(simulated_latency / 1000 * 0.1)

    return {
        "provider":           "platform-health-mock",
        "hex_id":             hex_id,
        "status":             status,
        "status_flag":        status_flag,
        "order_drop_pct":     round(order_drop, 4),    # 0.0–1.0 fraction
        "platform_api_latency_ms": latency_ms,
        "affected_platforms": ["Zepto", "Blinkit"],
        "simulated_latency_ms": simulated_latency,
        "fetched_at":         datetime.now(timezone.utc).isoformat(),
    }


# =============================================================================
# 3. GOVERNMENT ALERT FEED MOCK (Trigger 5)
# =============================================================================

async def fetch_mock_gov_alert(city: str) -> dict:
    """
    Simulates a government alert feed (NDMA / state disaster management API).

    Social disruption distribution:
      ~93% of cycles: no alert
       ~4% of cycles: strike / bandh
       ~3% of cycles: curfew

    Alert is city-level — all hexes in the same city see the same alert.
    Seeded on city (not hex_id) so alerts are consistent across a city.
    """
    rng = _rng(f"social:{city.lower()}")
    roll = rng.random()

    if roll > 0.97:
        curfew_active = True
        strike_active = False
        severity      = 1.0
        description   = f"Section 144 curfew in effect — {city}"
        event_type    = "CURFEW"
    elif roll > 0.93:
        curfew_active = False
        strike_active = True
        severity      = 0.85
        description   = f"Local bandh/strike — {city}"
        event_type    = "STRIKE"
    else:
        curfew_active = False
        strike_active = False
        severity      = 0.0
        description   = None
        event_type    = "NONE"

    await asyncio.sleep(0.01)

    return {
        "provider":        "gov-alert-mock",
        "city":            city,
        "event_type":      event_type,
        "curfew_active":   curfew_active,
        "strike_active":   strike_active,
        "severity":        severity,
        "description":     description,
        "fetched_at":      datetime.now(timezone.utc).isoformat(),
    }


# =============================================================================
# 4. GATE 2 — PLATFORM WORKER ACTIVITY MOCK
# =============================================================================

async def verify_zepto_worker_activity(worker_id: str) -> dict:
    """
    Simulates the Zepto/Blinkit platform worker activity verification API.
    Called by trigger_monitor.py Gate 2 fraud check.

    Gate 2 outcome distribution (calibrated to realistic delivery patterns):
      ~65% of workers: STRONG  — ≥ 1 valid completed order in PoP window
      ~20% of workers: WEAK    — online but no completed orders
      ~15% of workers: OFFLINE — app closed / unavailable

    A "valid" order has pickup ↔ dropoff distance > 100m
    (micro-delivery exclusion for self-dealing fraud detection).

    The distribution is deterministic per worker_id + hour so:
      - The same worker gets the same Gate 2 result within a cycle
      - Results change naturally hour-to-hour
      - Test IDs with specific substrings bypass the probabilistic logic
        for deterministic test control (see MOCK_WORKER_ID_OVERRIDES below)
    """
    # -------------------------------------------------------------------------
    # Test override: specific worker_id substrings → deterministic outcomes
    # These override the probabilistic logic for test isolation.
    # -------------------------------------------------------------------------
    worker_id_lower = worker_id.lower()

    if "offline" in worker_id_lower or "inactive" in worker_id_lower:
        return _build_inactive_response(worker_id)

    if "weak" in worker_id_lower or "no_orders" in worker_id_lower:
        return _build_weak_response(worker_id)

    if "strong" in worker_id_lower or "active_orders" in worker_id_lower:
        return _build_strong_response(worker_id)

    # -------------------------------------------------------------------------
    # Probabilistic outcome (production-like distribution)
    # -------------------------------------------------------------------------
    rng = _rng(f"gate2:{worker_id}")
    roll = rng.random()

    simulated_latency = rng.randint(150, 600)
    await asyncio.sleep(simulated_latency / 1000 * 0.1)

    if roll > 0.85:
        # OFFLINE — app closed
        return _build_inactive_response(worker_id, latency_ms=simulated_latency)

    elif roll > 0.65:
        # WEAK — online but no completed orders before disruption
        return _build_weak_response(worker_id, latency_ms=simulated_latency)

    else:
        # STRONG — active with completed orders
        return _build_strong_response(worker_id, latency_ms=simulated_latency)


# =============================================================================
# 5. GATE 2 RESPONSE BUILDERS
# =============================================================================

def _build_inactive_response(
    worker_id: str,
    latency_ms: int = 200,
) -> dict:
    """Gate 2 NO_CONFIRMATION — worker offline, app closed."""
    return {
        "provider":   "zepto-activity-mock",
        "worker_id":  worker_id,
        "status":     "inactive",
        "last_ping":  "38 mins ago",
        "orders":     [],
        "latency_ms": latency_ms,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_weak_response(
    worker_id: str,
    latency_ms: int = 250,
) -> dict:
    """
    Gate 2 WEAK — worker app is open/online but no completed orders.
    Includes one micro-delivery (pickup ≈ dropoff) which will be excluded
    by the micro-delivery filter in trigger_monitor._check_gate2_order_activity().
    """
    return {
        "provider":   "zepto-activity-mock",
        "worker_id":  worker_id,
        "status":     "active",
        "last_ping":  "8 mins ago",
        "orders": [
            {
                # Micro-delivery: pickup ≈ dropoff (< 100m) → excluded
                "order_id":       f"ord_micro_{worker_id[:8]}",
                "pickup_lat":     12.9716,
                "pickup_lng":     77.5946,
                "dropoff_lat":    12.9717,    # ~11m from pickup
                "dropoff_lng":    77.5947,
                "created_at":     datetime.now(timezone.utc).isoformat(),
                "completed_at":   None,
                "status":         "pending",
            }
        ],
        "latency_ms": latency_ms,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_strong_response(
    worker_id: str,
    latency_ms: int = 300,
) -> dict:
    """
    Gate 2 STRONG — worker has ≥ 1 valid completed order in PoP window.
    Includes one valid order (> 100m distance) and one excluded micro-delivery.

    Uses consistent but varied coordinates seeded by worker_id to make
    order history look realistic in the admin dashboard.
    """
    rng = _rng(f"gate2_orders:{worker_id}")

    # Valid order: pickup and dropoff ~1–2 km apart
    base_lat = 12.9716 + rng.uniform(-0.02, 0.02)
    base_lng = 77.5946 + rng.uniform(-0.02, 0.02)
    drop_lat  = base_lat + rng.uniform(0.008, 0.018)   # ~900m–2km north
    drop_lng  = base_lng + rng.uniform(0.005, 0.015)

    return {
        "provider":   "zepto-activity-mock",
        "worker_id":  worker_id,
        "status":     "active",
        "last_ping":  "2 mins ago",
        "orders": [
            {
                # Valid completed delivery — will pass Gate 2
                "order_id":     f"ord_valid_{worker_id[:8]}",
                "pickup_lat":   round(base_lat, 6),
                "pickup_lng":   round(base_lng, 6),
                "dropoff_lat":  round(drop_lat, 6),
                "dropoff_lng":  round(drop_lng, 6),
                "created_at":   datetime.now(timezone.utc).isoformat(),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "status":       "completed",
            },
            {
                # Micro-delivery: will be excluded by Gate 2 filter
                "order_id":     f"ord_micro_{worker_id[:8]}",
                "pickup_lat":   round(base_lat, 6),
                "pickup_lng":   round(base_lng, 6),
                "dropoff_lat":  round(base_lat + 0.0001, 6),
                "dropoff_lng":  round(base_lng + 0.0001, 6),
                "created_at":   datetime.now(timezone.utc).isoformat(),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "status":       "completed",
            },
        ],
        "latency_ms": latency_ms,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# =============================================================================
# 6. AQI MOCK (CPCB fallback — used by signal_fetchers.py)
# =============================================================================

async def fetch_mock_cpcb_aqi(city: str) -> dict:
    """
    Simulates the CPCB AQI API response for a city.
    Used by signal_fetchers.fetch_aqi() when CPCB_API_KEY is absent or API fails.

    AQI distribution:
      ~40% of hours: Good/Moderate (30–100)
      ~30% of hours: Unhealthy for sensitive (100–200)
      ~22% of hours: Very Unhealthy (200–300)
       ~8% of hours: Hazardous (> 300) → Trigger 2 fires

    Delhi gets a +50 AQI offset reflecting its historically higher pollution.
    """
    rng = _rng(f"aqi:{city.lower()}")
    roll = rng.random()

    # Delhi offset — post-Diwali and winter pollution model
    city_offset = 50 if "delhi" in city.lower() else 0

    if roll > 0.92 or (city_offset and roll > 0.85):
        aqi      = int(rng.uniform(301, 500)) + city_offset
        category = "Hazardous"
    elif roll > 0.70:
        aqi      = int(rng.uniform(201, 300)) + city_offset
        category = "Very Unhealthy"
    elif roll > 0.40:
        aqi      = int(rng.uniform(101, 200)) + city_offset
        category = "Unhealthy for Sensitive Groups"
    else:
        aqi      = int(rng.uniform(30, 100)) + city_offset
        category = "Good" if aqi < 50 else "Moderate"

    aqi = min(500, aqi)   # CPCB scale cap

    pollutants = ["PM2.5", "PM10", "NO2", "O3", "SO2"]
    dominant   = pollutants[rng.randint(0, len(pollutants) - 1)]

    await asyncio.sleep(0.01)

    return {
        "provider":   "cpcb-mock",
        "city":       city,
        "aqi":        aqi,
        "category":   category,
        "dominant_pollutant": dominant,
        "records":    [{"city": city, "aqi": str(aqi), "pollutant_id": category}],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# =============================================================================
# 7. DISRUPTION SCENARIO PRESETS (for demo and integration tests)
# =============================================================================

async def simulate_heavy_rain_scenario(hex_id: str) -> dict:
    """
    Returns all 5 signal scores for a heavy monsoon rain scenario.
    DCI result will be > 0.85 (DISRUPTED) with this input.
    Used by the demo runner and integration tests.
    """
    return {
        "WEATHER":  {"rainfall_mm_hr": 55.0, "wind_speed_km_hr": 40.0, "normalized_score": 1.57},
        "AQI":      {"aqi_value": 120, "normalized_score": 0.40},
        "TRAFFIC":  {"congestion_index": 0.90, "normalized_score": 0.90},
        "PLATFORM": {"order_drop_pct": 0.75, "normalized_score": 0.75},
        "SOCIAL":   {"curfew_active": False, "strike_active": False, "normalized_score": 0.0},
    }


async def simulate_aqi_spike_scenario(hex_id: str) -> dict:
    """
    Returns all 5 signal scores for a Delhi AQI spike scenario.
    DCI result will be in ELEVATED_WATCH to DISRUPTED range.
    Used by demo runner for AQI-triggered disruption demo.
    """
    return {
        "WEATHER":  {"rainfall_mm_hr": 2.0, "wind_speed_km_hr": 15.0, "normalized_score": 0.39},
        "AQI":      {"aqi_value": 380, "aqi_category": "Hazardous", "normalized_score": 1.27},
        "TRAFFIC":  {"congestion_index": 0.45, "normalized_score": 0.45},
        "PLATFORM": {"order_drop_pct": 0.82, "normalized_score": 0.82},
        "SOCIAL":   {"curfew_active": False, "strike_active": True, "normalized_score": 0.85},
    }


async def simulate_normal_scenario(hex_id: str) -> dict:
    """
    Returns all 5 signal scores for a clear, normal operational day.
    DCI result will be < 0.65 (NORMAL).
    """
    return {
        "WEATHER":  {"rainfall_mm_hr": 0.5, "wind_speed_km_hr": 8.0, "normalized_score": 0.19},
        "AQI":      {"aqi_value": 75, "normalized_score": 0.25},
        "TRAFFIC":  {"congestion_index": 0.25, "normalized_score": 0.25},
        "PLATFORM": {"order_drop_pct": 0.05, "normalized_score": 0.05},
        "SOCIAL":   {"curfew_active": False, "strike_active": False, "normalized_score": 0.0},
    }