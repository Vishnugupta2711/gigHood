from __future__ import annotations

import random
import sys
import uuid
import os
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from typing import Any

import asyncpg
from faker import Faker
from neo4j import GraphDatabase

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from backend.db.client import get_supabase_admin_client  # noqa: E402
from backend.config import settings  # noqa: E402

PROTECTED_PHONE = "9876543210"
TARGET_SYNTHETIC_WORKERS = 50
TARGET_PREMIUM_SUM = 2000
TARGET_PAID_SUM = 1300  # exactly 65% of 2000

FAKER = Faker("en_IN")
RNG = random.Random(20260417)

DEVICE_MODELS = [
    "Redmi Note 12",
    "Samsung M14",
    "Realme Narzo 60",
    "OnePlus Nord CE",
    "Vivo T2",
    "POCO X5",
]
CARRIERS = ["Jio", "Airtel", "Vi", "BSNL"]
PLATFORMS = ["Swiggy", "Zomato", "Zepto", "Blinkit", "Dunzo"]
UPI_DOMAINS = ["oksbi", "okhdfcbank", "okaxis", "ybl", "ibl"]

CITY_PLAN = [
    ("Bengaluru", 17, (12.84, 13.11), (77.50, 77.78)),
    ("Delhi", 17, (28.48, 28.75), (77.00, 77.30)),
    ("Mumbai", 16, (18.90, 19.20), (72.76, 72.99)),
]


@dataclass
class ProtectedSnapshot:
    worker: dict[str, Any] | None
    policies: list[dict[str, Any]]
    claims: list[dict[str, Any]]
    location_pings: list[dict[str, Any]]


@dataclass
class SyntheticWorker:
    id: str
    phone: str
    name: str
    city: str
    hex_id: str
    upi_id: str
    avg_daily_earnings: int
    platform_affiliation: str
    platform_id: str
    device_model: str
    sim_carrier: str
    sim_registration_date: date
    latitude: float
    longitude: float


def _chunked(rows: list[dict[str, Any]], size: int = 200):
    for i in range(0, len(rows), size):
        yield rows[i:i + size]


def _random_phone(used: set[str]) -> str:
    while True:
        first = str(RNG.randint(6, 9))
        rest = "".join(str(RNG.randint(0, 9)) for _ in range(9))
        phone = f"{first}{rest}"
        if phone == PROTECTED_PHONE:
            continue
        if phone not in used:
            used.add(phone)
            return phone


def _make_upi(name: str) -> str:
    base = "".join(ch for ch in name.lower() if ch.isalnum())[:8] or "worker"
    return f"{base}{RNG.randint(1000,9999)}@{RNG.choice(UPI_DOMAINS)}"


def _count_table(supabase, table: str) -> int:
    try:
        res = supabase.table(table).select("id", count="exact").limit(1).execute()
        return int(res.count or 0)
    except Exception:
        res = supabase.table(table).select("*", count="exact").limit(1).execute()
        return int(res.count or 0)


def _safe_delete_all(supabase, table: str) -> int:
    before = _count_table(supabase, table)
    table_filters: dict[str, list[tuple[str, Any]]] = {
        "claims": [("id", "00000000-0000-0000-0000-000000000000")],
        "policies": [("id", "00000000-0000-0000-0000-000000000000")],
        "workers": [("id", "00000000-0000-0000-0000-000000000000")],
        "location_pings": [("worker_id", "00000000-0000-0000-0000-000000000000")],
        "dci_history": [("hex_id", "__never_match__")],
        "signal_cache": [("hex_id", "__never_match__")],
    }
    filters = table_filters.get(table, [("id", "00000000-0000-0000-0000-000000000000")])
    last_error: Exception | None = None
    for col, value in filters:
        try:
            supabase.table(table).delete().neq(col, value).execute()
            return before
        except Exception as exc:
            last_error = exc
            continue
    if last_error:
        raise RuntimeError(f"Could not wipe {table}: {last_error}")
    return before


