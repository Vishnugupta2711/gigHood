DO $$ BEGIN
    CREATE TYPE public.ping_source AS ENUM (
        'FOREGROUND',
        'BACKGROUND_WORKMANAGER',
        'BACKGROUND_BGTASK',
        'FALLBACK_PLATFORM_GPS'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.coordinate_jitter_pattern AS ENUM (
        'UNKNOWN',
        'NATURAL',
        'ALGORITHMIC',
        'STATIC'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.location_pings_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    CACHE 500;

CREATE TABLE IF NOT EXISTS public.location_pings (

    id BIGINT NOT NULL DEFAULT nextval('public.location_pings_id_seq'),

    worker_id UUID NOT NULL
        REFERENCES public.workers(id)
        ON DELETE CASCADE,

    latitude DOUBLE PRECISION NOT NULL
        CHECK (latitude BETWEEN 6.0 AND 37.0),
    longitude DOUBLE PRECISION NOT NULL
        CHECK (longitude BETWEEN 68.0 AND 97.0),

    location_point GEOMETRY(POINT, 4326),

    ping_hex_id TEXT,

    is_in_registered_hex BOOLEAN NOT NULL DEFAULT FALSE,

    accuracy_radius_m DOUBLE PRECISION
        CHECK (accuracy_radius_m IS NULL OR accuracy_radius_m BETWEEN 0 AND 5000),

    gps_accuracy_confidence DOUBLE PRECISION
        CHECK (gps_accuracy_confidence IS NULL OR gps_accuracy_confidence BETWEEN 0.0 AND 1.0),

    network_signal_strength_dbm INTEGER
        CHECK (network_signal_strength_dbm IS NULL OR network_signal_strength_dbm BETWEEN -150 AND 0),

    network_type VARCHAR(10)
        CHECK (network_type IS NULL OR network_type IN ('2G','3G','4G','5G','WIFI','UNKNOWN')),

    mock_location_os_level BOOLEAN NOT NULL DEFAULT FALSE,
    mock_location_app_level BOOLEAN NOT NULL DEFAULT FALSE,

    battery_is_charging BOOLEAN,

    battery_level_pct SMALLINT
        CHECK (battery_level_pct IS NULL OR battery_level_pct BETWEEN 0 AND 100),

    screen_on BOOLEAN,

    ping_source public.ping_source NOT NULL DEFAULT 'BACKGROUND_WORKMANAGER',

    app_version VARCHAR(20),

    pop_validation_run_id UUID,

    is_in_pop_window BOOLEAN NOT NULL DEFAULT FALSE,

    coordinate_jitter_pattern public.coordinate_jitter_pattern NOT NULL DEFAULT 'UNKNOWN',

    velocity_from_prev_ms DOUBLE PRECISION
        CHECK (velocity_from_prev_ms IS NULL OR velocity_from_prev_ms >= 0),

    distance_from_prev_m DOUBLE PRECISION
        CHECK (distance_from_prev_m IS NULL OR distance_from_prev_m >= 0),

    seconds_since_prev_ping INTEGER
        CHECK (seconds_since_prev_ping IS NULL OR seconds_since_prev_ping >= 0),

    ping_hmac CHAR(64),

    ping_hmac_valid BOOLEAN NOT NULL DEFAULT TRUE,

    pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    offline_queue_delay_sec INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (received_at - pinged_at))::INTEGER
    ) STORED,

    PRIMARY KEY (id, pinged_at),

    CONSTRAINT chk_pings_velocity_consistency
        CHECK (
            velocity_from_prev_ms IS NULL
            OR (distance_from_prev_m IS NOT NULL AND seconds_since_prev_ping IS NOT NULL)
        ),

    CONSTRAINT chk_pings_hmac_format
        CHECK (
            ping_hmac IS NULL OR ping_hmac ~ '^[a-f0-9]{64}$'
        ),

    CONSTRAINT chk_pings_network_consistency
        CHECK (
            network_signal_strength_dbm IS NULL OR network_type IS NOT NULL
        )

) PARTITION BY RANGE (pinged_at);

