import pytest
from unittest.mock import patch, MagicMock
from backend.services.notification_service import NotificationService

def test_notification_service_mock_degraded_path():
    """
    Validates Firebase skips executions completely when disabled natively,
    ensuring claims pipeline handles missing .env safely.
    """
    # Setup mock without firebase available
    svc = NotificationService()
    svc.enabled = False
    
    # Should resolve gracefully as True inside mock mode bridging logging.
    res = svc.send_push("fake-iphone-token", "Title", "Body", {})
    assert res is True

@patch("backend.services.notification_service.messaging")
def test_notification_templates(mock_messaging):
    """
    Validates static template definitions mapping accurate variables across FCM payloads.
    """
    svc = NotificationService()
    svc.enabled = True
    
    # Payout Template
    res1 = svc.notify_payout_credited("device-1", 450.0, "A")
    assert res1 is True
    
    # Ensure correct object bounds matched
    msg_args = mock_messaging.Message.call_args[1]
    assert msg_args['token'] == "device-1"
    
    notif_args = mock_messaging.Notification.call_args[1]
    assert "Fast-Track" in notif_args['title']
    assert "₹450.0" in notif_args['body']
    
    assert msg_args['data']["type"] == "PAYOUT_CREDIT"

    # Elevated Watch Template
    res2 = svc.notify_elevated_watch("device-2", "89283082803ffff", "DISRUPTED")
    assert res2 is True
    
    # Claim Flagged
    res3 = svc.notify_claim_flagged("device-3")
    assert res3 is True