async def _truncate_tables_fast() -> bool:
    db_url = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
    if not db_url:
        return False

    conn = await asyncpg.connect(db_url)
    try:
        await conn.execute("TRUNCATE TABLE claims")
        await conn.execute("TRUNCATE TABLE policies")
        await conn.execute("TRUNCATE TABLE workers")
        await conn.execute("TRUNCATE TABLE location_pings")
        await conn.execute("TRUNCATE TABLE dci_history")
        await conn.execute("TRUNCATE TABLE signal_cache")
        return True
    finally:
        await conn.close()


def _find_protected_worker(supabase) -> dict[str, Any] | None:
    candidates = [PROTECTED_PHONE, f"+91{PROTECTED_PHONE}"]
    for phone in candidates:
        res = supabase.table("workers").select("*").eq("phone", phone).limit(1).execute()
        if res.data:
            return res.data[0]
    return None


def _snapshot_protected(supabase) -> ProtectedSnapshot:
    worker = _find_protected_worker(supabase)
    if not worker:
        return ProtectedSnapshot(worker=None, policies=[], claims=[], location_pings=[])

    worker_id = worker["id"]
    policies = supabase.table("policies").select("*").eq("worker_id", worker_id).execute().data or []
    policy_ids = [p["id"] for p in policies if p.get("id")]

    claims: list[dict[str, Any]] = []
    if policy_ids:
        claims.extend(supabase.table("claims").select("*").in_("policy_id", policy_ids).execute().data or [])
    worker_claims = supabase.table("claims").select("*").eq("worker_id", worker_id).execute().data or []
    existing = {c.get("id") for c in claims}
    claims.extend([c for c in worker_claims if c.get("id") not in existing])

    location_pings = (
        supabase.table("location_pings").select("*").eq("worker_id", worker_id).execute().data or []
    )

    return ProtectedSnapshot(worker=worker, policies=policies, claims=claims, location_pings=location_pings)


def _restore_snapshot(supabase, snap: ProtectedSnapshot) -> dict[str, int]:
    stats = {"worker": 0, "policies": 0, "claims": 0, "location_pings": 0}
    if not snap.worker:
        return stats

    supabase.table("workers").insert(snap.worker).execute()
    stats["worker"] = 1

    for chunk in _chunked(snap.policies, 200):
        supabase.table("policies").insert(chunk).execute()
    stats["policies"] = len(snap.policies)

    for chunk in _chunked(snap.claims, 200):
        supabase.table("claims").insert(chunk).execute()
    stats["claims"] = len(snap.claims)

    for chunk in _chunked(snap.location_pings, 500):
        supabase.table("location_pings").insert(chunk).execute()
    stats["location_pings"] = len(snap.location_pings)

    return stats


def _ensure_city_hexes(supabase, city: str, minimum: int = 6) -> list[str]:
    hexes: list[str] = []

    for city_variant in [city, city.lower(), city.upper()]:
        for col in ["h3_index", "hex_id"]:
            try:
                res = supabase.table("hex_zones").select(f"{col},city").eq("city", city_variant).limit(100).execute()
                for row in res.data or []:
                    value = row.get(col)
                    if value and value not in hexes:
                        hexes.append(value)
            except Exception:
                continue

    if len(hexes) >= minimum:
        return hexes

    # Seed lightweight zone rows if city is missing.
    needed = minimum - len(hexes)
    created_ids: list[str] = []
    for i in range(needed):
        synthetic_hex = f"{city[:3].upper()}_{uuid.uuid4().hex[:12]}"
        payload_base = {
            "city": city,
            "current_dci": 0.35,
            "dci_status": "normal",
            "active_worker_count": 0,
        }
        inserted = False
        for key_col in ["h3_index", "hex_id"]:
            try:
                supabase.table("hex_zones").upsert({**payload_base, key_col: synthetic_hex}, on_conflict=key_col).execute()
                inserted = True
                break
            except Exception:
                continue
        if inserted:
            created_ids.append(synthetic_hex)

    return hexes + created_ids


