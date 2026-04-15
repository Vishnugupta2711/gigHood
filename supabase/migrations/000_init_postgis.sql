CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM spatial_ref_sys WHERE srid = 4326) THEN
    RAISE EXCEPTION 'SRID 4326 (WGS84) not found in spatial_ref_sys.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sigmoid(x DOUBLE PRECISION)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT 1.0 / (1.0 + EXP(-x));
$$;

CREATE OR REPLACE FUNCTION public.fn_compute_dci(
    p_weather_score  DOUBLE PRECISION,
    p_traffic_score  DOUBLE PRECISION,
    p_platform_score DOUBLE PRECISION,
    p_social_score   DOUBLE PRECISION,
    p_alpha          DOUBLE PRECISION DEFAULT 0.45,
    p_beta           DOUBLE PRECISION DEFAULT 0.25,
    p_gamma          DOUBLE PRECISION DEFAULT 0.20,
    p_delta          DOUBLE PRECISION DEFAULT 0.10
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT public.fn_sigmoid(
        p_alpha * p_weather_score
      + p_beta  * p_traffic_score
      + p_gamma * p_platform_score
      + p_delta * p_social_score
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_dci_status(p_dci DOUBLE PRECISION)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT CASE
        WHEN p_dci >  0.85 THEN 'DISRUPTED'
        WHEN p_dci >  0.65 THEN 'ELEVATED_WATCH'
        ELSE 'NORMAL'
    END;
$$;

DO $$ BEGIN
    CREATE TYPE public.worker_tier AS ENUM ('A', 'B', 'C');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.zone_status AS ENUM ('NORMAL', 'ELEVATED_WATCH', 'DISRUPTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.claim_path AS ENUM (
        'FAST_TRACK',
        'SOFT_QUEUE',
        'ACTIVE_VERIFY',
        'DENIED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.delivery_platform AS ENUM ('ZEPTO', 'BLINKIT', 'INSTAMART', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.trigger_type AS ENUM (
        'WEATHER',
        'AQI',
        'TRAFFIC',
        'PLATFORM',
        'SOCIAL'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.policy_status AS ENUM (
        'WAITING',
        'ACTIVE',
        'EXPIRED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.payout_channel AS ENUM ('UPI', 'IMPS', 'SANDBOX');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.system_config (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

    dci_weight_alpha DOUBLE PRECISION NOT NULL DEFAULT 0.45 CHECK (dci_weight_alpha BETWEEN 0 AND 1),
    dci_weight_beta  DOUBLE PRECISION NOT NULL DEFAULT 0.25 CHECK (dci_weight_beta BETWEEN 0 AND 1),
    dci_weight_gamma DOUBLE PRECISION NOT NULL DEFAULT 0.20 CHECK (dci_weight_gamma BETWEEN 0 AND 1),
    dci_weight_delta DOUBLE PRECISION NOT NULL DEFAULT 0.10 CHECK (dci_weight_delta BETWEEN 0 AND 1),

    dci_threshold_disrupted DOUBLE PRECISION NOT NULL DEFAULT 0.85 CHECK (dci_threshold_disrupted BETWEEN 0.5 AND 1.0),
    dci_threshold_elevated_watch DOUBLE PRECISION NOT NULL DEFAULT 0.65 CHECK (dci_threshold_elevated_watch BETWEEN 0.3 AND 1.0),

    trigger_rainfall_mm_per_hr DOUBLE PRECISION NOT NULL DEFAULT 35.0,
    trigger_wind_km_per_hr DOUBLE PRECISION NOT NULL DEFAULT 45.0,
    trigger_aqi INTEGER NOT NULL DEFAULT 300,
    trigger_traffic_gridlock DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    trigger_platform_latency_ms INTEGER NOT NULL DEFAULT 30000,
    trigger_platform_order_drop DOUBLE PRECISION NOT NULL DEFAULT 0.70,

    pop_window_minutes INTEGER NOT NULL DEFAULT 90 CHECK (pop_window_minutes BETWEEN 30 AND 180),

    fraud_score_soft_queue INTEGER NOT NULL DEFAULT 30,
    fraud_score_active_verify INTEGER NOT NULL DEFAULT 60,
    fraud_score_deny INTEGER NOT NULL DEFAULT 80,

    premium_tier_a_paise INTEGER NOT NULL DEFAULT 2000,
    premium_tier_b_paise INTEGER NOT NULL DEFAULT 3000,
    premium_tier_c_paise INTEGER NOT NULL DEFAULT 4200,

    payout_cap_tier_a_paise INTEGER NOT NULL DEFAULT 60000,
    payout_cap_tier_b_paise INTEGER NOT NULL DEFAULT 70000,
    payout_cap_tier_c_paise INTEGER NOT NULL DEFAULT 80000,

    dci_recompute_interval_sec INTEGER NOT NULL DEFAULT 300,
    min_pool_workers_per_hex INTEGER NOT NULL DEFAULT 3000,

    reserve_fund_pct DOUBLE PRECISION NOT NULL DEFAULT 0.20 CHECK (reserve_fund_pct BETWEEN 0 AND 1),

    weights_last_updated_at TIMESTAMPTZ,
    weights_model_version TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

INSERT INTO public.system_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.schema_migrations (version, description)
VALUES ('000', 'Bootstrap core extensions; shared functions, ENUMs, system_config')
ON CONFLICT (version) DO NOTHING;

DO $$
DECLARE
    ext_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ext_count
    FROM pg_extension
    WHERE extname IN ('postgis', 'uuid-ossp', 'pgcrypto', 'pg_trgm', 'btree_gist', 'unaccent');
END;
$$;