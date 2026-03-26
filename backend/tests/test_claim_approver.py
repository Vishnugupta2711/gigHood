import pytest
from backend.services.claim_approver import route_claim

def test_route_claim_fast_track():
    """Gate2=STRONG + score < 30 -> fast_track"""
    assert route_claim(25, "STRONG") == "fast_track"

def test_route_claim_denied():
    """Gate2=NONE -> denied immediately irrespective of fraud score mock"""
    assert route_claim(99, "NONE") == "denied"
    assert route_claim(10, "NONE") == "denied"

def test_route_claim_active_verify():
    """Score >= 70 -> active_verify manual inspection bounds"""
    assert route_claim(75, "STRONG") == "active_verify"
    assert route_claim(75, "WEAK") == "active_verify"

def test_route_claim_soft_queue():
    """Catch-all for medium scores or WEAK gates seamlessly"""
    assert route_claim(40, "STRONG") == "soft_queue"
    assert route_claim(20, "WEAK") == "soft_queue"
