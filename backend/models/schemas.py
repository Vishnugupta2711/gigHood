# =============================================================================
# backend/models/schemas.py — Pydantic v2 Request/Response Models
# =============================================================================
# Single source of truth for all data shapes flowing in and out of the
# gigHood API. Every FastAPI route, service function, and scheduler job
# uses these schemas for validation, serialisation, and documentation.
#
# Organisation (top → bottom):
#   1.  Shared primitives & enums (mirrors DB ENUMs from migration 000)
#   2.  Worker schemas         (001)
#   3.  Hex zone schemas       (002)
#   4.  Policy schemas         (003)
#   5.  Signal cache schemas   (004)
#   6.  DCI history schemas    (005)
#   7.  Location ping schemas  (006)
#   8.  Disruption event schemas (007)
#   9.  Claim schemas          (008)
#   10. Fraud flag schemas     (009)
#   11. Premium payment schemas (010)
#   12. Auth schemas
#   13. Chat / AI schemas
#   14. Admin dashboard schemas
#   15. Scheduler / internal schemas
#
# Design decisions:
#   • All monetary values in PAISE (int) matching the DB schema.
#     Response models include a computed `*_inr` float field for display.
#   • h3index stored as str (the H3 hex string, e.g. '892830828dfffff').
#   • Timestamps as datetime — FastAPI serialises to ISO 8601 automatically.
#   • Enums defined here mirror DB ENUMs exactly (same values, same names).
#   • Input schemas (request bodies) use strict validators.
#   • Output schemas (responses) use model_config with from_attributes=True
#     so they can be constructed directly from asyncpg Record objects or
#     Supabase response dicts.
#   • BaseResponse wraps all API responses with a consistent envelope.
# =============================================================================

from __future__ import annotations

import re
from datetime import date, datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
    model_validator,
)


# =============================================================================
# 0. BASE MODELS & SHARED CONFIG
# =============================================================================

class _ReadModel(BaseModel):
    """Base for all response models — reads from ORM/dict attributes."""
    model_config = ConfigDict(
        from_attributes=True,   # asyncpg Record + supabase-py dicts
        populate_by_name=True,  # accept both alias and field name
        use_enum_values=True,   # serialise enums as their string values
    )


class _WriteModel(BaseModel):
    """Base for all request body models — strict, no extra fields."""
    model_config = ConfigDict(
        extra="forbid",
        use_enum_values=True,
        str_strip_whitespace=True,
    )


class BaseResponse(_ReadModel):
    """
    Standard API response envelope.
    All endpoints return this or a subclass.
    """
    success: bool = True
    message: Optional[str] = None


class PaginatedResponse(BaseResponse):
    total: int
    page: int = 1
    page_size: int = 20
    has_more: bool = False


# =============================================================================
# 1. SHARED ENUMS (mirror DB ENUMs from migration 000)
# =============================================================================

