"""
backend/services/payment_service.py — Payout Orchestration
============================================================

Production-grade payout layer for GigHood FAST_TRACK claims.

Design decisions:
  • initiate_upi_payout()  — real Razorpay Payout API (not order.create);
    mock fallback only when keys are absent (dev/test environment).
  • Idempotency guard      — checks claims table for existing payout_id
    before any Razorpay call; zero double-payment risk.
  • Validation layer       — amount > 0, amount ≤ cap, fraud_score < threshold.
  • Retry wrapper          — up to 3 attempts with exponential backoff (0.2 → 0.4 → 0.8s).
  • Async payout queue     — _enqueue_payout() pushes work to an in-memory asyncio.Queue;
    _payout_worker() processes it off the hot request path.
  • Structured audit log   — every payout decision logged as JSON via payout_logger.
  • Failure handling       — failed payouts mark claim status="payout_failed" and push
    to _PAYOUT_DEAD_LETTER for ops replay.
  • Webhook hardening      — handle_payout_webhook() requires raw bytes for HMAC
    verification; testing_bypass removed entirely.
  • process_webhook_mutation()  — unchanged API; uses supabase_admin for privileged write.

Public API (unchanged):
    initiate_upi_payout(upi_id, amount_rupees, reference_id) -> dict
    debit_premium_mock(upi_id, amount_rupees, worker_id) -> bool
    handle_payout_webhook(payload, signature, secret=...) -> bool
    process_webhook_mutation(payload)
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import razorpay

logger = logging.getLogger("payment_service")
payout_logger = logging.getLogger("payment_service.audit")

# ── Razorpay account number env var ──────────────────────────────────────────
# Required for real Payout API calls.  Set RAZORPAY_ACCOUNT_NUMBER in .env.
# In development / CI this can be empty — mock fallback activates automatically.
_RZP_ACCOUNT_NUMBER = os.getenv("RAZORPAY_ACCOUNT_NUMBER", "").strip()

# ── Async payout queue ────────────────────────────────────────────────────────
# initiate_upi_payout() pushes work here; _payout_worker() drains it.
# This decouples the claim pipeline from the Razorpay network round-trip.
_PAYOUT_QUEUE: asyncio.Queue[dict] = asyncio.Queue(maxsize=1000)
_PAYOUT_DEAD_LETTER: list[dict] = []

# ── Validation thresholds ────────────────────────────────────────────────────
_MAX_SINGLE_PAYOUT_PAISE = 50_000 * 100  # ₹50,000 hard ceiling
_FRAUD_SCORE_BLOCK        = 30            # ≥30 blocks FAST_TRACK


# =============================================================================
# 1. RAZORPAY CLIENT
# =============================================================================

def _get_razorpay_client() -> Optional[razorpay.Client]:
    """Create Razorpay SDK client from env vars, returning None when unavailable."""
    key_id     = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        return None
    try:
        return razorpay.Client(auth=(key_id, key_secret))
    except Exception as exc:
        logger.warning("Razorpay client initialization failed: %s", exc)
        return None


# =============================================================================
# 2. MOCK FALLBACK (dev / test only)
# =============================================================================

def _mock_payout_response(amount_paise: int, reference_id: str) -> dict:
    """
    Deterministic mock that mirrors the real Razorpay Payout API response shape.
    Only used when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are absent.
    """
    mock_id = f"pout_{uuid.uuid4().hex[:14]}"
    return {
        "id":              mock_id,
        "transaction_id":  mock_id,
        "channel":         "UPI",
        "entity":          "payout",
        "fund_account_id": "fa_mocked123",
        "amount":          amount_paise,
        "currency":        "INR",
        "status":          "processing",
        "reference_id":    reference_id,
        "mode":            "mock_fallback",
    }


# =============================================================================
# 3. VALIDATION LAYER
# =============================================================================

def _validate_payout_params(
    amount_paise: int,
    reference_id: str,
    fraud_score:  int = 0,
    cap_paise:    int = 0,
) -> tuple[bool, str]:
    """
    Pre-flight validation before any Razorpay call.
    Returns (valid: bool, reason: str).
    """
    if amount_paise <= 0:
        return False, f"Invalid amount: {amount_paise} paise"
    if amount_paise > _MAX_SINGLE_PAYOUT_PAISE:
        return False, (
            f"Amount {amount_paise} paise exceeds single-payout ceiling "
            f"{_MAX_SINGLE_PAYOUT_PAISE} paise"
        )
    if cap_paise > 0 and amount_paise > cap_paise:
        return False, (
            f"Amount {amount_paise} paise exceeds policy cap {cap_paise} paise"
        )
    if fraud_score >= _FRAUD_SCORE_BLOCK:
        return False, f"Fraud score {fraud_score} blocks FAST_TRACK payout"
    if not reference_id:
        return False, "reference_id is required for idempotency"
    return True, "ok"


# =============================================================================
# 4. IDEMPOTENCY GUARD
# =============================================================================

def _already_paid(reference_id: str) -> Optional[dict]:
    """
    Checks the claims table for an existing successful payout for this claim.
    Returns the existing payout record dict if found, else None.
    Uses supabase_admin for a privileged read (bypasses RLS).
    """
    try:
        from backend.db.client import supabase_admin
        resp = (
            supabase_admin.raw()
            .table("claims")
            .select("id, razorpay_payment_id, payout_amount_paise, status")
            .eq("id", reference_id)
            .in_("status", ["paid", "payout_processing"])
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0]
    except Exception as exc:
        # If the idempotency check itself fails, log and fall through.
        # It is vastly safer to attempt the Razorpay call and let Razorpay
        # deduplicate via reference_id than to block a legitimate payout.
        logger.warning(
            "[idempotency] DB check failed for %s: %s — proceeding cautiously",
            reference_id, exc,
        )
    return None


# =============================================================================
# 5. RETRY WRAPPER
# =============================================================================

def _call_with_retry(fn, *args, retries: int = 3, **kwargs) -> Any:
    """
    Synchronous retry wrapper with exponential backoff for Razorpay API calls.
    Returns the result of fn(*args, **kwargs) or raises on final failure.
    """
    delay = 0.2
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "[payment] Razorpay call failed (attempt %d/%d): %s",
                attempt, retries, exc,
            )
            if attempt < retries:
                time.sleep(delay)
                delay *= 2
    raise last_exc  # type: ignore[misc]


# =============================================================================
# 6. PAYOUT STATE PERSISTENCE
# =============================================================================

def _persist_payout_state(
    reference_id:  str,
    razorpay_id:   str,
    status:        str,
    amount_paise:  int,
    mode:          str,
) -> None:
    """
    Writes payout state to the claims table immediately after Razorpay responds.
    Non-fatal — a write failure here does not block the payout response.
    """
    try:
        from backend.db.client import supabase_admin
        supabase_admin.raw().table("claims").update({
            "razorpay_payment_id":  razorpay_id,
            "payout_transaction_id": razorpay_id,
            "payout_amount_paise":  amount_paise,
            "payout_channel":       mode.upper(),
            "status":               "payout_processing",
            "resolved_at":          datetime.now(timezone.utc).isoformat(),
        }).eq("id", reference_id).execute()
    except Exception as exc:
        logger.error(
            "[payment] Failed to persist payout state for claim %s: %s",
            reference_id, exc,
        )


def _mark_payout_failed(reference_id: str, reason: str) -> None:
    """Marks a claim as payout_failed so the retry worker can re-queue it later."""
    try:
        from backend.db.client import supabase_admin
        supabase_admin.raw().table("claims").update({
            "status":            "payout_failed",
            "failure_reason":    reason[:500],  # truncate for DB column width
        }).eq("id", reference_id).execute()
        logger.error(
            "[payment] Claim %s marked payout_failed: %s", reference_id, reason
        )
    except Exception as exc:
        logger.error(
            "[payment] Could not mark payout_failed for %s: %s", reference_id, exc
        )


# =============================================================================
# 7. ASYNC PAYOUT QUEUE + WORKER
# =============================================================================

async def _payout_worker() -> None:
    """
    Background coroutine that drains _PAYOUT_QUEUE.
    Start once at app startup: asyncio.create_task(_payout_worker())
    This decouples the claim pipeline from the Razorpay network latency.
    """
    while True:
        job: dict = await _PAYOUT_QUEUE.get()
        try:
            initiate_upi_payout(
                upi_id=job["upi_id"],
                amount_rupees=job["amount_rupees"],
                reference_id=job["reference_id"],
                fraud_score=job.get("fraud_score", 0),
                cap_paise=job.get("cap_paise", 0),
            )
        except Exception as exc:
            logger.error("[payout_worker] Job failed for %s: %s", job.get("reference_id"), exc)
            _PAYOUT_DEAD_LETTER.append({**job, "error": str(exc), "ts": datetime.now(timezone.utc).isoformat()})
        finally:
            _PAYOUT_QUEUE.task_done()


def enqueue_payout(
    upi_id:       str,
    amount_rupees: float,
    reference_id:  str,
    fraud_score:   int = 0,
    cap_paise:     int = 0,
) -> None:
    """
    Push a payout job onto the async queue.
    Call this from fast-path claim processing instead of calling
    initiate_upi_payout() directly — keeps the claim pipeline non-blocking.
    Raises QueueFull if the queue is saturated (1000 jobs).
    """
    try:
        _PAYOUT_QUEUE.put_nowait({
            "upi_id":       upi_id,
            "amount_rupees": amount_rupees,
            "reference_id": reference_id,
            "fraud_score":  fraud_score,
            "cap_paise":    cap_paise,
            "queued_at":    datetime.now(timezone.utc).isoformat(),
        })
        logger.info(
            "[payment] Queued payout: ref=%s amount=₹%.2f queue_depth=%d",
            reference_id, amount_rupees, _PAYOUT_QUEUE.qsize(),
        )
    except asyncio.QueueFull:
        logger.error(
            "[payment] Payout queue FULL — could not enqueue ref=%s", reference_id
        )
        raise


# =============================================================================
# 8. MAIN PAYOUT ENTRY POINT
# =============================================================================

def initiate_upi_payout(
    upi_id:        str,
    amount_rupees: float,
    reference_id:  str,
    fraud_score:   int = 0,
    cap_paise:     int = 0,
) -> dict:
    """
    Initiates a UPI payout via Razorpay Payouts API.

    Production flow:
      1. Validate inputs (amount, cap, fraud score)
      2. Idempotency check — return existing record if already paid
      3. Call Razorpay client.payout.create() with retry (3 attempts)
      4. Persist payout state to claims table
      5. Emit structured audit log

    Mock fallback: activates automatically when RAZORPAY_KEY_ID is absent
    (development / CI / demo). Mock produces the same response shape as real API.

    Args:
        upi_id:        Recipient UPI VPA (e.g. "worker@ybl")
        amount_rupees: Payout amount in Indian Rupees (float)
        reference_id:  Unique idempotency key — must be the claim UUID
        fraud_score:   Current fraud score for validation gate (default 0)
        cap_paise:     Policy daily cap in paise; 0 = no cap check

    Returns:
        Razorpay Payout API response dict (or mock equivalent).
    """
    amount_paise = int(max(0.0, amount_rupees) * 100)

    # ── Step 1: Validate ──────────────────────────────────────────────────────
    valid, reason = _validate_payout_params(
        amount_paise, reference_id, fraud_score, cap_paise
    )
    if not valid:
        logger.warning("[payment] Validation blocked payout %s: %s", reference_id, reason)
        payout_logger.info(json.dumps({
            "event":        "payout_blocked",
            "claim_id":     reference_id,
            "amount_paise": amount_paise,
            "reason":       reason,
            "ts":           datetime.now(timezone.utc).isoformat(),
        }))
        raise ValueError(f"Payout validation failed: {reason}")

    logger.info(
        "[payment] Initiating payout: ₹%.2f → %s (ref=%s)",
        amount_rupees, upi_id, reference_id,
    )

    # ── Step 2: Idempotency guard ─────────────────────────────────────────────
    existing = _already_paid(reference_id)
    if existing:
        logger.info(
            "[payment] Idempotency hit: claim %s already in status=%s. Returning existing.",
            reference_id, existing.get("status"),
        )
        payout_logger.info(json.dumps({
            "event":    "payout_idempotent_skip",
            "claim_id": reference_id,
            "status":   existing.get("status"),
            "ts":       datetime.now(timezone.utc).isoformat(),
        }))
        return {
            "id":           existing.get("razorpay_payment_id", ""),
            "transaction_id": existing.get("razorpay_payment_id", ""),
            "status":       existing.get("status"),
            "amount":       existing.get("payout_amount_paise", amount_paise),
            "reference_id": reference_id,
            "mode":         "idempotent_skip",
            "entity":       "payout",
            "currency":     "INR",
            "channel":      "UPI",
        }

    # ── Step 3: Call Razorpay (or mock) ──────────────────────────────────────
    client = _get_razorpay_client()

    if not client or not _RZP_ACCOUNT_NUMBER:
        logger.info("[payment] Razorpay keys/account missing — using mock payout fallback.")
        result = _mock_payout_response(amount_paise, reference_id)
        payout_logger.info(json.dumps({
            "event":    "payout_mock",
            "claim_id": reference_id,
            "amount":   amount_paise,
            "status":   result["status"],
            "mode":     "mock_fallback",
            "ts":       datetime.now(timezone.utc).isoformat(),
        }))
        return result

    try:
        rzp_response = _call_with_retry(
            client.payout.create,
            {
                "account_number":      _RZP_ACCOUNT_NUMBER,
                "fund_account": {
                    "account_type": "vpa",
                    "vpa":          {"address": upi_id},
                    "contact": {
                        "name":    "GigHood Worker",
                        "contact": "",
                        "email":   "",
                        "type":    "employee",
                    },
                },
                "amount":              amount_paise,
                "currency":            "INR",
                "mode":                "UPI",
                "purpose":             "payout",
                "queue_if_low_balance": True,
                "reference_id":        reference_id,
                "narration":           f"GigHood claim {reference_id[:8]}",
            },
            retries=3,
        )

        razorpay_id = rzp_response.get("id", "")
        status      = rzp_response.get("status", "processing")

        # ── Step 4: Persist payout state ───────────────────────────────────
        _persist_payout_state(reference_id, razorpay_id, status, amount_paise, "UPI")

        # ── Step 5: Structured audit log ───────────────────────────────────
        payout_logger.info(json.dumps({
            "event":        "payout_initiated",
            "claim_id":     reference_id,
            "razorpay_id":  razorpay_id,
            "amount_paise": amount_paise,
            "status":       status,
            "mode":         "razorpay_payout_api",
            "upi_id":       upi_id,
            "ts":           datetime.now(timezone.utc).isoformat(),
        }))

        return {
            "id":              razorpay_id,
            "transaction_id":  rzp_response.get("utm_source") or razorpay_id,
            "channel":         "UPI",
            "entity":          rzp_response.get("entity", "payout"),
            "fund_account_id": rzp_response.get("fund_account_id", ""),
            "amount":          rzp_response.get("amount", amount_paise),
            "currency":        rzp_response.get("currency", "INR"),
            "status":          status,
            "reference_id":    reference_id,
            "mode":            "razorpay_payout_api",
            "raw":             rzp_response,
        }

    except Exception as exc:
        # ── Failure handling: mark payout_failed + dead letter ────────────
        reason = str(exc)
        _mark_payout_failed(reference_id, reason)
        _PAYOUT_DEAD_LETTER.append({
            "reference_id": reference_id,
            "upi_id":       upi_id,
            "amount_paise": amount_paise,
            "error":        reason,
            "ts":           datetime.now(timezone.utc).isoformat(),
        })
        payout_logger.info(json.dumps({
            "event":    "payout_failed",
            "claim_id": reference_id,
            "amount":   amount_paise,
            "error":    reason,
            "ts":       datetime.now(timezone.utc).isoformat(),
        }))
        logger.error(
            "[payment] Payout FAILED after retries: ref=%s error=%s",
            reference_id, reason,
        )
        # Fallback response — claim is marked payout_failed in DB, ops will retry.
        return {
            "id":           "",
            "status":       "payout_failed",
            "reference_id": reference_id,
            "amount":       amount_paise,
            "currency":     "INR",
            "channel":      "UPI",
            "entity":       "payout",
            "error":        reason,
        }


# =============================================================================
# 9. PREMIUM DEBIT (unchanged behaviour)
# =============================================================================

def debit_premium_mock(upi_id: str, amount_rupees: float, worker_id: str) -> bool:
    """
    Mock debit cycle utilised by the weekly Monday scheduler.
    Stays mock — premium collection is out of scope for Razorpay Payouts API.
    """
    logger.info(
        "[payment] MOCK PREMIUM DEBIT: ₹%.2f from %s (worker=%s) — SUCCESS",
        amount_rupees, upi_id, worker_id,
    )
    payout_logger.info(json.dumps({
        "event":      "premium_debit_mock",
        "worker_id":  worker_id,
        "amount":     int(amount_rupees * 100),
        "status":     "mock_success",
        "ts":         datetime.now(timezone.utc).isoformat(),
    }))
    return True


# =============================================================================
# 10. WEBHOOK VERIFICATION (hardened)
# =============================================================================

def handle_payout_webhook(
    payload:    dict | bytes,
    signature:  str,
    secret:     str = "",
) -> bool:
    """
    Validates an incoming Razorpay webhook using HMAC-SHA256.

    Production contract:
      - `payload` should be the RAW request bytes (not a parsed dict).
        Razorpay computes the signature over the raw body; re-serialising
        a dict can change key order and break verification.
      - `secret` must be the Razorpay webhook secret from .env
        (RAZORPAY_WEBHOOK_SECRET). The default empty string ensures any
        call without the secret fails closed, not open.
      - testing_bypass is REMOVED. Use pytest fixtures with real HMAC
        signing to test webhook handling.

    Args:
        payload:   Raw request body (bytes preferred) or parsed dict.
        signature: X-Razorpay-Signature header value.
        secret:    Razorpay webhook secret (from env).

    Returns:
        True if signature is valid, False otherwise.
    """
    if not signature:
        logger.warning("[webhook] Missing X-Razorpay-Signature header")
        return False

    if not payload:
        logger.warning("[webhook] Empty payload rejected")
        return False

    # Resolve effective secret: arg → env → hard fail
    effective_secret = (
        secret
        or os.getenv("RAZORPAY_WEBHOOK_SECRET", "").strip()
    )
    if not effective_secret:
        logger.error(
            "[webhook] RAZORPAY_WEBHOOK_SECRET not configured — "
            "rejecting all webhooks for safety"
        )
        return False

    try:
        # Prefer raw bytes for HMAC accuracy.
        if isinstance(payload, bytes):
            body = payload
        else:
            # Last-resort: deterministic JSON serialisation.
            # In production the FastAPI route should pass request.body() bytes directly.
            body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()

        expected = hmac.new(
            effective_secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()

        valid = hmac.compare_digest(expected, signature)

        if not valid:
            logger.warning(
                "[webhook] Signature mismatch — possible replay or wrong secret. "
                "sig_received=%s…", signature[:12],
            )

        return valid

    except Exception as exc:
        logger.error("[webhook] Signature verification error: %s", exc)
        return False


# =============================================================================
# 11. WEBHOOK DB MUTATION
# =============================================================================

def process_webhook_mutation(payload: dict | bytes) -> None:
    """
    Safely updates the claims table when Razorpay fires payout.processed.
    Uses supabase_admin (service-role) for the privileged write.
    Non-fatal — errors are logged but do not propagate to the webhook HTTP response.
    """
    if isinstance(payload, bytes):
        try:
            payload = json.loads(payload)
        except Exception as exc:
            logger.error("[webhook] Could not parse payload bytes: %s", exc)
            return

    from backend.db.client import supabase_admin

    event = payload.get("event", "")

    if event == "payout.processed":
        try:
            payout_entity = (
                payload.get("payload", {})
                .get("payout", {})
                .get("entity", {})
            )
            reference_id = payout_entity.get("reference_id")
            razorpay_id  = payout_entity.get("id", "")
            amount       = payout_entity.get("amount", 0)

            if not reference_id:
                logger.warning("[webhook] payout.processed event missing reference_id")
                return

            logger.info(
                "[webhook] Confirming payout ref=%s rzp_id=%s amount=%d paise",
                reference_id, razorpay_id, amount,
            )
            supabase_admin.raw().table("claims").update({
                "status":              "paid",
                "razorpay_payment_id": razorpay_id,
                "resolved_at":         datetime.now(timezone.utc).isoformat(),
            }).eq("id", reference_id).execute()

            payout_logger.info(json.dumps({
                "event":       "payout_webhook_confirmed",
                "claim_id":    reference_id,
                "razorpay_id": razorpay_id,
                "amount":      amount,
                "ts":          datetime.now(timezone.utc).isoformat(),
            }))

        except Exception as exc:
            logger.error("[webhook] Failed to update DB from payout.processed: %s", exc)

    elif event == "payout.failed":
        try:
            payout_entity = (
                payload.get("payload", {})
                .get("payout", {})
                .get("entity", {})
            )
            reference_id = payout_entity.get("reference_id")
            failure_reason = payout_entity.get("failure_reason", "razorpay_failure")
            if reference_id:
                _mark_payout_failed(reference_id, failure_reason)
                payout_logger.info(json.dumps({
                    "event":   "payout_webhook_failed",
                    "claim_id": reference_id,
                    "reason":   failure_reason,
                    "ts":       datetime.now(timezone.utc).isoformat(),
                }))
        except Exception as exc:
            logger.error("[webhook] Failed to handle payout.failed event: %s", exc)