CREATE OR REPLACE FUNCTION public.fn_create_location_ping_partition(
    p_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_partition_name TEXT;
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
BEGIN
    v_partition_name := FORMAT('location_pings_%s', TO_CHAR(p_date, 'YYYY_MM_DD'));
    v_start := p_date::TIMESTAMPTZ;
    v_end := (p_date + INTERVAL '1 day')::TIMESTAMPTZ;

    EXECUTE FORMAT(
        'CREATE TABLE IF NOT EXISTS public.%I
         PARTITION OF public.location_pings
         FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, v_start, v_end
    );

    RETURN v_partition_name;
END;
$$;

DO $$
DECLARE
    v_base DATE := CURRENT_DATE - INTERVAL '1 day';
    i INTEGER;
BEGIN
    FOR i IN 0..4 LOOP
        PERFORM public.fn_create_location_ping_partition(
            (v_base + (i || ' days')::INTERVAL)::DATE
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_location_pings_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_registered_hex TEXT;
    v_prev_lat DOUBLE PRECISION;
    v_prev_lng DOUBLE PRECISION;
    v_prev_time TIMESTAMPTZ;
    v_distance_m DOUBLE PRECISION;
    v_elapsed_sec DOUBLE PRECISION;
BEGIN
    NEW.location_point := ST_SetSRID(
        ST_MakePoint(NEW.longitude, NEW.latitude),
        4326
    );

    SELECT w.registered_hex_id
    INTO v_registered_hex
    FROM public.workers w
    WHERE w.id = NEW.worker_id;

    NEW.is_in_registered_hex := (
        v_registered_hex IS NOT NULL
        AND NEW.ping_hex_id = v_registered_hex
    );

    SELECT
        lp.latitude,
        lp.longitude,
        lp.pinged_at
    INTO v_prev_lat, v_prev_lng, v_prev_time
    FROM public.location_pings lp
    WHERE lp.worker_id = NEW.worker_id
      AND lp.pinged_at < NEW.pinged_at
    ORDER BY lp.pinged_at DESC
    LIMIT 1;

    IF v_prev_lat IS NOT NULL THEN
        v_distance_m := ST_Distance(
            ST_SetSRID(ST_MakePoint(v_prev_lng, v_prev_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
        );

        v_elapsed_sec := EXTRACT(EPOCH FROM (NEW.pinged_at - v_prev_time));

        NEW.distance_from_prev_m := v_distance_m;
        NEW.seconds_since_prev_ping := v_elapsed_sec::INTEGER;
        NEW.velocity_from_prev_ms := CASE
            WHEN v_elapsed_sec > 0 THEN v_distance_m / v_elapsed_sec
            ELSE NULL
        END;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_location_pings_on_insert
    BEFORE INSERT ON public.location_pings
    FOR EACH ROW EXECUTE FUNCTION public.fn_location_pings_on_insert();

CREATE INDEX IF NOT EXISTS idx_location_pings_worker_time
    ON public.location_pings (worker_id, pinged_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_pings_hex_time
    ON public.location_pings (ping_hex_id, pinged_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_pings_pop_window
    ON public.location_pings (worker_id, is_in_pop_window)
    WHERE is_in_pop_window = TRUE;

CREATE INDEX IF NOT EXISTS idx_location_pings_mock_os
    ON public.location_pings (mock_location_os_level, worker_id)
    WHERE mock_location_os_level = TRUE;

CREATE INDEX IF NOT EXISTS idx_location_pings_velocity_violation
    ON public.location_pings (worker_id, velocity_from_prev_ms DESC)
    WHERE velocity_from_prev_ms > 33.3;

CREATE OR REPLACE VIEW public.pop_evidence_summary AS
SELECT
    lp.worker_id,
    lp.pop_validation_run_id,
    COUNT(*) AS total_pings_used,
    MIN(lp.pinged_at) AS window_start,
    MAX(lp.pinged_at) AS window_end,
    ROUND(AVG(lp.accuracy_radius_m)::NUMERIC, 1) AS avg_accuracy_m,
    MAX(lp.velocity_from_prev_ms * 3.6) AS max_speed_kmh,
    BOOL_OR(lp.mock_location_os_level) AS any_mock_detected,
    MAX(lp.coordinate_jitter_pattern::TEXT) AS jitter_pattern
FROM public.location_pings lp
WHERE lp.is_in_pop_window = TRUE
  AND lp.pop_validation_run_id IS NOT NULL
GROUP BY lp.worker_id, lp.pop_validation_run_id
ORDER BY window_end DESC;

ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_location_pings_select_own
    ON public.location_pings
    FOR SELECT
    USING (worker_id = auth.uid());

CREATE POLICY policy_location_pings_insert_own
    ON public.location_pings
    FOR INSERT
    WITH CHECK (worker_id = auth.uid());

INSERT INTO public.schema_migrations (version, description)
VALUES ('006', 'Create location_pings table')
ON CONFLICT (version) DO NOTHING;