class WorkerTier(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class ZoneStatus(str, Enum):
    NORMAL          = "NORMAL"
    ELEVATED_WATCH  = "ELEVATED_WATCH"
    DISRUPTED       = "DISRUPTED"


class ClaimPath(str, Enum):
    FAST_TRACK    = "FAST_TRACK"
    SOFT_QUEUE    = "SOFT_QUEUE"
    ACTIVE_VERIFY = "ACTIVE_VERIFY"
    DENIED        = "DENIED"


class DeliveryPlatform(str, Enum):
    ZEPTO     = "ZEPTO"
    BLINKIT   = "BLINKIT"
    INSTAMART = "INSTAMART"
    OTHER     = "OTHER"


class TriggerType(str, Enum):
    WEATHER  = "WEATHER"
    AQI      = "AQI"
    TRAFFIC  = "TRAFFIC"
    PLATFORM = "PLATFORM"
    SOCIAL   = "SOCIAL"


class PolicyStatus(str, Enum):
    WAITING   = "WAITING"
    ACTIVE    = "ACTIVE"
    EXPIRED   = "EXPIRED"
    CANCELLED = "CANCELLED"


class PayoutChannel(str, Enum):
    UPI     = "UPI"
    IMPS    = "IMPS"
    SANDBOX = "SANDBOX"


class WorkerStatus(str, Enum):
    ONBOARDING = "ONBOARDING"
    WAITING    = "WAITING"
    ACTIVE     = "ACTIVE"
    INACTIVE   = "INACTIVE"
    SUSPENDED  = "SUSPENDED"


class PreferredLanguage(str, Enum):
    hi = "hi"   # Hindi
    kn = "kn"   # Kannada
    ta = "ta"   # Tamil
    te = "te"   # Telugu
    en = "en"   # English


class ClaimStatus(str, Enum):
    INITIATED        = "INITIATED"
    FAST_TRACK       = "FAST_TRACK"
    SOFT_QUEUE       = "SOFT_QUEUE"
    ACTIVE_VERIFY    = "ACTIVE_VERIFY"
    PAID             = "PAID"
    DENIED           = "DENIED"
    APPEALED         = "APPEALED"
    APPEAL_APPROVED  = "APPEAL_APPROVED"
    APPEAL_DENIED    = "APPEAL_DENIED"
    ROLLED_BACK      = "ROLLED_BACK"


class Gate2OrderActivity(str, Enum):
    STRONG                = "STRONG"
    WEAK                  = "WEAK"
    NO_CONFIRMATION       = "NO_CONFIRMATION"
    PENDING               = "PENDING"
    PLATFORM_UNAVAILABLE  = "PLATFORM_UNAVAILABLE"


class DisruptionSeverity(str, Enum):
    MINOR       = "MINOR"
    MODERATE    = "MODERATE"
    SEVERE      = "SEVERE"
    CATASTROPHIC = "CATASTROPHIC"


class DisruptionEventStatus(str, Enum):
    ACTIVE   = "ACTIVE"
    CLEARING = "CLEARING"
    CLOSED   = "CLOSED"
    VOIDED   = "VOIDED"


class PaymentStatus(str, Enum):
    INITIATED        = "INITIATED"
    PENDING_WEBHOOK  = "PENDING_WEBHOOK"
    CONFIRMED        = "CONFIRMED"
    FAILED           = "FAILED"
    RETRYING         = "RETRYING"
    CANCELLED        = "CANCELLED"
    REFUNDED         = "REFUNDED"
    DISPUTED         = "DISPUTED"


class CoordinateJitterPattern(str, Enum):
    UNKNOWN     = "UNKNOWN"
    NATURAL     = "NATURAL"
    ALGORITHMIC = "ALGORITHMIC"
    STATIC      = "STATIC"


class PingSource(str, Enum):
    FOREGROUND               = "FOREGROUND"
    BACKGROUND_WORKMANAGER   = "BACKGROUND_WORKMANAGER"
    BACKGROUND_BGTASK        = "BACKGROUND_BGTASK"
    FALLBACK_PLATFORM_GPS    = "FALLBACK_PLATFORM_GPS"


class SignalFetchStatus(str, Enum):
    SUCCESS          = "SUCCESS"
    TIMEOUT          = "TIMEOUT"
    HTTP_ERROR       = "HTTP_ERROR"
    PARSE_ERROR      = "PARSE_ERROR"
    RATE_LIMITED     = "RATE_LIMITED"
    MOCK             = "MOCK"
    CACHED_FALLBACK  = "CACHED_FALLBACK"


# =============================================================================
# 2. WORKER SCHEMAS
# =============================================================================

# --- Validators ---

_INDIAN_PHONE_RE = re.compile(r"^[6-9][0-9]{9}$")
_UPI_RE          = re.compile(r"^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$")
_IFSC_RE         = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


class WorkerRegisterRequest(_WriteModel):
    """Step 1–2: Phone registration and OTP verification."""
    phone: str = Field(..., description="10-digit Indian mobile number (no country code)")
    name: Optional[str] = Field(None, max_length=100)
    preferred_language: PreferredLanguage = PreferredLanguage.en

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().lstrip("+91").lstrip("91")
        if not _INDIAN_PHONE_RE.match(v):
            raise ValueError(
                "Phone must be a 10-digit Indian mobile number starting with 6–9"
            )
        return v


class WorkerOnboardingRequest(_WriteModel):
    """Steps 3–6: Complete worker onboarding profile."""
    name: str                       = Field(..., min_length=2, max_length=100)
    city: str                       = Field(..., min_length=2, max_length=50)
    dark_store_zone: Optional[str]  = Field(None, max_length=100)
    registration_lat: float         = Field(..., ge=6.0, le=37.0,
                                           description="Latitude (India bounds)")
    registration_lng: float         = Field(..., ge=68.0, le=97.0,
                                           description="Longitude (India bounds)")
    platform: DeliveryPlatform      = DeliveryPlatform.ZEPTO
    platform_worker_id: Optional[str] = Field(None, max_length=100)
    avg_daily_earnings_paise: int   = Field(
        ..., ge=10000, le=150000,
        description="Declared average daily earnings in paise (₹100–₹1500)",
    )
    upi_id: Optional[str]           = Field(None, max_length=100)
    preferred_language: PreferredLanguage = PreferredLanguage.en

    @field_validator("upi_id")
    @classmethod
    def validate_upi(cls, v: Optional[str]) -> Optional[str]:
        if v and not _UPI_RE.match(v):
            raise ValueError("UPI ID must be in format localpart@provider")
        return v


class WorkerProfileResponse(_ReadModel):
    id: UUID
    phone: str
    name: Optional[str]
    city: Optional[str]
    dark_store_zone: Optional[str]
    registered_hex_id: Optional[str]    = Field(None, description="H3 cell at resolution 9")
    registration_lat: Optional[float]
    registration_lng: Optional[float]
    platform: Optional[DeliveryPlatform]
    platform_id_verified: bool
    tier: WorkerTier
    trust_score: int                    = Field(..., ge=0, le=100)
    status: WorkerStatus
    avg_daily_earnings_paise: Optional[int]
    upi_id: Optional[str]
    upi_verified: bool
    preferred_language: PreferredLanguage
    rolling_dci_4w_avg: float
    active_days_last_30: int
    created_at: datetime
    onboarding_completed_at: Optional[datetime]

    @computed_field
    @property
    def avg_daily_earnings_inr(self) -> Optional[float]:
        if self.avg_daily_earnings_paise:
            return round(self.avg_daily_earnings_paise / 100, 2)
        return None


class WorkerZoneRiskResponse(_ReadModel):
    """Worker app Zone Risk Dashboard payload."""
    hex_id: str
    zone_label: Optional[str]
    city: str
    current_dci: float
    dci_status: ZoneStatus
    signal_weather: float
    signal_traffic: float
    signal_platform: float
    signal_social: float
    zone_risk_tier: WorkerTier
    next_week_risk_score: float
    active_worker_count: int
    is_degraded_mode: bool
    last_computed_at: Optional[datetime]


# =============================================================================
# 3. HEX ZONE SCHEMAS
# =============================================================================

class HexZoneBase(_ReadModel):
    hex_id: str
    city: str
    ward: Optional[str]
    zone_label: Optional[str]
    dci_status: ZoneStatus
    current_dci: float
    zone_risk_tier: WorkerTier
    active_worker_count: int
    active_policy_count: int
    pool_viable: bool
    is_active: bool


class HexZoneDetailResponse(HexZoneBase):
    """Full hex zone detail for admin dashboard."""
    h3_resolution: int
    signal_weather: float
    signal_traffic: float
    signal_platform: float
    signal_social: float
    weight_alpha: float
    weight_beta: float
    weight_gamma: float
    weight_delta: float
    signal_sources_available: int
    is_degraded_mode: bool
    rolling_dci_4w: float
    rolling_dci_8w: float
    rolling_dci_12w: float
    next_week_risk_score: float
    upgrade_alert_sent: bool
    disruption_count_30d: int
    disruption_count_90d: int
    disruption_count_total: int
    burning_cost_rate: float
    enrolment_suspended: bool
    weekly_premium_pool_paise: int
    total_payout_30d_paise: int
    last_computed_at: Optional[datetime]
    disruption_started_at: Optional[datetime]
    disruption_cleared_at: Optional[datetime]
    centroid_lat: Optional[float]
    centroid_lng: Optional[float]
    boundary_geojson: Optional[dict]

    @computed_field
    @property
    def weekly_premium_pool_inr(self) -> float:
        return round(self.weekly_premium_pool_paise / 100, 2)

    @computed_field
    @property
    def total_payout_30d_inr(self) -> float:
        return round(self.total_payout_30d_paise / 100, 2)


class HexZoneListResponse(PaginatedResponse):
    data: list[HexZoneBase]


class HexDCITrendPoint(_ReadModel):
    hex_id: str
    computed_at: datetime
    dci_score: float
    zone_status: ZoneStatus
    active_triggers: int
    is_degraded_computation: bool


class HexDCITrendResponse(BaseResponse):
    hex_id: str
    trend: list[HexDCITrendPoint]


# =============================================================================
# 4. POLICY SCHEMAS
# =============================================================================

class PolicyCreateRequest(_WriteModel):
    """Triggered by the weekly scheduler — not a direct API endpoint."""
    worker_id: UUID
    tier: WorkerTier
    week_start: date
    is_upgrade: bool = False
    upgraded_from_tier: Optional[WorkerTier] = None

    @model_validator(mode="after")
    def validate_upgrade_consistency(self) -> "PolicyCreateRequest":
        if self.is_upgrade and not self.upgraded_from_tier:
            raise ValueError("upgraded_from_tier must be set when is_upgrade=True")
        return self

    @field_validator("week_start")
    @classmethod
    def validate_monday(cls, v: date) -> date:
        if v.weekday() != 0:  # 0 = Monday
            raise ValueError(f"week_start must be a Monday, got {v.strftime('%A')}")
        return v


class PolicyResponse(_ReadModel):
    id: UUID
    worker_id: UUID
    hex_id: str
    city: str
    tier: WorkerTier
    weekly_premium_paise: int
    coverage_cap_daily_paise: int
    effective_daily_cap_paise: int
    payout_maturation_cap_paise: int
    is_waiting_period: bool
    waiting_period_ends_at: Optional[datetime]
    week_start: date
    week_end: date
    status: PolicyStatus
    payment_status: Optional[str]
    is_upgrade: bool
    upgraded_from_tier: Optional[WorkerTier]
    renewal_count: int
    dci_at_creation: float
    adverse_selection_flag: bool
    total_payouts_paise: int
    payout_event_count: int
    created_at: datetime

    @computed_field
    @property
    def weekly_premium_inr(self) -> float:
        return round(self.weekly_premium_paise / 100, 2)

    @computed_field
    @property
    def effective_daily_cap_inr(self) -> float:
        return round(self.effective_daily_cap_paise / 100, 2)

    @computed_field
    @property
    def total_payouts_inr(self) -> float:
        return round(self.total_payouts_paise / 100, 2)


class TierUpgradeOfferResponse(BaseResponse):
    """Sunday evening proactive tier upgrade alert payload."""
    worker_id: UUID
    hex_id: str
    current_tier: WorkerTier
    upgrade_tier: WorkerTier
    current_premium_paise: int
    upgrade_premium_paise: int
    current_daily_cap_paise: int
    upgrade_daily_cap_paise: int
    next_week_risk_score: float
    offer_expires_at: datetime
    offer_message: str

    @computed_field
    @property
    def upgrade_premium_inr(self) -> float:
        return round(self.upgrade_premium_paise / 100, 2)


class TierUpgradeConfirmRequest(_WriteModel):
    worker_id: UUID
    accept: bool = True


# =============================================================================
# 5. SIGNAL CACHE SCHEMAS
# =============================================================================

class SignalUpsertRequest(_WriteModel):
    """Internal schema — called by signal_fetchers.py, not directly by API."""
    hex_id: str
    signal_type: TriggerType
    normalized_score: float       = Field(..., ge=0.0)
    fetch_status: SignalFetchStatus
    api_endpoint: Optional[str]   = None
    api_response_ms: Optional[int]= None
    http_status_code: Optional[int]= None
    raw_data: Optional[dict]      = None
    # Typed signal fields (nullable — only relevant ones populated per signal type)
    rainfall_mm_hr: Optional[float]         = None
    wind_speed_km_hr: Optional[float]       = None
    temperature_celsius: Optional[float]    = None
    aqi_value: Optional[int]               = None
    aqi_category: Optional[str]            = None
    dominant_pollutant: Optional[str]      = None
    congestion_index: Optional[float]      = None
    incident_count: Optional[int]          = None
    order_volume_drop_pct: Optional[float] = None
    platform_api_latency_ms: Optional[int] = None
    platform_status_flag: Optional[int]    = None
    curfew_active: Optional[bool]          = None
    strike_active: Optional[bool]          = None
    social_severity_score: Optional[float] = None
    social_event_description: Optional[str]= None


class SignalCacheResponse(_ReadModel):
    id: int
    hex_id: str
    signal_type: TriggerType
    normalized_score: float
    fetch_status: SignalFetchStatus
    threshold_breached: bool
    threshold_breach_detail: Optional[str]
    source_available: bool
    consecutive_failures: int
    is_stale: bool
    fetched_at: datetime
    last_successful_fetch_at: Optional[datetime]
    api_response_ms: Optional[int]
    # Typed fields
    rainfall_mm_hr: Optional[float]
    wind_speed_km_hr: Optional[float]
    aqi_value: Optional[int]
    congestion_index: Optional[float]
    order_volume_drop_pct: Optional[float]
    curfew_active: Optional[bool]
    strike_active: Optional[bool]


class HexSignalSummary(_ReadModel):
    """Aggregated signal state for a hex — output of fn_get_hex_signals()."""
    hex_id: str
    weather_score: float
    aqi_score: float
    traffic_score: float
    platform_score: float
    social_score: float
    sources_available: int
    weather_breached: bool
    aqi_breached: bool
    traffic_breached: bool
    platform_breached: bool
    social_breached: bool
    oldest_fetch_at: Optional[datetime]
    any_stale: bool


# =============================================================================
# 6. DCI HISTORY SCHEMAS
# =============================================================================

class DCIComputationRecord(_ReadModel):
    """Single DCI computation record from dci_history."""
    id: int
    hex_id: str
    dci_score: float
    dci_raw_sum: float
    w_score: float
    t_score: float
    p_score: float
    s_score: float
    alpha: float
    beta: float
    gamma: float
    delta: float
    status_before: ZoneStatus
    status_after: ZoneStatus
    is_transition_to_disrupted: bool
    is_transition_to_cleared: bool
    trigger_weather_breached: bool
    trigger_aqi_breached: bool
    trigger_traffic_breached: bool
    trigger_platform_breached: bool
    trigger_social_breached: bool
    trigger_breach_count: int
    signal_sources_available: int
    is_degraded_computation: bool
    computation_duration_ms: Optional[int]
    computed_at: datetime


class DCIInsertRequest(_WriteModel):
    """Internal schema — called by dci_engine.py, not a public API endpoint."""
    hex_id: str
    dci_score: float              = Field(..., ge=0.0, le=1.0)
    w_score: float
    t_score: float
    p_score: float
    s_score: float
    alpha: float                  = Field(default=0.45)
    beta: float                   = Field(default=0.25)
    gamma: float                  = Field(default=0.20)
    delta: float                  = Field(default=0.10)
    status_before: ZoneStatus
    status_after: ZoneStatus
    signal_sources_available: int = Field(..., ge=0, le=5)
    signal_cache_snapshot_ids: Optional[list[int]] = None
    computation_duration_ms: Optional[int]         = None
    model_version: Optional[str]                   = None
    weather_breached: bool        = False
    aqi_breached: bool            = False
    traffic_breached: bool        = False
    platform_breached: bool       = False
    social_breached: bool         = False
    active_worker_count: int      = 0


class RollingAverageResult(_ReadModel):
    """Output of fn_refresh_rolling_dci_averages()."""
    hex_id: str
    new_dci_4w: float
    new_dci_8w: float
    new_dci_12w: float
    new_tier: WorkerTier
    prev_tier: Optional[WorkerTier]


# =============================================================================
# 7. LOCATION PING SCHEMAS
# =============================================================================

class LocationPingRequest(_WriteModel):
    """Submitted by mobile app every 15 minutes."""
    worker_id: UUID
    latitude: float               = Field(..., ge=6.0, le=37.0)
    longitude: float              = Field(..., ge=68.0, le=97.0)
    accuracy_radius_m: Optional[float]      = Field(None, ge=0, le=5000)
    gps_accuracy_confidence: Optional[float]= Field(None, ge=0.0, le=1.0)
    network_signal_strength_dbm: Optional[int] = Field(None, ge=-150, le=0)
    network_type: Optional[str]   = Field(None, pattern="^(2G|3G|4G|5G|WIFI|UNKNOWN)$")
    mock_location_os_level: bool  = False
    mock_location_app_level: bool = False
    battery_is_charging: Optional[bool]     = None
    battery_level_pct: Optional[int]        = Field(None, ge=0, le=100)
    screen_on: Optional[bool]               = None
    ping_source: PingSource       = PingSource.BACKGROUND_WORKMANAGER
    app_version: Optional[str]    = None
    ping_hmac: Optional[str]      = Field(
        None,
        pattern="^[a-f0-9]{64}$",
        description="SHA-256 HMAC of ping payload for tamper detection",
    )
    pinged_at: Optional[datetime] = None    # Client-side timestamp; server uses received_at


class LocationPingResponse(BaseResponse):
    ping_id: int
    ping_hex_id: Optional[str]
    is_in_registered_hex: bool
    velocity_from_prev_ms: Optional[float]


class PoPValidationResult(_ReadModel):
    """Output of fn_validate_pop() — Gate 1 + Gate 3 combined result."""
    ping_count_in_window: int
    ping_count_in_hex: int
    pop_validated: bool
    fallback_required: bool
    lat_std_dev: float
    lng_std_dev: float
    accuracy_std_dev: float
    coordinate_variance_score: float
    jitter_pattern: CoordinateJitterPattern
    first_ping_in_hex_at: Optional[datetime]
    last_ping_outside_hex_at: Optional[datetime]
    entry_velocity_ms: Optional[float]
    entry_velocity_kmh: Optional[float]
    gate3_velocity_violation: bool
    any_mock_os_detected: bool
    pct_pings_charging: float
    pct_pings_on_wifi: float
    avg_network_signal_dbm: float
    signal_dbm_std_dev: float
    pct_pings_in_registered_hex: float
    avg_offline_delay_sec: float


# =============================================================================
# 8. DISRUPTION EVENT SCHEMAS
# =============================================================================

class DisruptionEventResponse(_ReadModel):
    id: UUID
    hex_id: str
    city: str
    status: DisruptionEventStatus
    severity: DisruptionSeverity
    dci_at_onset: float
    dci_peak: float
    started_at: datetime
    ended_at: Optional[datetime]
    verified_disrupted_minutes: int
    verified_disrupted_hours: float
    trigger_count_at_onset: int
    trigger_weather_at_onset: bool
    trigger_aqi_at_onset: bool
    trigger_traffic_at_onset: bool
    trigger_platform_at_onset: bool
    trigger_social_at_onset: bool
    affected_policy_count: int
    claim_count: int
    denied_claim_count: int
    total_payouts_paise: int
    weekly_premium_pool_paise: int
    event_loss_ratio: Optional[float]
    catastrophic_event_flag: bool
    is_multi_hex_event: bool
    had_degraded_cycles: bool
    regulatory_description: Optional[str]
    created_at: datetime

    @computed_field
    @property
    def total_payouts_inr(self) -> float:
        return round(self.total_payouts_paise / 100, 2)


class ActiveDisruptionSummary(_ReadModel):
    """Lightweight event card for admin dashboard live disruption panel."""
    event_id: UUID
    hex_id: str
    city: str
    zone_label: Optional[str]
    status: DisruptionEventStatus
    severity: DisruptionSeverity
    dci_peak: float
    current_dci: float
    started_at: datetime
    verified_disrupted_hours: float
    affected_policy_count: int
    claim_count: int
    trigger_count_at_onset: int
    minutes_active: int
    catastrophic_event_flag: bool


class DisruptionEventListResponse(PaginatedResponse):
    data: list[DisruptionEventResponse]


# =============================================================================
# 9. CLAIM SCHEMAS
# =============================================================================

class ClaimResponse(_ReadModel):
    id: UUID
    worker_id: UUID
    policy_id: UUID
    disruption_event_id: UUID
    status: ClaimStatus
    resolution_path: Optional[ClaimPath]
    pop_validated: bool
    pop_ping_count: int
    pop_jitter_pattern: CoordinateJitterPattern
    pop_velocity_violation: bool
    gate2_result: Gate2OrderActivity
    gate2_order_count: int
    fraud_score_total: int
    payout_amount_paise: int
    disrupted_hours_used: float
    worker_explanation_text: Optional[str]
    sla_target_seconds: Optional[int]
    sla_actual_seconds: Optional[int]
    sla_breached: Optional[bool]
    payment_confirmed_at: Optional[datetime]
    denial_reason_text: Optional[str]
    denial_appeal_deadline: Optional[datetime]
    is_appeal: bool
    created_at: datetime
    resolved_at: Optional[datetime]

    @computed_field
    @property
    def payout_amount_inr(self) -> float:
        return round(self.payout_amount_paise / 100, 2)


class ClaimFraudBreakdown(_ReadModel):
    """Full fraud score decomposition for admin claim review."""
    claim_id: UUID
    fraud_score_total: int
    gate2_result: Gate2OrderActivity
    fraud_gate1_static_device: bool
    fraud_gate1_weight: int
    fraud_gate2_no_confirmation: bool
    fraud_gate2_weight: int
    fraud_mock_location_flag: bool
    fraud_mock_location_weight: int
    fraud_registration_cohort_flag: bool
    fraud_registration_cohort_weight: int
    fraud_model_concentration_flag: bool
    fraud_model_concentration_weight: int
    fraud_participation_variance_flag: bool
    fraud_participation_variance_weight: int
    fraud_entry_window_flag: bool
    fraud_entry_window_weight: int
    fraud_declaration_clustering_flag: bool
    fraud_declaration_clustering_weight: int
    fraud_earnings_inflation_flag: bool
    fraud_claim_frequency_flag: bool
    pop_coordinate_variance: float
    pop_jitter_pattern: CoordinateJitterPattern
    pop_entry_velocity_kmh: Optional[float]
    pop_velocity_violation: bool


class ClaimWorkerHistoryItem(_ReadModel):
    """Worker Protection History screen — single claim card."""
    claim_id: UUID
    status: ClaimStatus
    resolution_path: Optional[ClaimPath]
    payout_amount_inr: float
    disrupted_hours_used: float
    worker_explanation_text: Optional[str]
    payment_confirmed_at: Optional[datetime]
    denial_reason_text: Optional[str]
    denial_appeal_deadline: Optional[datetime]
    is_appeal: bool
    disruption_started_at: datetime
    dci_peak: float
    disruption_severity: DisruptionSeverity
    trigger_count_at_onset: int
    zone_label: Optional[str]
    event_detected_at: datetime


class PendingClaimQueueItem(_ReadModel):
    """Entry in pending_claims_queue view — for payment_service polling."""
    claim_id: UUID
    worker_id: UUID
    policy_id: UUID
    disruption_event_id: UUID
    status: ClaimStatus
    resolution_path: ClaimPath
    fraud_score_total: int
    gate2_result: Gate2OrderActivity
    pop_validated: bool
    payout_amount_paise: int
    disrupted_hours_used: float
    sla_target_seconds: Optional[int]
    sla_seconds_remaining: Optional[int]
    worker_upi_id_at_payout: Optional[str]
    fcm_device_token: Optional[str]
    trust_score: int
    upi_id: Optional[str]
    upi_verified: bool

    @computed_field
    @property
    def payout_amount_inr(self) -> float:
        return round(self.payout_amount_paise / 100, 2)


class AppealRequest(_WriteModel):
    claim_id: UUID
    appeal_reason: str = Field(..., min_length=10, max_length=1000)


class ActiveVerifyRequest(_WriteModel):
    """1-tap GPS confirm from worker during ACTIVE_VERIFY path."""
    claim_id: UUID
    worker_id: UUID
    latitude: float  = Field(..., ge=6.0, le=37.0)
    longitude: float = Field(..., ge=68.0, le=97.0)


# =============================================================================
# 10. FRAUD FLAG SCHEMAS
# =============================================================================

class FraudFlagType(str, Enum):
    GATE1_STATIC_DEVICE            = "GATE1_STATIC_DEVICE"
    GATE1_ALGORITHMIC_JITTER       = "GATE1_ALGORITHMIC_JITTER"
    GATE1_UNIFORM_ACCURACY         = "GATE1_UNIFORM_ACCURACY"
    GATE2_NO_CONFIRMATION          = "GATE2_NO_CONFIRMATION"
    GATE2_WEAK_ONLINE_NO_ORDERS    = "GATE2_WEAK_ONLINE_NO_ORDERS"
    GATE2_MICRO_DELIVERY_EXCLUDED  = "GATE2_MICRO_DELIVERY_EXCLUDED"
    GATE2_PARTIAL_ACTIVITY         = "GATE2_PARTIAL_ACTIVITY"
    GATE3_VELOCITY_VIOLATION       = "GATE3_VELOCITY_VIOLATION"
    MOCK_LOCATION_OS_LEVEL         = "MOCK_LOCATION_OS_LEVEL"
    MOCK_LOCATION_APP_LEVEL        = "MOCK_LOCATION_APP_LEVEL"
    BATTERY_CHARGING_OUTDOOR       = "BATTERY_CHARGING_OUTDOOR"
    WIFI_DURING_DELIVERY           = "WIFI_DURING_DELIVERY"
    REGISTRATION_COHORT            = "REGISTRATION_COHORT"
    DEVICE_MODEL_CONCENTRATION     = "DEVICE_MODEL_CONCENTRATION"
    COORDINATED_ENTRY_WINDOW       = "COORDINATED_ENTRY_WINDOW"
    DISTRIBUTED_RING_DETECTED      = "DISTRIBUTED_RING_DETECTED"
    MOCK_LOCATION_NETWORK          = "MOCK_LOCATION_NETWORK"
    CAPACITY_VIOLATION             = "CAPACITY_VIOLATION"
    SOFT_FLAG_EARNINGS_INFLATION   = "SOFT_FLAG_EARNINGS_INFLATION"
    SOFT_FLAG_CLAIM_FREQUENCY      = "SOFT_FLAG_CLAIM_FREQUENCY"
    SOFT_FLAG_PARTICIPATION_VARIANCE = "SOFT_FLAG_PARTICIPATION_VARIANCE"
    SOFT_FLAG_DECLARATION_CLUSTERING = "SOFT_FLAG_DECLARATION_CLUSTERING"
    PRE_CLAIM_MOCK_DETECTED_AT_PING = "PRE_CLAIM_MOCK_DETECTED_AT_PING"
    PRE_CLAIM_VELOCITY_AT_PING     = "PRE_CLAIM_VELOCITY_AT_PING"
    PRE_CLAIM_ADVERSE_SELECTION    = "PRE_CLAIM_ADVERSE_SELECTION"
    FLAG_RETRACTED                 = "FLAG_RETRACTED"
    FLAG_UPHELD                    = "FLAG_UPHELD"


class FraudFlagResolution(str, Enum):
    PENDING      = "PENDING"
    UPHELD       = "UPHELD"
    RETRACTED    = "RETRACTED"
    AUTO_CLEARED = "AUTO_CLEARED"


class FraudFlagSummaryItem(_ReadModel):
    """Per-flag item from fn_get_claim_fraud_summary() — worker-visible."""
    flag_id: int
    flag_type: FraudFlagType
    score_contribution: int
    was_deciding_factor: bool
    resolution: FraudFlagResolution
    flagged_at: datetime
    worker_explanation: str


class FraudFlagClaimSummaryResponse(BaseResponse):
    claim_id: UUID
    flags: list[FraudFlagSummaryItem]
    total_score: int


class ClusterRingSummaryResponse(BaseResponse):
    cluster_event_id: UUID
    unique_workers_flagged: int
    ring_size: Optional[int]
    flag_types: list[FraudFlagType]
    total_score_contribution: int
    upheld_count: int
    retracted_count: int
    pending_count: int
    first_detected_at: datetime
    last_detected_at: datetime


# =============================================================================
# 11. PREMIUM PAYMENT SCHEMAS
# =============================================================================

class PremiumPaymentResponse(_ReadModel):
    id: int
    worker_id: UUID
    policy_id: UUID
    hex_id: str
    city: str
    tier: WorkerTier
    week_start: date
    week_end: date
    amount_paise: int
    net_premium_paise: Optional[int]
    reserve_fund_contribution_paise: int
    status: PaymentStatus
    payment_channel: PayoutChannel
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    upi_vpa_used: Optional[str]
    failure_reason: Optional[str]
    attempt_count: int
    refund_issued: bool
    refund_amount_paise: Optional[int]
    confirmed_at: Optional[datetime]
    initiated_at: datetime

    @computed_field
    @property
    def amount_inr(self) -> float:
        return round(self.amount_paise / 100, 2)

    @computed_field
    @property
    def refund_inr(self) -> float:
        return round((self.refund_amount_paise or 0) / 100, 2)


class WeeklyPoolSummaryItem(_ReadModel):
    city: str
    hex_id: str
    week_start: date
    tier: WorkerTier
    confirmed_policies: int
    total_premium_paise: int
    net_premium_paise: int
    reserve_contribution_paise: int
    upgrade_count: int
    refund_count: int
    total_refunded_paise: int
    reconciliation_pct: float

    @computed_field
    @property
    def total_premium_inr(self) -> float:
        return round(self.total_premium_paise / 100, 2)

    @computed_field
    @property
    def net_premium_inr(self) -> float:
        return round(self.net_premium_inr / 100, 2)


# =============================================================================
# 12. AUTH SCHEMAS
# =============================================================================

class OTPSendRequest(_WriteModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().lstrip("+91").lstrip("91")
        if not _INDIAN_PHONE_RE.match(v):
            raise ValueError("Invalid Indian mobile number")
        return v


class OTPVerifyRequest(_WriteModel):
    phone: str
    otp: str = Field(..., min_length=4, max_length=8, pattern=r"^\d+$")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().lstrip("+91").lstrip("91")
        if not _INDIAN_PHONE_RE.match(v):
            raise ValueError("Invalid Indian mobile number")
        return v


class AuthTokenResponse(BaseResponse):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    worker_id: UUID
    is_new_worker: bool
    onboarding_step: Optional[int]


class FCMTokenUpdateRequest(_WriteModel):
    fcm_token: str = Field(..., min_length=10)


# =============================================================================
# 13. CHAT / AI SCHEMAS
# =============================================================================

class ChatMessage(_WriteModel):
    role: str    = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(_WriteModel):
    message: str        = Field(..., min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    language: PreferredLanguage = PreferredLanguage.en


class ChatResponse(BaseResponse):
    reply: str
    language: PreferredLanguage
    model_used: str
    tokens_used: Optional[int]


class WorkerChatContext(_ReadModel):
    """Injected into each chat session as system context."""
    worker_name: Optional[str]
    tier: Optional[WorkerTier]
    zone_label: Optional[str]
    current_dci: Optional[float]
    dci_status: Optional[ZoneStatus]
    weekly_premium_inr: Optional[float]
    effective_daily_cap_inr: Optional[float]
    last_payout_inr: Optional[float]
    last_payout_at: Optional[datetime]
    trust_score: Optional[int]
    preferred_language: PreferredLanguage


# =============================================================================
# 14. ADMIN DASHBOARD SCHEMAS
# =============================================================================

class AdminDashboardSummary(BaseResponse):
    """Top-level summary for the admin dashboard home panel."""
    # Pool health
    total_active_policies: int
    total_weekly_premium_paise: int
    total_payouts_30d_paise: int
    pool_loss_ratio_30d: float
    reserve_fund_total_paise: int

    # Live disruption state
    active_disruption_count: int
    hexes_in_elevated_watch: int
    hexes_in_normal: int
    catastrophic_events_this_month: int

    # Claims
    claims_fast_track_today: int
    claims_soft_queue_pending: int
    claims_denied_today: int
    sla_breach_count_today: int

    # Fraud
    fraud_flags_pending_review: int
    cluster_rings_detected_30d: int

    computed_at: datetime

    @computed_field
    @property
    def total_weekly_premium_inr(self) -> float:
        return round(self.total_weekly_premium_paise / 100, 2)

    @computed_field
    @property
    def total_payouts_30d_inr(self) -> float:
        return round(self.total_payouts_30d_paise / 100, 2)


class SLAPerformanceSummary(_ReadModel):
    resolution_path: ClaimPath
    total_claims: int
    sla_met: int
    sla_breached_count: int
    sla_pct_met: float
    avg_actual_seconds: float
    max_actual_seconds: Optional[int]
    min_actual_seconds: Optional[int]
    sla_target_seconds: Optional[int]


class FlagStatsSummary(_ReadModel):
    flag_type: FraudFlagType
    total_raised: int
    total_upheld: int
    total_retracted: int
    total_pending: int
    precision_pct: Optional[float]
    avg_score_contribution: float
    deciding_factor_count: int


# =============================================================================
# 15. SCHEDULER / INTERNAL SCHEMAS
# =============================================================================

class DCIComputationCycleResult(_ReadModel):
    """Output from a single DCI computation scheduler cycle."""
    cycle_started_at: datetime
    cycle_completed_at: datetime
    hexes_processed: int
    hexes_disrupted: int
    hexes_elevated_watch: int
    hexes_normal: int
    hexes_degraded: int
    claims_initiated: int
    disruption_events_opened: int
    disruption_events_closed: int
    signal_sources_healthy: int
    computation_duration_ms: int
    errors: list[str] = Field(default_factory=list)


class SignalIngestionCycleResult(_ReadModel):
    """Output from a signal ingestion scheduler cycle."""
    cycle_started_at: datetime
    hexes_processed: int
    signals_fetched: int
    signals_failed: int
    signals_mocked: int
    thresholds_breached: int
    duration_ms: int
    errors: list[str] = Field(default_factory=list)


class WeeklyJobResult(_ReadModel):
    """Output from the Monday 00:00 weekly scheduler jobs."""
    run_at: datetime
    policies_expired: int
    policies_activated: int
    policies_cancelled_failed_payment: int
    rolling_averages_refreshed: int
    tier_changes: int
    tier_upgrade_alerts_sent: int
    xgboost_retrained: bool
    model_version: Optional[str]
    reserve_fund_credited: int
    duration_ms: int
    errors: list[str] = Field(default_factory=list)


class HealthCheckResponse(BaseResponse):
    """Response from GET /health."""
    app_env: str
    app_version: str
    supabase_rest: str
    postgres_pool: str
    pool_size: Optional[int]
    latency_ms: Optional[float]
    schema_migrations_applied: int
    scheduler_running: bool