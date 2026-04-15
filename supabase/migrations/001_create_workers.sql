DO $$ BEGIN
    CREATE TYPE public.worker_status AS ENUM (
        'ONBOARDING',
        'WAITING',
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.preferred_language AS ENUM (
        'hi',
        'kn',
        'ta',
        'te',
        'en'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.workers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(100),
    city VARCHAR(50),

    dark_store_zone VARCHAR(100),

    registered_hex_id TEXT,

    registration_lat DOUBLE PRECISION,
    registration_lng DOUBLE PRECISION,

    platform public.delivery_platform NOT NULL DEFAULT 'ZEPTO',
    platform_worker_id VARCHAR(100),
    platform_id_verified BOOLEAN NOT NULL DEFAULT FALSE,
    platform_id_verified_at TIMESTAMPTZ,

    avg_daily_earnings_paise INTEGER
        CHECK (avg_daily_earnings_paise > 0 AND avg_daily_earnings_paise <= 150000),

    zone_earnings_90p_paise INTEGER,

    upi_id VARCHAR(100),
    upi_verified BOOLEAN NOT NULL DEFAULT FALSE,

    bank_account_last4 CHAR(4),
    bank_ifsc VARCHAR(11),

    payout_channel public.payout_channel NOT NULL DEFAULT 'UPI',

    tier public.worker_tier NOT NULL DEFAULT 'B',

    rolling_dci_4w_avg DOUBLE PRECISION DEFAULT 0.0
        CHECK (rolling_dci_4w_avg BETWEEN 0.0 AND 1.0),

    active_days_last_30 INTEGER DEFAULT 0
        CHECK (active_days_last_30 BETWEEN 0 AND 30),

    avg_active_days_per_week DOUBLE PRECISION DEFAULT 0.0
        CHECK (avg_active_days_per_week BETWEEN 0 AND 7),

    trust_score SMALLINT NOT NULL DEFAULT 50
        CHECK (trust_score BETWEEN 0 AND 100),

    last_fraud_score SMALLINT NOT NULL DEFAULT 0
        CHECK (last_fraud_score BETWEEN 0 AND 100),

    mock_location_ever_detected BOOLEAN NOT NULL DEFAULT FALSE,

    soft_queue_count INTEGER NOT NULL DEFAULT 0,
    active_verify_count INTEGER NOT NULL DEFAULT 0,
    denied_claim_count INTEGER NOT NULL DEFAULT 0,

    claim_days_last_4_weeks INTEGER NOT NULL DEFAULT 0
        CHECK (claim_days_last_4_weeks BETWEEN 0 AND 28),

    avg_payout_4w_paise INTEGER DEFAULT 0,

    device_model VARCHAR(100),
    device_os_version VARCHAR(20),
    sim_carrier VARCHAR(50),
    sim_registration_date DATE,

    device_fingerprint_hash CHAR(64),

    fcm_device_token TEXT,
    fcm_token_updated_at TIMESTAMPTZ,

    onboarding_step SMALLINT CHECK (onboarding_step BETWEEN 1 AND 7),

    preferred_language public.preferred_language NOT NULL DEFAULT 'en',

    status public.worker_status NOT NULL DEFAULT 'ONBOARDING',

    registration_ip INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspension_reason TEXT,

    CONSTRAINT chk_workers_phone_format
        CHECK (phone ~ '^[6-9][0-9]{9}$'),

    CONSTRAINT chk_workers_upi_format
        CHECK (upi_id IS NULL OR upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$'),

    CONSTRAINT chk_workers_ifsc_format
        CHECK (bank_ifsc IS NULL OR bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),

    CONSTRAINT chk_workers_fingerprint_format
        CHECK (device_fingerprint_hash IS NULL
            OR device_fingerprint_hash ~ '^[a-f0-9]{64}$'),

    CONSTRAINT chk_workers_lat_india
        CHECK (registration_lat IS NULL
            OR (registration_lat BETWEEN 6.0 AND 37.0)),

    CONSTRAINT chk_workers_lng_india
        CHECK (registration_lng IS NULL
            OR (registration_lng BETWEEN 68.0 AND 97.0)),

    CONSTRAINT chk_workers_suspension_consistency
        CHECK (status != 'SUSPENDED' OR suspended_at IS NOT NULL),

    CONSTRAINT chk_workers_platform_verify_consistency
        CHECK (NOT platform_id_verified OR platform_id_verified_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_workers_registered_hex_id
    ON public.workers (registered_hex_id)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_workers_status
    ON public.workers (status);

CREATE INDEX IF NOT EXISTS idx_workers_trust_score
    ON public.workers (trust_score)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_workers_platform
    ON public.workers (platform, city)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_workers_device_fingerprint
    ON public.workers (device_fingerprint_hash)
    WHERE device_fingerprint_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workers_mock_location
    ON public.workers (mock_location_ever_detected)
    WHERE mock_location_ever_detected = TRUE;

CREATE INDEX IF NOT EXISTS idx_workers_denied_claims
    ON public.workers (denied_claim_count)
    WHERE denied_claim_count >= 2;

CREATE INDEX IF NOT EXISTS idx_workers_city_status
    ON public.workers (city, status);

CREATE INDEX IF NOT EXISTS idx_workers_last_active
    ON public.workers (last_active_at)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_workers_registration_coords
    ON public.workers USING gist (
        ST_SetSRID(ST_MakePoint(registration_lng, registration_lat), 4326)
    )
    WHERE registration_lat IS NOT NULL AND registration_lng IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_workers_updated_at
    BEFORE UPDATE ON public.workers
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_workers_auto_suspend()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.denied_claim_count >= 3 AND OLD.status != 'SUSPENDED' THEN
        NEW.status := 'SUSPENDED';
        NEW.suspended_at := NOW();
        NEW.suspension_reason := FORMAT(
            'Auto-suspended: %s denied claims.',
            NEW.denied_claim_count
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_workers_auto_suspend
    BEFORE UPDATE OF denied_claim_count ON public.workers
    FOR EACH ROW EXECUTE FUNCTION public.fn_workers_auto_suspend();

CREATE OR REPLACE FUNCTION public.fn_workers_clamp_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.trust_score := GREATEST(0, LEAST(100, NEW.trust_score));
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_workers_clamp_trust_score
    BEFORE INSERT OR UPDATE OF trust_score ON public.workers
    FOR EACH ROW EXECUTE FUNCTION public.fn_workers_clamp_trust_score();

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_workers_select_own
    ON public.workers
    FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY policy_workers_update_own
    ON public.workers
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

CREATE OR REPLACE VIEW public.active_workers_by_hex AS
SELECT
    w.registered_hex_id AS hex_id,
    COUNT(*) AS worker_count,
    AVG(w.avg_daily_earnings_paise) AS avg_daily_earnings_paise,
    AVG(w.trust_score) AS avg_trust_score,
    ARRAY_AGG(w.id) AS worker_ids
FROM public.workers w
WHERE w.status = 'ACTIVE'
  AND w.registered_hex_id IS NOT NULL
GROUP BY w.registered_hex_id;

INSERT INTO public.schema_migrations (version, description)
VALUES ('001', 'Create workers table')
ON CONFLICT (version) DO NOTHING;