def _generate_workers(supabase) -> list[SyntheticWorker]:
    used: set[str] = set()
    workers: list[SyntheticWorker] = []

    for city, count, lat_rng, lng_rng in CITY_PLAN:
        city_hexes = _ensure_city_hexes(supabase, city, minimum=8)
        if not city_hexes:
            raise RuntimeError(f"No hex zones available for {city}")

        for i in range(count):
            name = FAKER.name()
            platform = RNG.choice(PLATFORMS)
            worker_id = str(uuid.uuid4())
            workers.append(
                SyntheticWorker(
                    id=worker_id,
                    phone=_random_phone(used),
                    name=name,
                    city=city,
                    hex_id=city_hexes[i % len(city_hexes)],
                    upi_id=_make_upi(name),
                    avg_daily_earnings=RNG.randint(600, 1400),
                    platform_affiliation=platform,
                    platform_id=f"{platform[:3].upper()}-{RNG.randint(100000, 999999)}",
                    device_model=RNG.choice(DEVICE_MODELS),
                    sim_carrier=RNG.choice(CARRIERS),
                    sim_registration_date=FAKER.date_between(start_date="-2y", end_date="-3m"),
                    latitude=round(RNG.uniform(*lat_rng), 6),
                    longitude=round(RNG.uniform(*lng_rng), 6),
                )
            )

    if len(workers) != TARGET_SYNTHETIC_WORKERS:
        raise RuntimeError(f"Expected {TARGET_SYNTHETIC_WORKERS} workers, got {len(workers)}")

    return workers


def _insert_workers(supabase, workers: list[SyntheticWorker]) -> None:
    rows = []
    for w in workers:
        rows.append(
            {
                "id": w.id,
                "phone": w.phone,
                "name": w.name,
                "city": w.city,
                "dark_store_zone": f"{w.city[:3].upper()}-ZONE-{RNG.randint(1, 30):02d}",
                "hex_id": w.hex_id,
                "avg_daily_earnings": w.avg_daily_earnings,
                "upi_id": w.upi_id,
                "device_model": w.device_model,
                "device_os_version": f"Android {RNG.randint(10,14)}",
                "sim_carrier": w.sim_carrier,
                "sim_registration_date": w.sim_registration_date.isoformat(),
                "trust_score": RNG.randint(48, 86),
                "status": "active",
                "role": "worker",
                "gig_company": w.platform_affiliation,
                "platform_affiliation": w.platform_affiliation,
                "platform_id": w.platform_id,
                "is_platform_verified": RNG.random() < 0.75,
                "latitude": w.latitude,
                "longitude": w.longitude,
                "location_accuracy": round(RNG.uniform(8.0, 35.0), 2),
                "location_captured_at": datetime.now(timezone.utc).isoformat(),
                "device_token": f"tok-{uuid.uuid4().hex[:16]}",
            }
        )
    for chunk in _chunked(rows, 200):
        supabase.table("workers").insert(chunk).execute()


def _premium_distribution() -> list[int]:
    # 50 policies: 45 x 42 + 1 x 30 + 4 x 20 = 2000 exactly
    values = [42] * 45 + [30] + [20] * 4
    RNG.shuffle(values)
    return values


def _insert_policies(supabase, workers: list[SyntheticWorker]) -> dict[str, str]:
    premiums = _premium_distribution()
    if len(premiums) != len(workers):
        raise RuntimeError("Premium list and worker count mismatch")

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    rows: list[dict[str, Any]] = []
    policy_by_worker: dict[str, str] = {}

    for w, premium in zip(workers, premiums):
        policy_id = str(uuid.uuid4())
        policy_by_worker[w.id] = policy_id
        rows.append(
            {
                "id": policy_id,
                "worker_id": w.id,
                "tier": "B" if premium <= 30 else "A",
                "weekly_premium": premium,
                "coverage_cap_daily": RNG.choice([300, 350, 400, 450, 500]),
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "status": "active",
                "is_waiting_period": False,
                "waiting_period_ends": week_start.isoformat(),
                "source": "realistic_micro_pool_seed",
            }
        )

    for chunk in _chunked(rows, 200):
        supabase.table("policies").insert(chunk).execute()

    return policy_by_worker


