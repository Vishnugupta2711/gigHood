DO $$
BEGIN
    CREATE SEQUENCE IF NOT EXISTS public.dci_history_id_seq
        AS BIGINT
        START WITH 1
        INCREMENT BY 1
        NO MAXVALUE
        CACHE 100;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.dci_history (

    id BIGINT NOT NULL DEFAULT nextval('public.dci_history_id_seq'),

    hex_id TEXT NOT NULL,

    dci_score DOUBLE PRECISION NOT NULL
        CHECK (dci_score BETWEEN 0.0 AND 1.0),

    dci_raw_sum DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    w_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    t_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    p_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    s_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    alpha DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    beta DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    gamma DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    delta DOUBLE PRECISION NOT NULL DEFAULT 0.10,

    model_version TEXT,

    status_before public.zone_status NOT NULL DEFAULT 'NORMAL',
    status_after public.zone_status NOT NULL DEFAULT 'NORMAL',

    is_transition_to_disrupted BOOLEAN NOT NULL DEFAULT FALSE,
    is_transition_to_cleared BOOLEAN NOT NULL DEFAULT FALSE,

    trigger_weather_breached BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_aqi_breached BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_traffic_breached BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_platform_breached BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_social_breached BOOLEAN NOT NULL DEFAULT FALSE,

    trigger_breach_count SMALLINT GENERATED ALWAYS AS (
        (trigger_weather_breached::INT +
         trigger_aqi_breached::INT +
         trigger_traffic_breached::INT +
         trigger_platform_breached::INT +
         trigger_social_breached::INT)::SMALLINT
    ) STORED,

    signal_sources_available SMALLINT NOT NULL DEFAULT 5
        CHECK (signal_sources_available BETWEEN 0 AND 5),

    is_degraded_computation BOOLEAN NOT NULL DEFAULT FALSE,

    signal_cache_snapshot_ids BIGINT[],

    active_worker_count_snapshot SMALLINT NOT NULL DEFAULT 0,

    computation_duration_ms INTEGER
        CHECK (computation_duration_ms IS NULL OR computation_duration_ms >= 0),

    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_dci_transition_disrupted
        CHECK (
            NOT is_transition_to_disrupted
            OR (status_before != 'DISRUPTED' AND status_after = 'DISRUPTED')
        ),

    CONSTRAINT chk_dci_transition_cleared
        CHECK (
            NOT is_transition_to_cleared
            OR (status_before = 'DISRUPTED' AND status_after != 'DISRUPTED')
        ),

    CONSTRAINT chk_dci_single_transition
        CHECK (NOT (is_transition_to_disrupted AND is_transition_to_cleared)),

    CONSTRAINT chk_dci_degraded_consistency
        CHECK (
            (NOT is_degraded_computation AND signal_sources_available >= 3)
            OR (is_degraded_computation AND signal_sources_available < 3)
        ),

    PRIMARY KEY (id, computed_at)
);

