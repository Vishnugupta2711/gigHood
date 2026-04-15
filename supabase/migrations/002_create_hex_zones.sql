CREATE TABLE IF NOT EXISTS public.hex_zones (

    hex_id TEXT PRIMARY KEY,

    h3_resolution SMALLINT NOT NULL DEFAULT 9
        CHECK (h3_resolution BETWEEN 0 AND 15),

    centroid GEOMETRY(POINT, 4326),
    boundary GEOMETRY(POLYGON, 4326),

    city VARCHAR(50) NOT NULL,
    ward VARCHAR(100),
    zone_label VARCHAR(150),

    dark_store_count SMALLINT NOT NULL DEFAULT 0
        CHECK (dark_store_count >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    current_dci DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (current_dci BETWEEN 0.0 AND 1.0),

    dci_status public.zone_status NOT NULL DEFAULT 'NORMAL',

    signal_weather DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    signal_traffic DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    signal_platform DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    signal_social DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    weight_alpha DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    weight_beta DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    weight_gamma DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    weight_delta DOUBLE PRECISION NOT NULL DEFAULT 0.10,

    last_computed_at TIMESTAMPTZ,

    signal_sources_available SMALLINT NOT NULL DEFAULT 5
        CHECK (signal_sources_available BETWEEN 0 AND 5),

    is_degraded_mode BOOLEAN NOT NULL DEFAULT FALSE,

    watch_started_at TIMESTAMPTZ,
    disruption_started_at TIMESTAMPTZ,
    disruption_cleared_at TIMESTAMPTZ,

    last_disruption_duration_min INTEGER DEFAULT 0
        CHECK (last_disruption_duration_min >= 0),

    clearance_cycle_count SMALLINT NOT NULL DEFAULT 0
        CHECK (clearance_cycle_count BETWEEN 0 AND 10),

    hysteresis_clear_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.75
        CHECK (hysteresis_clear_threshold BETWEEN 0.5 AND 0.85),

    disruption_count_total INTEGER NOT NULL DEFAULT 0,
    disruption_count_30d SMALLINT NOT NULL DEFAULT 0,
    disruption_count_90d SMALLINT NOT NULL DEFAULT 0,

    rolling_dci_4w DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (rolling_dci_4w BETWEEN 0.0 AND 1.0),

    rolling_dci_8w DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (rolling_dci_8w BETWEEN 0.0 AND 1.0),

    rolling_dci_12w DOUBLE PRECISION NOT NULL DEFAULT 0.0
        CHECK (rolling_dci_12w BETWEEN 0.0 AND 1.0),

    rolling_avg_updated_at TIMESTAMPTZ,

    zone_risk_tier public.worker_tier NOT NULL DEFAULT 'B',
    tier_assigned_at TIMESTAMPTZ,
    previous_tier public.worker_tier,

    next_week_risk_score DOUBLE PRECISION DEFAULT 0.0
        CHECK (next_week_risk_score BETWEEN 0.0 AND 1.0),

    forecast_computed_at TIMESTAMPTZ,

    upgrade_alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
    upgrade_alert_sent_at TIMESTAMPTZ,

    active_worker_count INTEGER NOT NULL DEFAULT 0
        CHECK (active_worker_count >= 0),

    active_policy_count INTEGER NOT NULL DEFAULT 0
        CHECK (active_policy_count >= 0),

    pool_viable BOOLEAN NOT NULL DEFAULT FALSE,

    weekly_premium_pool_paise BIGINT NOT NULL DEFAULT 0,
    total_payout_30d_paise BIGINT NOT NULL DEFAULT 0,

    burning_cost_rate DOUBLE PRECISION DEFAULT 0.0
        CHECK (burning_cost_rate >= 0.0),

    enrolment_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    enrolment_suspended_reason TEXT,

    peak_risk_months SMALLINT[] DEFAULT '{6,7,8,9}',
    primary_peril public.trigger_type DEFAULT 'WEATHER',

    historical_trigger_prob DOUBLE PRECISION DEFAULT 0.0
        CHECK (historical_trigger_prob BETWEEN 0.0 AND 1.0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hex_zones_boundary_gist
    ON public.hex_zones USING gist (boundary);

CREATE INDEX IF NOT EXISTS idx_hex_zones_centroid_gist
    ON public.hex_zones USING gist (centroid);

CREATE INDEX IF NOT EXISTS idx_hex_zones_dci_status
    ON public.hex_zones (dci_status)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_hex_zones_city
    ON public.hex_zones (city, dci_status)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_hex_zones_risk_tier
    ON public.hex_zones (zone_risk_tier)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_hex_zones_pool_viable
    ON public.hex_zones (pool_viable, active_policy_count)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_hex_zones_rolling_dci_4w
    ON public.hex_zones (rolling_dci_4w)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_hex_zones_disruption_active
    ON public.hex_zones (disruption_started_at)
    WHERE dci_status = 'DISRUPTED' AND disruption_cleared_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hex_zones_forecast
    ON public.hex_zones (next_week_risk_score, upgrade_alert_sent)
    WHERE is_active = TRUE AND next_week_risk_score > 0.75;

CREATE INDEX IF NOT EXISTS idx_hex_zones_enrolment_suspended
    ON public.hex_zones (enrolment_suspended)
    WHERE enrolment_suspended = TRUE;

CREATE OR REPLACE TRIGGER trg_hex_zones_updated_at
    BEFORE UPDATE ON public.hex_zones
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_hex_zones_sync_dci_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.dci_status := public.fn_dci_status(NEW.current_dci);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_hex_zones_sync_dci_status
    BEFORE UPDATE OF current_dci ON public.hex_zones
    FOR EACH ROW EXECUTE FUNCTION public.fn_hex_zones_sync_dci_status();

CREATE OR REPLACE FUNCTION public.fn_hex_zones_recompute_dci()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.current_dci := public.fn_compute_dci(
        NEW.signal_weather,
        NEW.signal_traffic,
        NEW.signal_platform,
        NEW.signal_social,
        NEW.weight_alpha,
        NEW.weight_beta,
        NEW.weight_gamma,
        NEW.weight_delta
    );
    NEW.last_computed_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_hex_zones_recompute_dci
    BEFORE UPDATE OF signal_weather, signal_traffic, signal_platform, signal_social,
                     weight_alpha, weight_beta, weight_gamma, weight_delta
    ON public.hex_zones
    FOR EACH ROW EXECUTE FUNCTION public.fn_hex_zones_recompute_dci();

ALTER TABLE public.hex_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_hex_zones_select_authenticated
    ON public.hex_zones
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE OR REPLACE VIEW public.disrupted_hexes AS
SELECT
    hex_id,
    city,
    zone_label,
    current_dci,
    signal_weather,
    signal_traffic,
    signal_platform,
    signal_social,
    disruption_started_at,
    active_policy_count,
    active_worker_count,
    pool_viable,
    is_degraded_mode,
    last_disruption_duration_min
FROM public.hex_zones
WHERE dci_status = 'DISRUPTED'
  AND is_active = TRUE
  AND disruption_cleared_at IS NULL;

CREATE OR REPLACE VIEW public.hex_admin_dashboard AS
SELECT
    hex_id,
    city,
    ward,
    zone_label,
    dci_status,
    current_dci,
    signal_weather,
    signal_traffic,
    signal_platform,
    signal_social,
    active_worker_count,
    active_policy_count,
    pool_viable,
    zone_risk_tier,
    rolling_dci_4w,
    next_week_risk_score,
    disruption_count_30d,
    burning_cost_rate,
    enrolment_suspended,
    is_degraded_mode,
    last_computed_at,
    disruption_started_at,
    disruption_cleared_at,
    ST_AsGeoJSON(boundary)::jsonb AS boundary_geojson,
    ST_X(centroid) AS centroid_lng,
    ST_Y(centroid) AS centroid_lat
FROM public.hex_zones
WHERE is_active = TRUE;

INSERT INTO public.schema_migrations (version, description)
VALUES ('002', 'Create hex_zones table')
ON CONFLICT (version) DO NOTHING;