def _ensure_events(supabase, workers: list[SyntheticWorker]) -> dict[str, str]:
    event_for_hex: dict[str, str] = {}
    now = datetime.now(timezone.utc)
    for hex_id in sorted({w.hex_id for w in workers}):
        event_id = str(uuid.uuid4())
        started = now - timedelta(days=RNG.randint(2, 20), hours=RNG.randint(1, 12))
        payload = {
            "id": event_id,
            "hex_id": hex_id,
            "h3_index": hex_id,
            "dci_peak": round(RNG.uniform(0.66, 0.92), 3),
            "duration_hours": float(RNG.randint(2, 8)),
            "trigger_signals": {
                "W": round(RNG.uniform(0.5, 1.1), 3),
                "T": round(RNG.uniform(0.4, 1.0), 3),
                "P": round(RNG.uniform(0.3, 0.9), 3),
                "S": round(RNG.uniform(0.1, 0.6), 3),
            },
            "started_at": started.isoformat(),
            "ended_at": (started + timedelta(hours=RNG.randint(2, 9))).isoformat(),
        }

        inserted = False
        for variant in [payload, {k: v for k, v in payload.items() if k != "h3_index"}, {k: v for k, v in payload.items() if k != "hex_id"}]:
            try:
                supabase.table("disruption_events").insert(variant).execute()
                inserted = True
                break
            except Exception:
                continue
        if inserted:
            event_for_hex[hex_id] = event_id

    if not event_for_hex:
        raise RuntimeError("Could not create disruption events for claim seeding")
    return event_for_hex