CREATE INDEX IF NOT EXISTS idx_dci_history_hex_time
    ON public.dci_history (hex_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_dci_history_transitions
    ON public.dci_history (hex_id, computed_at)
    WHERE is_transition_to_disrupted = TRUE
       OR is_transition_to_cleared = TRUE;

CREATE INDEX IF NOT EXISTS idx_dci_history_disrupted
    ON public.dci_history (hex_id, computed_at)
    WHERE status_after = 'DISRUPTED';

CREATE INDEX IF NOT EXISTS idx_dci_history_breach_count
    ON public.dci_history (trigger_breach_count DESC, computed_at DESC)
    WHERE trigger_breach_count > 0;

CREATE INDEX IF NOT EXISTS idx_dci_history_degraded
    ON public.dci_history (hex_id, computed_at)
    WHERE is_degraded_computation = TRUE;

CREATE INDEX IF NOT EXISTS idx_dci_history_time_only
    ON public.dci_history (computed_at DESC);

CREATE OR REPLACE FUNCTION public.fn_insert_dci_record(
    p_hex_id TEXT,
    p_dci_score DOUBLE PRECISION,
    p_w_score DOUBLE PRECISION,
    p_t_score DOUBLE PRECISION,
    p_p_score DOUBLE PRECISION,
    p_s_score DOUBLE PRECISION,
    p_alpha DOUBLE PRECISION,
    p_beta DOUBLE PRECISION,
    p_gamma DOUBLE PRECISION,
    p_delta DOUBLE PRECISION,
    p_status_before public.zone_status,
    p_status_after public.zone_status,
    p_signal_sources_available SMALLINT,
    p_signal_cache_snapshot_ids BIGINT[] DEFAULT NULL,
    p_computation_duration_ms INTEGER DEFAULT NULL,
    p_model_version TEXT DEFAULT NULL,
    p_weather_breached BOOLEAN DEFAULT FALSE,
    p_aqi_breached BOOLEAN DEFAULT FALSE,
    p_traffic_breached BOOLEAN DEFAULT FALSE,
    p_platform_breached BOOLEAN DEFAULT FALSE,
    p_social_breached BOOLEAN DEFAULT FALSE,
    p_active_worker_count SMALLINT DEFAULT 0
)
RETURNS TABLE (
    record_id BIGINT,
    is_disruption_onset BOOLEAN,
    is_disruption_cleared BOOLEAN,
    dci_raw_sum_out DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id BIGINT;
    v_raw_sum DOUBLE PRECISION;
    v_to_disrupted BOOLEAN;
    v_to_cleared BOOLEAN;
BEGIN
    v_raw_sum := p_alpha * p_w_score
               + p_beta * p_t_score
               + p_gamma * p_p_score
               + p_delta * p_s_score;

    v_to_disrupted := (p_status_before != 'DISRUPTED' AND p_status_after = 'DISRUPTED');
    v_to_cleared := (p_status_before = 'DISRUPTED' AND p_status_after != 'DISRUPTED');

    INSERT INTO public.dci_history (
        hex_id,
        dci_score, dci_raw_sum,
        w_score, t_score, p_score, s_score,
        alpha, beta, gamma, delta,
        model_version,
        status_before, status_after,
        is_transition_to_disrupted,
        is_transition_to_cleared,
        trigger_weather_breached, trigger_aqi_breached,
        trigger_traffic_breached, trigger_platform_breached,
        trigger_social_breached,
        signal_sources_available,
        is_degraded_computation,
        signal_cache_snapshot_ids,
        active_worker_count_snapshot,
        computation_duration_ms,
        computed_at
    )
    VALUES (
        p_hex_id,
        p_dci_score, v_raw_sum,
        p_w_score, p_t_score, p_p_score, p_s_score,
        p_alpha, p_beta, p_gamma, p_delta,
        p_model_version,
        p_status_before, p_status_after,
        v_to_disrupted,
        v_to_cleared,
        p_weather_breached, p_aqi_breached,
        p_traffic_breached, p_platform_breached,
        p_social_breached,
        p_signal_sources_available,
        (p_signal_sources_available < 3),
        p_signal_cache_snapshot_ids,
        p_active_worker_count,
        p_computation_duration_ms,
        NOW()
    )
    RETURNING id INTO v_id;

    RETURN QUERY SELECT v_id, v_to_disrupted, v_to_cleared, v_raw_sum;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_refresh_rolling_dci_averages(
    p_hex_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    hex_id TEXT,
    new_dci_4w DOUBLE PRECISION,
    new_dci_8w DOUBLE PRECISION,
    new_dci_12w DOUBLE PRECISION,
    new_tier public.worker_tier,
    prev_tier public.worker_tier
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH rolling_stats AS (
        SELECT
            dh.hex_id,
            AVG(dh.dci_score) FILTER (
                WHERE dh.computed_at >= NOW() - INTERVAL '28 days'
            ) AS avg_4w,
            AVG(dh.dci_score) FILTER (
                WHERE dh.computed_at >= NOW() - INTERVAL '56 days'
            ) AS avg_8w,
            AVG(dh.dci_score) FILTER (
                WHERE dh.computed_at >= NOW() - INTERVAL '84 days'
            ) AS avg_12w
        FROM public.dci_history dh
        WHERE (p_hex_ids IS NULL OR dh.hex_id = ANY(p_hex_ids))
          AND dh.computed_at >= NOW() - INTERVAL '84 days'
          AND NOT dh.is_degraded_computation
        GROUP BY dh.hex_id
    ),
    tier_assignment AS (
        SELECT
            rs.hex_id,
            COALESCE(rs.avg_4w, 0.0) AS avg_4w,
            COALESCE(rs.avg_8w, 0.0) AS avg_8w,
            COALESCE(rs.avg_12w, 0.0) AS avg_12w,
            CASE
                WHEN COALESCE(rs.avg_4w, 0) > 0.65 THEN 'C'::public.worker_tier
                WHEN COALESCE(rs.avg_4w, 0) > 0.40 THEN 'B'::public.worker_tier
                ELSE 'A'::public.worker_tier
            END AS new_tier
        FROM rolling_stats rs
    ),
    updated AS (
        UPDATE public.hex_zones hz
        SET
            rolling_dci_4w = ta.avg_4w,
            rolling_dci_8w = ta.avg_8w,
            rolling_dci_12w = ta.avg_12w,
            rolling_avg_updated_at = NOW(),
            previous_tier = hz.zone_risk_tier,
            zone_risk_tier = ta.new_tier,
            tier_assigned_at = NOW()
        FROM tier_assignment ta
        WHERE hz.hex_id = ta.hex_id
          AND hz.is_active = TRUE
        RETURNING
            hz.hex_id,
            hz.rolling_dci_4w,
            hz.rolling_dci_8w,
            hz.rolling_dci_12w,
            hz.zone_risk_tier,
            hz.previous_tier
    )
    SELECT * FROM updated;
END;
$$;

ALTER TABLE public.dci_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_dci_history_select_authenticated
    ON public.dci_history
    FOR SELECT
    TO authenticated
    USING (TRUE);

INSERT INTO public.schema_migrations (version, description)
VALUES ('005', 'Create dci_history table')
ON CONFLICT (version) DO NOTHING;