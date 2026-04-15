DO $$ BEGIN
    CREATE TYPE public.signal_fetch_status AS ENUM (
        'SUCCESS',
        'TIMEOUT',
        'HTTP_ERROR',
        'PARSE_ERROR',
        'RATE_LIMITED',
        'MOCK',
        'CACHED_FALLBACK'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.signal_cache (

    id BIGSERIAL PRIMARY KEY,

    hex_id TEXT NOT NULL
        REFERENCES public.hex_zones(hex_id)
        ON DELETE CASCADE,

    signal_type public.trigger_type NOT NULL,

    raw_data JSONB,
    http_status_code SMALLINT,
    api_endpoint VARCHAR(255),

    fetch_status public.signal_fetch_status NOT NULL DEFAULT 'SUCCESS',

    api_response_ms INTEGER
        CHECK (api_response_ms IS NULL OR api_response_ms >= 0),

    rainfall_mm_hr DOUBLE PRECISION
        CHECK (rainfall_mm_hr IS NULL OR rainfall_mm_hr >= 0),
    wind_speed_km_hr DOUBLE PRECISION
        CHECK (wind_speed_km_hr IS NULL OR wind_speed_km_hr >= 0),
    temperature_celsius DOUBLE PRECISION,

    aqi_value INTEGER
        CHECK (aqi_value IS NULL OR aqi_value BETWEEN 0 AND 1000),
    aqi_category VARCHAR(30),
    dominant_pollutant VARCHAR(10),

    congestion_index DOUBLE PRECISION
        CHECK (congestion_index IS NULL OR congestion_index >= 0),
    incident_count SMALLINT
        CHECK (incident_count IS NULL OR incident_count >= 0),

    order_volume_drop_pct DOUBLE PRECISION
        CHECK (order_volume_drop_pct IS NULL OR order_volume_drop_pct BETWEEN 0.0 AND 1.0),
    platform_api_latency_ms INTEGER
        CHECK (platform_api_latency_ms IS NULL OR platform_api_latency_ms >= 0),
    platform_status_flag SMALLINT
        CHECK (platform_status_flag IS NULL OR platform_status_flag BETWEEN 0 AND 2),

    curfew_active BOOLEAN,
    strike_active BOOLEAN,
    social_severity_score DOUBLE PRECISION
        CHECK (social_severity_score IS NULL OR social_severity_score BETWEEN 0.0 AND 1.0),
    social_event_description TEXT,

    normalized_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    threshold_breached BOOLEAN NOT NULL DEFAULT FALSE,
    threshold_breach_detail TEXT,

    source_available BOOLEAN NOT NULL DEFAULT TRUE,

    consecutive_failures SMALLINT NOT NULL DEFAULT 0
        CHECK (consecutive_failures >= 0),

    is_stale BOOLEAN NOT NULL DEFAULT FALSE,

    fallback_held_seconds INTEGER NOT NULL DEFAULT 0
        CHECK (fallback_held_seconds >= 0),

    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_successful_fetch_at TIMESTAMPTZ,

    CONSTRAINT uq_signal_cache_hex_signal
        UNIQUE (hex_id, signal_type),

    CONSTRAINT chk_signal_cache_fallback_consistency
        CHECK (
            source_available = TRUE
            OR fetch_status IN ('CACHED_FALLBACK', 'TIMEOUT', 'HTTP_ERROR',
                                'PARSE_ERROR', 'RATE_LIMITED')
        ),

    CONSTRAINT chk_signal_cache_breach_detail
        CHECK (
            NOT threshold_breached
            OR threshold_breach_detail IS NOT NULL
        )
);

CREATE INDEX IF NOT EXISTS idx_signal_cache_hex_id
    ON public.signal_cache (hex_id);

CREATE INDEX IF NOT EXISTS idx_signal_cache_threshold_breached
    ON public.signal_cache (hex_id, signal_type)
    WHERE threshold_breached = TRUE;

CREATE INDEX IF NOT EXISTS idx_signal_cache_stale
    ON public.signal_cache (fetched_at, hex_id)
    WHERE is_stale = TRUE OR source_available = FALSE;

CREATE INDEX IF NOT EXISTS idx_signal_cache_signal_type_fetched
    ON public.signal_cache (signal_type, fetched_at DESC)
    WHERE source_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_signal_cache_consecutive_failures
    ON public.signal_cache (hex_id, consecutive_failures)
    WHERE consecutive_failures >= 2;

CREATE INDEX IF NOT EXISTS idx_signal_cache_aqi_threshold
    ON public.signal_cache (aqi_value DESC)
    WHERE signal_type = 'AQI' AND aqi_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_signal_cache_rainfall_threshold
    ON public.signal_cache (rainfall_mm_hr DESC)
    WHERE signal_type = 'WEATHER' AND rainfall_mm_hr IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_signal_cache_updated_at
    BEFORE UPDATE ON public.signal_cache
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_signal_cache_eval_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_rainfall_threshold DOUBLE PRECISION;
    v_wind_threshold DOUBLE PRECISION;
    v_aqi_threshold INTEGER;
    v_latency_threshold_ms INTEGER;
    v_order_drop_threshold DOUBLE PRECISION;
BEGIN
    SELECT
        trigger_rainfall_mm_per_hr,
        trigger_wind_km_per_hr,
        trigger_aqi,
        trigger_platform_latency_ms,
        trigger_platform_order_drop
    INTO
        v_rainfall_threshold,
        v_wind_threshold,
        v_aqi_threshold,
        v_latency_threshold_ms,
        v_order_drop_threshold
    FROM public.system_config
    LIMIT 1;

    v_rainfall_threshold := COALESCE(v_rainfall_threshold, 35.0);
    v_wind_threshold := COALESCE(v_wind_threshold, 45.0);
    v_aqi_threshold := COALESCE(v_aqi_threshold, 300);
    v_latency_threshold_ms := COALESCE(v_latency_threshold_ms, 30000);
    v_order_drop_threshold := COALESCE(v_order_drop_threshold, 0.70);

    NEW.threshold_breached := FALSE;
    NEW.threshold_breach_detail := NULL;

    CASE NEW.signal_type

        WHEN 'WEATHER' THEN
            IF COALESCE(NEW.rainfall_mm_hr, 0) >= v_rainfall_threshold THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('rainfall threshold breached');
            ELSIF COALESCE(NEW.wind_speed_km_hr, 0) >= v_wind_threshold THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('wind threshold breached');
            END IF;

        WHEN 'AQI' THEN
            IF COALESCE(NEW.aqi_value, 0) > v_aqi_threshold THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('aqi threshold breached');
            END IF;

        WHEN 'TRAFFIC' THEN
            IF COALESCE(NEW.congestion_index, 0) >= 1.0 THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('traffic gridlock');
            END IF;

        WHEN 'PLATFORM' THEN
            IF COALESCE(NEW.platform_api_latency_ms, 0) > v_latency_threshold_ms THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('platform latency');
            ELSIF COALESCE(NEW.order_volume_drop_pct, 0) >= v_order_drop_threshold THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := FORMAT('order drop');
            END IF;

        WHEN 'SOCIAL' THEN
            IF COALESCE(NEW.curfew_active, FALSE) THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := 'curfew';
            ELSIF COALESCE(NEW.strike_active, FALSE) THEN
                NEW.threshold_breached := TRUE;
                NEW.threshold_breach_detail := 'strike';
            END IF;

    END CASE;

    IF NEW.fetch_status = 'SUCCESS' THEN
        NEW.last_successful_fetch_at := NOW();
        NEW.consecutive_failures := 0;
        NEW.source_available := TRUE;
        NEW.fallback_held_seconds := 0;
        NEW.is_stale := FALSE;
    ELSIF NEW.fetch_status IN ('TIMEOUT', 'HTTP_ERROR', 'PARSE_ERROR', 'RATE_LIMITED') THEN
        NEW.consecutive_failures := COALESCE(OLD.consecutive_failures, 0) + 1;
        NEW.source_available := FALSE;
        NEW.is_stale := TRUE;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_signal_cache_eval_threshold
    BEFORE INSERT OR UPDATE OF
        rainfall_mm_hr, wind_speed_km_hr,
        aqi_value,
        congestion_index,
        order_volume_drop_pct, platform_api_latency_ms,
        curfew_active, strike_active,
        fetch_status
    ON public.signal_cache
    FOR EACH ROW EXECUTE FUNCTION public.fn_signal_cache_eval_threshold();

CREATE OR REPLACE FUNCTION public.fn_signal_cache_update_hex_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_sources_available SMALLINT;
BEGIN
    SELECT COUNT(*)::SMALLINT
    INTO v_sources_available
    FROM public.signal_cache sc
    WHERE sc.hex_id = NEW.hex_id
      AND sc.source_available = TRUE
      AND sc.is_stale = FALSE
      AND sc.consecutive_failures < 3;

    UPDATE public.hex_zones
    SET signal_sources_available = v_sources_available,
        is_degraded_mode = (v_sources_available < 3)
    WHERE hex_id = NEW.hex_id;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_signal_cache_update_hex_availability
    AFTER INSERT OR UPDATE OF source_available, is_stale, consecutive_failures
    ON public.signal_cache
    FOR EACH ROW EXECUTE FUNCTION public.fn_signal_cache_update_hex_availability();

ALTER TABLE public.signal_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_signal_cache_select_authenticated
    ON public.signal_cache
    FOR SELECT
    TO authenticated
    USING (TRUE);

INSERT INTO public.schema_migrations (version, description)
VALUES ('004', 'Create signal_cache table')
ON CONFLICT (version) DO NOTHING;