def _insert_claims(supabase, workers: list[SyntheticWorker], policy_by_worker: dict[str, str], event_for_hex: dict[str, str]) -> None:
    now = datetime.now(timezone.utc)
    rows: list[dict[str, Any]] = []

    # Historical approved/paid claims: 20 claims x 65 = 1300 exactly.
    paid_workers = workers[:20]
    for w in paid_workers:
        created_at = now - timedelta(days=RNG.randint(5, 28), hours=RNG.randint(2, 20))
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "worker_id": w.id,
                "policy_id": policy_by_worker[w.id],
                "event_id": event_for_hex[w.hex_id],
                "pop_validated": True,
                "fraud_score": RNG.randint(8, 26),
                "resolution_path": "fast_track",
                "payout_amount": 65,
                "disrupted_hours": round(RNG.uniform(2.0, 6.0), 2),
                "status": "paid",
                "fraud_flags": [],
                "decision": "APPROVE",
                "decision_reason": "Historical approved payout in realistic demo seed.",
                "decision_confidence": "HIGH",
                "created_at": created_at.isoformat(),
                "resolved_at": (created_at + timedelta(hours=RNG.randint(2, 18))).isoformat(),
            }
        )

    # Ensure non-paid paths exist for admin resolution matrix.
    if len(workers) < 23:
        raise RuntimeError("Not enough workers to create path matrix")

    soft_worker = workers[20]
    verify_worker = workers[21]
    denied_worker = workers[22]

    rows.extend(
        [
            {
                "id": str(uuid.uuid4()),
                "worker_id": soft_worker.id,
                "policy_id": policy_by_worker[soft_worker.id],
                "event_id": event_for_hex[soft_worker.hex_id],
                "pop_validated": True,
                "fraud_score": 44,
                "resolution_path": "soft_queue",
                "payout_amount": 0,
                "disrupted_hours": 3.5,
                "status": "pending",
                "fraud_flags": ["MANUAL_REVIEW"],
                "decision": "REVIEW",
                "decision_reason": "Queued for soft review in demo matrix.",
                "decision_confidence": "MEDIUM",
                "created_at": (now - timedelta(days=2)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "worker_id": verify_worker.id,
                "policy_id": policy_by_worker[verify_worker.id],
                "event_id": event_for_hex[verify_worker.hex_id],
                "pop_validated": True,
                "fraud_score": 61,
                "resolution_path": "active_verify",
                "payout_amount": 0,
                "disrupted_hours": 4.0,
                "status": "pending",
                "fraud_flags": ["DEVICE_CHECK"],
                "decision": "VERIFY",
                "decision_reason": "Explicit active verification row for admin table path coverage.",
                "decision_confidence": "MEDIUM",
                "created_at": (now - timedelta(days=1, hours=6)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "worker_id": denied_worker.id,
                "policy_id": policy_by_worker[denied_worker.id],
                "event_id": event_for_hex[denied_worker.hex_id],
                "pop_validated": False,
                "fraud_score": 92,
                "resolution_path": "denied",
                "payout_amount": 0,
                "disrupted_hours": 5.5,
                "status": "denied",
                "fraud_flags": ["RING_SHARED_DEVICE", "DENIED_FRAUD"],
                "decision": "DENY",
                "decision_reason": "Denied fraud case for matrix coverage.",
                "decision_confidence": "HIGH",
                "created_at": (now - timedelta(days=3)).isoformat(),
                "resolved_at": (now - timedelta(days=2, hours=18)).isoformat(),
            },
        ]
    )

    for chunk in _chunked(rows, 200):
        supabase.table("claims").insert(chunk).execute()


def _insert_location_pings(supabase, workers: list[SyntheticWorker]) -> None:
    now = datetime.now(timezone.utc)
    rows: list[dict[str, Any]] = []

    for w in workers:
        for i in range(6):
            pinged_at = now - timedelta(days=RNG.randint(1, 20), hours=RNG.randint(1, 22), minutes=RNG.randint(0, 59))
            rows.append(
                {
                    "worker_id": w.id,
                    "hex_id": w.hex_id,
                    "h3_index": w.hex_id,
                    "latitude": round(w.latitude + RNG.uniform(-0.004, 0.004), 6),
                    "longitude": round(w.longitude + RNG.uniform(-0.004, 0.004), 6),
                    "accuracy_radius": round(RNG.uniform(8.0, 35.0), 2),
                    "network_signal_strength": RNG.randint(2, 5),
                    "mock_location_flag": False,
                    "pinged_at": pinged_at.isoformat(),
                }
            )

    for chunk in _chunked(rows, 500):
        try:
            supabase.table("location_pings").insert(chunk).execute()
        except Exception:
            # Backward-compatible fallback when h3_index does not exist in schema.
            fallback = [{k: v for k, v in row.items() if k != "h3_index"} for row in chunk]
            supabase.table("location_pings").insert(fallback).execute()


def _inject_neo4j_fraud_ring(workers: list[SyntheticWorker]) -> str:
    if not settings.NEO4J_URI or not settings.NEO4J_USER or not settings.NEO4J_PASSWORD:
        print("[warn] Neo4j not configured; skipped fraud ring graph injection.")
        return ""

    bengaluru_workers = [w for w in workers if w.city == "Bengaluru"]
    if len(bengaluru_workers) < 5:
        raise RuntimeError("Need at least 5 Bengaluru workers for fraud ring")

    ring_workers = bengaluru_workers[:5]
    shared_device_id = f"ring-device-{uuid.uuid4().hex[:16]}"
    ring_hexes = sorted({w.hex_id for w in ring_workers})

    driver = GraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        connection_timeout=5.0,
    )
    db = settings.NEO4J_DATABASE.strip() or None

    query = """
    MERGE (d:Device {fingerprint: $device_id})
    WITH d
    UNWIND $hex_ids AS hz
      MERGE (z:Hex_Zone {id: hz})
      MERGE (d)-[:SEEN_IN]->(z)
    WITH d
    UNWIND $workers AS w
      MERGE (wk:Worker {id: w.worker_id})
      MERGE (wk)-[:USES_DEVICE]->(d)
      MERGE (zone:Hex_Zone {id: w.hex_id})
      MERGE (wk)-[:CLAIMED_IN]->(zone)
    """

    payload = [{"worker_id": w.id, "hex_id": w.hex_id} for w in ring_workers]
    try:
        with driver.session(database=db) as session:
            session.run(query, device_id=shared_device_id, hex_ids=ring_hexes, workers=payload)
    finally:
        driver.close()

    return shared_device_id


def _premium_stats(supabase, worker_ids: list[str]) -> tuple[float, float, float]:
    rows = (
        supabase.table("policies")
        .select("weekly_premium")
        .in_("worker_id", worker_ids)
        .execute()
        .data
        or []
    )
    premiums = [float(r.get("weekly_premium") or 0) for r in rows]
    return sum(premiums), (max(premiums) if premiums else 0.0), (min(premiums) if premiums else 0.0)


def _claims_paid_stats(supabase, worker_ids: list[str]) -> float:
    rows = (
        supabase.table("claims")
        .select("payout_amount")
        .eq("status", "paid")
        .in_("worker_id", worker_ids)
        .execute()
        .data
        or []
    )
    return sum(float(r.get("payout_amount") or 0) for r in rows)


def main() -> None:
    supabase = get_supabase_admin_client()

    print("=== repopulate_realistic_demo.py ===")

    snap = _snapshot_protected(supabase)
    protected_id = snap.worker.get("id") if snap.worker else None

    print("[1/6] Emergency purge started...")
    deleted = {
        "claims": _count_table(supabase, "claims"),
        "policies": _count_table(supabase, "policies"),
        "workers": _count_table(supabase, "workers"),
        "location_pings": _count_table(supabase, "location_pings"),
        "dci_history": _count_table(supabase, "dci_history"),
        "signal_cache": _count_table(supabase, "signal_cache"),
    }

    fast_truncate_ok = False
    try:
        fast_truncate_ok = asyncio.run(_truncate_tables_fast())
    except Exception:
        fast_truncate_ok = False

    if not fast_truncate_ok:
        _safe_delete_all(supabase, "claims")
        _safe_delete_all(supabase, "policies")
        _safe_delete_all(supabase, "workers")
        _safe_delete_all(supabase, "location_pings")
        _safe_delete_all(supabase, "dci_history")
        _safe_delete_all(supabase, "signal_cache")

    restored = _restore_snapshot(supabase, snap)

    print("[2/6] Generating 50 synthetic workers across Bengaluru/Delhi/Mumbai...")
    workers = _generate_workers(supabase)
    _insert_workers(supabase, workers)

    print("[3/6] Inserting micro-pool policies (₹20/₹30/₹42 only)...")
    policy_by_worker = _insert_policies(supabase, workers)

    print("[4/6] Inserting historical claims and resolution-path matrix...")
    event_for_hex = _ensure_events(supabase, workers)
    _insert_claims(supabase, workers, policy_by_worker, event_for_hex)
    _insert_location_pings(supabase, workers)

    print("[5/6] Injecting Neo4j fraud ring (5 workers, 1 device, Bengaluru)...")
    ring_device_id = _inject_neo4j_fraud_ring(workers)

    print("[6/6] Verification...")
    worker_ids = [w.id for w in workers]
    premium_sum, premium_max, premium_min = _premium_stats(supabase, worker_ids)
    claims_paid_sum = _claims_paid_stats(supabase, worker_ids)

    table_counts = {
        t: _count_table(supabase, t)
        for t in ["claims", "policies", "workers", "location_pings", "dci_history", "signal_cache"]
    }

    bcr = (claims_paid_sum / premium_sum) if premium_sum else 0.0

    print("\n=== Purge Summary ===")
    for k, v in deleted.items():
        print(f"deleted_{k}: {v}")
    print(f"protected_worker_id: {protected_id or 'not_found'}")
    print(f"restored_worker_rows: {restored['worker']}")
    print(f"restored_policy_rows: {restored['policies']}")
    print(f"restored_claim_rows: {restored['claims']}")
    print(f"restored_location_ping_rows: {restored['location_pings']}")

    print("\n=== Synthetic Economics Check ===")
    print(f"synthetic_workers_created: {len(workers)}")
    print(f"synthetic_premium_sum: ₹{premium_sum:.2f}")
    print(f"synthetic_paid_claims_sum: ₹{claims_paid_sum:.2f}")
    print(f"synthetic_bcr: {bcr:.4f}")
    print(f"synthetic_max_premium: ₹{premium_max:.2f}")
    print(f"synthetic_min_premium: ₹{premium_min:.2f}")

    print("\n=== Table Counts ===")
    for k, v in table_counts.items():
        print(f"{k}: {v}")

    # Global premium guardrail check requested by user.
    all_policy_rows = supabase.table("policies").select("weekly_premium").execute().data or []
    global_max_premium = max((float(r.get("weekly_premium") or 0) for r in all_policy_rows), default=0.0)
    print(f"global_max_weekly_premium: ₹{global_max_premium:.2f}")

    matrix_rows = supabase.table("claims").select("status,resolution_path").execute().data or []
    path_set = sorted({(str(r.get("status")), str(r.get("resolution_path"))) for r in matrix_rows})
    print(f"matrix_status_path_pairs: {path_set}")

    print(f"neo4j_shared_device_id: {ring_device_id or 'not_configured'}")


if __name__ == "__main__":
    main()
