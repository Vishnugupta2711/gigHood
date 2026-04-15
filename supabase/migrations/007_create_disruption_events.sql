DO $$ BEGIN
    CREATE TYPE public.disruption_event_status AS ENUM (
        'ACTIVE',
        'CLEARING',
        'CLOSED',
        'VOIDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.disruption_severity AS ENUM (
        'MINOR',
        'MODERATE',
        'SEVERE',
        'CATASTROPHIC'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.disruption_events (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hex_id TEXT NOT NULL
        REFERENCES public.hex_zones(hex_id)
        ON DELETE RESTRICT,

    city VARCHAR(50) NOT NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    dci_at_onset DOUBLE PRECISION NOT NULL CHECK (dci_at_onset BETWEEN 0.0 AND 1.0),
    dci_peak DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (dci_peak BETWEEN 0.0 AND 1.0),
    dci_at_clearance DOUBLE PRECISION CHECK (dci_at_clearance IS NULL OR dci_at_clearance BETWEEN 0.0 AND 1.0),

    total_cycle_count INTEGER NOT NULL DEFAULT 1 CHECK (total_cycle_count >= 1),
    disrupted_cycle_count INTEGER NOT NULL DEFAULT 1 CHECK (disrupted_cycle_count >= 1),

    verified_disrupted_minutes INTEGER NOT NULL DEFAULT 0 CHECK (verified_disrupted_minutes >= 0),

    verified_disrupted_hours DOUBLE PRECISION
        GENERATED ALWAYS AS (verified_disrupted_minutes / 60.0) STORED,

    wall_clock_minutes INTEGER
        GENERATED ALWAYS AS (
            CASE
                WHEN ended_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60
                ELSE NULL
            END
        ) STORED,

    hysteresis_interrupted_count SMALLINT NOT NULL DEFAULT 0 CHECK (hysteresis_interrupted_count >= 0),

    trigger_weather_at_onset BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_aqi_at_onset BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_traffic_at_onset BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_platform_at_onset BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_social_at_onset BOOLEAN NOT NULL DEFAULT FALSE,

    trigger_count_at_onset SMALLINT
        GENERATED ALWAYS AS (
            (trigger_weather_at_onset::INT +
             trigger_aqi_at_onset::INT +
             trigger_traffic_at_onset::INT +
             trigger_platform_at_onset::INT +
             trigger_social_at_onset::INT)::SMALLINT
        ) STORED,

    trigger_weather_peak BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_aqi_peak BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_traffic_peak BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_platform_peak BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_social_peak BOOLEAN NOT NULL DEFAULT FALSE,

    peak_rainfall_mm_hr DOUBLE PRECISION,
    peak_wind_speed_km_hr DOUBLE PRECISION,
    peak_aqi_value INTEGER,
    peak_congestion_index DOUBLE PRECISION,
    peak_order_drop_pct DOUBLE PRECISION,

    trigger_signals_at_onset JSONB,
    trigger_signals_at_peak JSONB,

    min_signal_sources SMALLINT NOT NULL DEFAULT 5 CHECK (min_signal_sources BETWEEN 0 AND 5),
    had_degraded_cycles BOOLEAN NOT NULL DEFAULT FALSE,
    degraded_cycle_count SMALLINT NOT NULL DEFAULT 0,

    dci_onset_record_id BIGINT,
    dci_onset_computed_at TIMESTAMPTZ,

    severity public.disruption_severity NOT NULL DEFAULT 'MINOR',

    is_multi_hex_event BOOLEAN NOT NULL DEFAULT FALSE,
    multi_hex_event_group_id UUID,

    catastrophic_event_flag BOOLEAN NOT NULL DEFAULT FALSE,

    affected_policy_count INTEGER NOT NULL DEFAULT 0 CHECK (affected_policy_count >= 0),
    claim_count INTEGER NOT NULL DEFAULT 0 CHECK (claim_count >= 0),
    denied_claim_count INTEGER NOT NULL DEFAULT 0 CHECK (denied_claim_count >= 0),
    soft_queue_count INTEGER NOT NULL DEFAULT 0,
    active_verify_count INTEGER NOT NULL DEFAULT 0,
    pop_fallback_count INTEGER NOT NULL DEFAULT 0,

    weekly_premium_pool_paise BIGINT NOT NULL DEFAULT 0,

    total_payouts_paise BIGINT NOT NULL DEFAULT 0 CHECK (total_payouts_paise >= 0),

    avg_payout_per_worker_paise INTEGER
        GENERATED ALWAYS AS (
            CASE
                WHEN claim_count > 0
                THEN (total_payouts_paise / claim_count)::INTEGER
                ELSE 0
            END
        ) STORED,

    event_loss_ratio DOUBLE PRECISION
        GENERATED ALWAYS AS (
            CASE
                WHEN weekly_premium_pool_paise > 0
                THEN total_payouts_paise::DOUBLE PRECISION / weekly_premium_pool_paise
                ELSE 0.0
            END
        ) STORED,

    status public.disruption_event_status NOT NULL DEFAULT 'ACTIVE',

    void_reason TEXT,
    claims_finalized_at TIMESTAMPTZ,

    reserve_fund_drawn BOOLEAN NOT NULL DEFAULT FALSE,
    reserve_fund_amount_paise BIGINT DEFAULT 0,

    regulatory_description TEXT,
    irdai_reported BOOLEAN NOT NULL DEFAULT FALSE,
    irdai_reported_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_disruption_events_timeline
        CHECK (ended_at IS NULL OR ended_at > started_at),

    CONSTRAINT chk_disruption_events_closed_consistency
        CHECK (status NOT IN ('CLOSED', 'VOIDED') OR ended_at IS NOT NULL),

    CONSTRAINT chk_disruption_events_void_reason
        CHECK (status != 'VOIDED' OR void_reason IS NOT NULL),

    CONSTRAINT chk_disruption_events_peak_gte_onset
        CHECK (dci_peak >= dci_at_onset),

    CONSTRAINT chk_disruption_events_cycle_counts
        CHECK (disrupted_cycle_count <= total_cycle_count),

    CONSTRAINT chk_disruption_events_claim_counts
        CHECK ((claim_count + denied_claim_count) <= affected_policy_count OR affected_policy_count = 0),

    CONSTRAINT chk_disruption_events_catastrophic_reserve
        CHECK (NOT catastrophic_event_flag OR reserve_fund_drawn = TRUE OR total_payouts_paise = 0),

    CONSTRAINT chk_disruption_events_degraded_consistency
        CHECK ((NOT had_degraded_cycles AND degraded_cycle_count = 0)
            OR (had_degraded_cycles AND degraded_cycle_count > 0)),

    CONSTRAINT chk_disruption_events_dci_link_consistency
        CHECK ((dci_onset_record_id IS NULL) = (dci_onset_computed_at IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_disruption_events_hex_status
    ON public.disruption_events (hex_id, status)
    WHERE status IN ('ACTIVE', 'CLEARING');

CREATE INDEX IF NOT EXISTS idx_disruption_events_started_at
    ON public.disruption_events (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_disruption_events_city_started
    ON public.disruption_events (city, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_disruption_events_irdai_queue
    ON public.disruption_events (status, irdai_reported, city)
    WHERE status = 'CLOSED' AND irdai_reported = FALSE;

CREATE INDEX IF NOT EXISTS idx_disruption_events_catastrophic
    ON public.disruption_events (catastrophic_event_flag, started_at DESC)
    WHERE catastrophic_event_flag = TRUE;

CREATE INDEX IF NOT EXISTS idx_disruption_events_multi_hex_group
    ON public.disruption_events (multi_hex_event_group_id)
    WHERE multi_hex_event_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_disruption_events_payouts
    ON public.disruption_events (total_payouts_paise DESC, started_at DESC)
    WHERE status = 'CLOSED';

CREATE INDEX IF NOT EXISTS idx_disruption_events_weather_trigger
    ON public.disruption_events (trigger_weather_at_onset, started_at DESC)
    WHERE trigger_weather_at_onset = TRUE;

CREATE INDEX IF NOT EXISTS idx_disruption_events_aqi_trigger
    ON public.disruption_events (trigger_aqi_at_onset, city)
    WHERE trigger_aqi_at_onset = TRUE;

CREATE INDEX IF NOT EXISTS idx_disruption_events_long_duration
    ON public.disruption_events (verified_disrupted_minutes DESC)
    WHERE verified_disrupted_minutes > 480;

CREATE INDEX IF NOT EXISTS idx_disruption_events_dci_link
    ON public.disruption_events (dci_onset_record_id, dci_onset_computed_at)
    WHERE dci_onset_record_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_disruption_events_updated_at
    BEFORE UPDATE ON public.disruption_events
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.disruption_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_disruption_events_select_authenticated
    ON public.disruption_events
    FOR SELECT
    TO authenticated
    USING (TRUE);

INSERT INTO public.schema_migrations (version, description)
VALUES ('007', 'Create disruption_events')
ON CONFLICT (version) DO NOTHING;