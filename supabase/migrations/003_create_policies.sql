DO $$ BEGIN
    CREATE TYPE public.premium_payment_status AS ENUM (
        'PENDING',
        'CONFIRMED',
        'FAILED',
        'REFUNDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.policies (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    worker_id UUID NOT NULL
        REFERENCES public.workers(id)
        ON DELETE RESTRICT,

    hex_id TEXT NOT NULL
        REFERENCES public.hex_zones(hex_id)
        ON DELETE RESTRICT,

    city VARCHAR(50) NOT NULL,

    tier public.worker_tier NOT NULL,

    weekly_premium_paise INTEGER NOT NULL
        CHECK (weekly_premium_paise > 0),

    coverage_cap_daily_paise INTEGER NOT NULL
        CHECK (coverage_cap_daily_paise > 0),

    payout_maturation_cap_paise INTEGER NOT NULL
        CHECK (payout_maturation_cap_paise > 0),

    effective_daily_cap_paise INTEGER NOT NULL
        CHECK (effective_daily_cap_paise > 0),

    is_waiting_period BOOLEAN NOT NULL DEFAULT FALSE,
    waiting_period_ends_at TIMESTAMPTZ,
    waiting_period_cap_paise INTEGER
        CHECK (waiting_period_cap_paise IS NULL OR waiting_period_cap_paise > 0),

    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    is_upgrade BOOLEAN NOT NULL DEFAULT FALSE,
    upgraded_from_tier public.worker_tier,

    previous_policy_id UUID
        REFERENCES public.policies(id)
        ON DELETE SET NULL,

    renewal_count SMALLINT NOT NULL DEFAULT 0
        CHECK (renewal_count >= 0),

    upgrade_offer_sent_at TIMESTAMPTZ,
    upgrade_confirmed_at TIMESTAMPTZ,

    dci_at_creation DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (dci_at_creation BETWEEN 0.0 AND 1.0),

    rolling_dci_4w_at_creation DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (rolling_dci_4w_at_creation BETWEEN 0.0 AND 1.0),

    adverse_selection_flag BOOLEAN NOT NULL DEFAULT FALSE,

    payment_status public.premium_payment_status NOT NULL DEFAULT 'PENDING',

    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_upi_txn_ref VARCHAR(100),

    payment_initiated_at TIMESTAMPTZ,
    payment_confirmed_at TIMESTAMPTZ,
    payment_failed_at TIMESTAMPTZ,
    payment_failure_reason TEXT,

    payment_retry_count SMALLINT NOT NULL DEFAULT 0
        CHECK (payment_retry_count BETWEEN 0 AND 3),

    status public.policy_status NOT NULL DEFAULT 'WAITING',

    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    expired_at TIMESTAMPTZ,

    total_payouts_paise BIGINT NOT NULL DEFAULT 0
        CHECK (total_payouts_paise >= 0),

    payout_event_count SMALLINT NOT NULL DEFAULT 0
        CHECK (payout_event_count >= 0),

    last_payout_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_policies_week_duration
        CHECK (week_end = week_start + INTERVAL '6 days'),

    CONSTRAINT chk_policies_week_start_monday
        CHECK (EXTRACT(DOW FROM week_start) = 1),

    CONSTRAINT chk_policies_coverage_cap_max
        CHECK (coverage_cap_daily_paise <= 100000),

    CONSTRAINT chk_policies_effective_cap_lte_tier_cap
        CHECK (effective_daily_cap_paise <= coverage_cap_daily_paise),

    CONSTRAINT chk_policies_waiting_period_consistency
        CHECK (
            (NOT is_waiting_period)
            OR (waiting_period_ends_at IS NOT NULL AND waiting_period_cap_paise IS NOT NULL)
        ),

    CONSTRAINT chk_policies_upgrade_consistency
        CHECK (
            (NOT is_upgrade)
            OR (upgraded_from_tier IS NOT NULL)
        ),

    CONSTRAINT chk_policies_cancellation_consistency
        CHECK (
            status != 'CANCELLED'
            OR (cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL)
        ),

    CONSTRAINT chk_policies_adverse_selection_flag
        CHECK (
            dci_at_creation <= 0.70
            OR adverse_selection_flag = TRUE
        ),

    CONSTRAINT chk_policies_payment_confirmed_consistency
        CHECK (
            payment_status != 'CONFIRMED'
            OR payment_confirmed_at IS NOT NULL
        ),

    CONSTRAINT chk_policies_payout_not_exceed_weekly_cap
        CHECK (total_payouts_paise <= coverage_cap_daily_paise * 7)
);

ALTER TABLE public.policies
    ADD CONSTRAINT excl_policies_no_overlapping_active
    EXCLUDE USING gist (
        worker_id WITH =,
        DATERANGE(week_start, week_end, '[]') WITH &&
    )
    WHERE (status IN ('WAITING', 'ACTIVE'));

CREATE INDEX IF NOT EXISTS idx_policies_worker_status_week
    ON public.policies (worker_id, status, week_start DESC)
    WHERE status IN ('ACTIVE', 'WAITING');

CREATE INDEX IF NOT EXISTS idx_policies_hex_status
    ON public.policies (hex_id, status)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_policies_week_start
    ON public.policies (week_start, status);

