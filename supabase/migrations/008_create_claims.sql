DO $$ BEGIN
    CREATE TYPE public.claim_status AS ENUM (
        'INITIATED',
        'FAST_TRACK',
        'SOFT_QUEUE',
        'ACTIVE_VERIFY',
        'PAID',
        'DENIED',
        'APPEALED',
        'APPEAL_APPROVED',
        'APPEAL_DENIED',
        'ROLLED_BACK'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.gate2_order_activity AS ENUM (
        'STRONG',
        'WEAK',
        'NO_CONFIRMATION',
        'PENDING',
        'PLATFORM_UNAVAILABLE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.claims (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
    policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
    disruption_event_id UUID NOT NULL REFERENCES public.disruption_events(id) ON DELETE RESTRICT,

    pop_validated BOOLEAN NOT NULL DEFAULT FALSE,
    pop_ping_count SMALLINT NOT NULL DEFAULT 0,
    pop_fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    pop_coordinate_variance DOUBLE PRECISION DEFAULT 0.0,
    pop_jitter_pattern public.coordinate_jitter_pattern NOT NULL DEFAULT 'UNKNOWN',
    pop_entry_velocity_kmh DOUBLE PRECISION,
    pop_velocity_violation BOOLEAN NOT NULL DEFAULT FALSE,
    pop_validation_run_id UUID,

    gate2_result public.gate2_order_activity NOT NULL DEFAULT 'PENDING',
    gate2_order_count SMALLINT NOT NULL DEFAULT 0,
    gate2_last_order_at TIMESTAMPTZ,
    gate2_micro_delivery_excluded BOOLEAN NOT NULL DEFAULT FALSE,

    fraud_gate1_static_device BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_gate1_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_gate2_no_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_gate2_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_mock_location_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_mock_location_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_registration_cohort_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_registration_cohort_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_model_concentration_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_model_concentration_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_participation_variance_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_participation_variance_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_entry_window_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_entry_window_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_declaration_clustering_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_declaration_clustering_weight SMALLINT NOT NULL DEFAULT 0,
    fraud_earnings_inflation_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_claim_frequency_flag BOOLEAN NOT NULL DEFAULT FALSE,

    fraud_score_total SMALLINT GENERATED ALWAYS AS (
        fraud_gate1_weight +
        fraud_gate2_weight +
        fraud_mock_location_weight +
        fraud_registration_cohort_weight +
        fraud_model_concentration_weight +
        fraud_participation_variance_weight +
        fraud_entry_window_weight +
        fraud_declaration_clustering_weight
    ) STORED,

    resolution_path public.claim_path,
    path_assigned_at TIMESTAMPTZ,

    disrupted_hours_raw DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    disrupted_hours_verified DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    disrupted_hours_used DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    worker_avg_daily_earnings_paise INTEGER NOT NULL DEFAULT 0,

    hourly_rate_paise INTEGER GENERATED ALWAYS AS (
        worker_avg_daily_earnings_paise / 8
    ) STORED,

    payout_amount_raw_paise INTEGER NOT NULL DEFAULT 0,
    effective_daily_cap_paise INTEGER NOT NULL DEFAULT 0,

    payout_amount_paise INTEGER GENERATED ALWAYS AS (
        LEAST(payout_amount_raw_paise, effective_daily_cap_paise)
    ) STORED,

    maturation_cap_applied BOOLEAN NOT NULL DEFAULT FALSE,

    soft_queue_resolved_at TIMESTAMPTZ,
    soft_queue_resolution_method VARCHAR(50),

    active_verify_fcm_sent_at TIMESTAMPTZ,
    active_verify_responded_at TIMESTAMPTZ,
    active_verify_confirmed BOOLEAN,
    active_verify_gps_lat DOUBLE PRECISION,
    active_verify_gps_lng DOUBLE PRECISION,

    sla_target_seconds INTEGER,
    sla_actual_seconds INTEGER,

    sla_breached BOOLEAN GENERATED ALWAYS AS (
        sla_actual_seconds IS NOT NULL
        AND sla_actual_seconds > sla_target_seconds
    ) STORED,

    payout_channel public.payout_channel DEFAULT 'UPI',
    razorpay_transfer_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    upi_transaction_ref VARCHAR(100),
    payment_initiated_at TIMESTAMPTZ,
    payment_confirmed_at TIMESTAMPTZ,
    payment_failed_at TIMESTAMPTZ,
    payment_failure_reason TEXT,

    payment_retry_count SMALLINT NOT NULL DEFAULT 0,

    rollback_initiated_at TIMESTAMPTZ,
    rollback_completed_at TIMESTAMPTZ,
    rollback_reason TEXT,
    rollback_razorpay_ref VARCHAR(100),

    appeal_claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    is_appeal BOOLEAN NOT NULL DEFAULT FALSE,
    original_claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    appeal_filed_at TIMESTAMPTZ,
    appeal_reviewed_by TEXT,
    appeal_review_notes TEXT,

    worker_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    worker_notification_sent_at TIMESTAMPTZ,
    worker_explanation_text TEXT,
    worker_upi_id_at_payout VARCHAR(100),

    status public.claim_status NOT NULL DEFAULT 'INITIATED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    denial_reason_code VARCHAR(50),
    denial_reason_text TEXT,
    denial_appeal_deadline TIMESTAMPTZ,

    CONSTRAINT uq_claims_worker_event UNIQUE (worker_id, disruption_event_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_worker_status
    ON public.claims (worker_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claims_event_id
    ON public.claims (disruption_event_id, status);

CREATE INDEX IF NOT EXISTS idx_claims_policy_id
    ON public.claims (policy_id, status);

CREATE INDEX IF NOT EXISTS idx_claims_sla_breach
    ON public.claims (resolution_path, sla_breached, created_at DESC)
    WHERE sla_breached = TRUE;

CREATE INDEX IF NOT EXISTS idx_claims_payment_pending
    ON public.claims (status, payment_initiated_at)
    WHERE status IN ('FAST_TRACK', 'SOFT_QUEUE', 'ACTIVE_VERIFY')
      AND razorpay_transfer_id IS NOT NULL
      AND payment_confirmed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_soft_queue_pending
    ON public.claims (created_at ASC)
    WHERE status = 'SOFT_QUEUE'
      AND soft_queue_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_active_verify_pending
    ON public.claims (active_verify_fcm_sent_at ASC)
    WHERE status = 'ACTIVE_VERIFY'
      AND active_verify_confirmed IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_appeal_deadline
    ON public.claims (status, denial_appeal_deadline);

CREATE INDEX IF NOT EXISTS idx_claims_appeal_chain
    ON public.claims (original_claim_id)
    WHERE is_appeal = TRUE;

CREATE INDEX IF NOT EXISTS idx_claims_fraud_score
    ON public.claims (fraud_score_total DESC, created_at DESC)
    WHERE fraud_score_total > 0;

CREATE INDEX IF NOT EXISTS idx_claims_rollback
    ON public.claims (status, rollback_initiated_at)
    WHERE status = 'ROLLED_BACK';

CREATE INDEX IF NOT EXISTS idx_claims_paid_payout
    ON public.claims (disruption_event_id, payout_amount_paise DESC)
    WHERE status IN ('PAID', 'APPEAL_APPROVED');

CREATE INDEX IF NOT EXISTS idx_claims_gate2_result
    ON public.claims (gate2_result, status)
    WHERE gate2_result IN ('WEAK', 'NO_CONFIRMATION');

CREATE OR REPLACE TRIGGER trg_claims_updated_at
    BEFORE UPDATE ON public.claims
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_claims_select_own
    ON public.claims
    FOR SELECT
    USING (worker_id = auth.uid());

INSERT INTO public.schema_migrations (version, description)
VALUES ('008', 'Create claims table')
ON CONFLICT (version) DO NOTHING;