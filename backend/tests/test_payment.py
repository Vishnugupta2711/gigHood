import pytest
from backend.services.payment_service import initiate_upi_payout, handle_payout_webhook

def test_initiate_upi_payout_mock():
    """Verify that the mock dictionary returns exactly mirrored Sandbox schema"""
    ref_id = "test_clm_92k4j"
    res = initiate_upi_payout("arjun@ybl", 600.0, ref_id)
    
    assert res["entity"] == "payout"
    assert res["amount"] == 60_000 # INR 600.00 in paise
    assert res["status"] == "processing"
    assert res["reference_id"] == ref_id
    assert res["id"].startswith("pout_")

def test_handle_payout_webhook_testing_bypass():
    """Verify webhooks bypass HMAC authentication correctly during deterministic tests"""
    payload = {
        "event": "payout.processed",
        "testing_bypass": True
    }
    
    assert handle_payout_webhook(payload, "fake_sig") == True

def test_handle_payout_webhook_rejects_empty():
    assert handle_payout_webhook({}, "") == False