CREATE INDEX IF NOT EXISTS idx_policies_week_end_expiry
    ON public.policies (week_end)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_policies_payment_status
    ON public.policies (payment_status)
    WHERE payment_status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_policies_adverse_selection
    ON public.policies (adverse_selection_flag, dci_at_creation DESC)
    WHERE adverse_selection_flag = TRUE;

CREATE INDEX IF NOT EXISTS idx_policies_previous_policy
    ON public.policies (previous_policy_id)
    WHERE previous_policy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_policies_city_week
    ON public.policies (city, week_start)
    WHERE status IN ('ACTIVE', 'EXPIRED');

CREATE INDEX IF NOT EXISTS idx_policies_waiting_period_expiry
    ON public.policies (waiting_period_ends_at)
    WHERE is_waiting_period = TRUE AND status = 'WAITING';

CREATE OR REPLACE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_policies_compute_effective_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.effective_daily_cap_paise := LEAST(
        NEW.coverage_cap_daily_paise,
        NEW.payout_maturation_cap_paise
    );

    IF NEW.is_waiting_period
       AND NEW.waiting_period_cap_paise IS NOT NULL
       AND (NEW.waiting_period_ends_at IS NULL OR NOW() < NEW.waiting_period_ends_at)
    THEN
        NEW.effective_daily_cap_paise := LEAST(
            NEW.effective_daily_cap_paise,
            NEW.waiting_period_cap_paise
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_policies_compute_effective_cap
    BEFORE INSERT OR UPDATE OF coverage_cap_daily_paise,
                                payout_maturation_cap_paise,
                                waiting_period_cap_paise,
                                is_waiting_period
    ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.fn_policies_compute_effective_cap();

CREATE OR REPLACE FUNCTION public.fn_policies_check_adverse_selection()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dci_at_creation > 0.70 THEN
        NEW.adverse_selection_flag := TRUE;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_policies_check_adverse_selection
    BEFORE INSERT ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.fn_policies_check_adverse_selection();

CREATE OR REPLACE FUNCTION public.fn_policies_activate_after_waiting()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.payment_status = 'CONFIRMED'
       AND OLD.payment_status != 'CONFIRMED'
       AND NEW.status = 'WAITING'
       AND (NEW.waiting_period_ends_at IS NULL OR NOW() >= NEW.waiting_period_ends_at)
    THEN
        NEW.status := 'ACTIVE';
    END IF;

    IF NEW.payment_status = 'CONFIRMED'
       AND OLD.payment_status != 'CONFIRMED'
       AND NOT NEW.is_waiting_period
    THEN
        NEW.status := 'ACTIVE';
        NEW.payment_confirmed_at := COALESCE(NEW.payment_confirmed_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_policies_activate_after_waiting
    BEFORE UPDATE OF payment_status ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.fn_policies_activate_after_waiting();

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_policies_select_own
    ON public.policies
    FOR SELECT
    USING (worker_id = auth.uid());

CREATE OR REPLACE VIEW public.claimable_policies AS
SELECT
    p.id AS policy_id,
    p.worker_id,
    p.hex_id,
    p.city,
    p.tier,
    p.effective_daily_cap_paise,
    p.payout_event_count,
    p.total_payouts_paise,
    p.last_payout_date,
    p.week_start,
    p.week_end,
    p.renewal_count,
    p.is_waiting_period,
    (p.coverage_cap_daily_paise * 7 - p.total_payouts_paise)
        AS remaining_weekly_budget_paise,
    w.trust_score,
    w.last_fraud_score,
    w.platform_worker_id,
    w.platform_id_verified,
    w.upi_id,
    w.upi_verified,
    w.payout_channel,
    w.fcm_device_token
FROM public.policies p
JOIN public.workers w ON w.id = p.worker_id
WHERE p.status = 'ACTIVE'
  AND p.payment_status = 'CONFIRMED'
  AND w.status = 'ACTIVE';

CREATE OR REPLACE VIEW public.policy_pool_summary AS
SELECT
    p.city,
    p.hex_id,
    p.tier,
    p.week_start,
    COUNT(*) AS policy_count,
    SUM(p.weekly_premium_paise) AS total_premium_paise,
    SUM(p.total_payouts_paise) AS total_payouts_paise,
    SUM(p.payout_event_count) AS total_payout_events,
    ROUND(
        SUM(p.total_payouts_paise)::NUMERIC
        / NULLIF(SUM(p.weekly_premium_paise), 0), 4
    ) AS loss_ratio
FROM public.policies p
WHERE p.status IN ('ACTIVE', 'EXPIRED')
GROUP BY p.city, p.hex_id, p.tier, p.week_start;

CREATE OR REPLACE VIEW public.worker_policy_history AS
SELECT
    p.id AS policy_id,
    p.worker_id,
    p.tier,
    p.weekly_premium_paise,
    p.effective_daily_cap_paise,
    p.week_start,
    p.week_end,
    p.status,
    p.total_payouts_paise,
    p.payout_event_count,
    p.is_upgrade,
    p.upgraded_from_tier,
    p.renewal_count,
    p.dci_at_creation,
    p.payment_status,
    p.created_at
FROM public.policies p;

INSERT INTO public.schema_migrations (version, description)
VALUES ('003', 'Create policies table')
ON CONFLICT (version) DO NOTHING;