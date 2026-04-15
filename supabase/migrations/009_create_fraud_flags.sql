DO $$ BEGIN
    CREATE TYPE public.fraud_flag_type AS ENUM (
        'GATE1_STATIC_DEVICE','GATE1_ALGORITHMIC_JITTER','GATE1_UNIFORM_ACCURACY',
        'GATE2_NO_CONFIRMATION','GATE2_WEAK_ONLINE_NO_ORDERS','GATE2_MICRO_DELIVERY_EXCLUDED','GATE2_PARTIAL_ACTIVITY',
        'GATE3_VELOCITY_VIOLATION',
        'MOCK_LOCATION_OS_LEVEL','MOCK_LOCATION_APP_LEVEL','BATTERY_CHARGING_OUTDOOR','WIFI_DURING_DELIVERY',
        'REGISTRATION_COHORT','DEVICE_MODEL_CONCENTRATION','COORDINATED_ENTRY_WINDOW',
        'DISTRIBUTED_RING_DETECTED','MOCK_LOCATION_NETWORK','CAPACITY_VIOLATION',
        'SOFT_FLAG_EARNINGS_INFLATION','SOFT_FLAG_CLAIM_FREQUENCY','SOFT_FLAG_PARTICIPATION_VARIANCE','SOFT_FLAG_DECLARATION_CLUSTERING',
        'PRE_CLAIM_MOCK_DETECTED_AT_PING','PRE_CLAIM_VELOCITY_AT_PING','PRE_CLAIM_ADVERSE_SELECTION',
        'FLAG_RETRACTED','FLAG_UPHELD'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.fraud_flag_resolution AS ENUM (
        'PENDING','UPHELD','RETRACTED','AUTO_CLEARED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.fraud_detection_layer AS ENUM (
        'GATE1_VARIANCE','GATE2_ORDER_ACTIVITY','GATE3_VELOCITY',
        'DEVICE_FINGERPRINT','CROSS_HEX_GRAPH','COMPOUND_SCORE',
        'SOFT_SIGNAL','PRE_CLAIM','MANUAL_REVIEW'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.fraud_flags_id_seq
    AS BIGINT START WITH 1 INCREMENT BY 1 NO MAXVALUE CACHE 50;

CREATE TABLE IF NOT EXISTS public.fraud_flags (

    id BIGINT NOT NULL DEFAULT nextval('public.fraud_flags_id_seq'),

    claim_id UUID REFERENCES public.claims(id) ON DELETE RESTRICT,
    worker_id UUID REFERENCES public.workers(id) ON DELETE RESTRICT,

    flag_type public.fraud_flag_type NOT NULL,
    detection_layer public.fraud_detection_layer NOT NULL,
    score_contribution SMALLINT NOT NULL DEFAULT 0 CHECK (score_contribution BETWEEN 0 AND 40),

    g1_lat_std_dev DOUBLE PRECISION,
    g1_lng_std_dev DOUBLE PRECISION,
    g1_accuracy_std_dev DOUBLE PRECISION,
    g1_coordinate_variance DOUBLE PRECISION,
    g1_jitter_pattern public.coordinate_jitter_pattern,
    g1_ping_count_in_window SMALLINT,

    g2_order_count SMALLINT,
    g2_last_order_at TIMESTAMPTZ,
    g2_online_duration_min INTEGER,
    g2_platform_api_available BOOLEAN,

    g3_entry_velocity_kmh DOUBLE PRECISION,
    g3_entry_at TIMESTAMPTZ,
    g3_seconds_to_entry INTEGER,
    g3_distance_from_prev_m DOUBLE PRECISION,

    dev_mock_location_os BOOLEAN,
    dev_mock_location_app BOOLEAN,
    dev_battery_charging BOOLEAN,
    dev_network_type VARCHAR(10),
    dev_signal_dbm_std_dev DOUBLE PRECISION,
    dev_model VARCHAR(100),
    dev_model_hex_frequency_pct DOUBLE PRECISION,
    dev_model_baseline_pct DOUBLE PRECISION,
    dev_model_deviation_factor DOUBLE PRECISION,

    net_flagged_hex_ids BIGINT[],
    net_flagged_worker_count INTEGER,
    net_registration_window_hr SMALLINT,
    net_cohort_size INTEGER,
    net_entry_cluster_window_sec INTEGER,

    soft_declared_earnings_paise INTEGER,
    soft_zone_90p_earnings_paise INTEGER,
    soft_claim_days_in_4w SMALLINT,
    soft_active_days_in_4w SMALLINT,
    soft_claim_frequency_pct DOUBLE PRECISION,

    cluster_event_id UUID,
    details JSONB,

    resolution public.fraud_flag_resolution NOT NULL DEFAULT 'PENDING',
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_notes TEXT,
    trust_score_delta_to_reverse SMALLINT,

    worker_trust_score_at_flag SMALLINT,
    claim_fraud_score_at_flag SMALLINT,
    claim_path_at_flag public.claim_path,

    was_deciding_factor BOOLEAN NOT NULL DEFAULT FALSE,
    appeal_filed_citing_flag BOOLEAN NOT NULL DEFAULT FALSE,

    trust_score_delta SMALLINT NOT NULL DEFAULT 0 CHECK (trust_score_delta BETWEEN -20 AND 5),

    flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fraud_engine_run_id UUID,

    PRIMARY KEY (id, flagged_at),

    CONSTRAINT chk_fraud_flags_has_subject
        CHECK (claim_id IS NOT NULL OR worker_id IS NOT NULL),

    CONSTRAINT chk_fraud_flags_retraction_notes
        CHECK (resolution != 'RETRACTED' OR resolution_notes IS NOT NULL),

    CONSTRAINT chk_fraud_flags_soft_flag_score
        CHECK (detection_layer != 'SOFT_SIGNAL' OR score_contribution = 0),

    CONSTRAINT chk_fraud_flags_g3_evidence
        CHECK (flag_type != 'GATE3_VELOCITY_VIOLATION'
        OR (g3_entry_velocity_kmh IS NOT NULL AND g3_entry_velocity_kmh > 120.0)),

    CONSTRAINT chk_fraud_flags_retraction_delta
        CHECK (resolution != 'RETRACTED'
        OR trust_score_delta_to_reverse IS NOT NULL)

) PARTITION BY RANGE (flagged_at);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_claim_id
    ON public.fraud_flags (claim_id, flag_type)
    WHERE claim_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fraud_flags_worker_time
    ON public.fraud_flags (worker_id, flagged_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_type_time
    ON public.fraud_flags (flag_type, flagged_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_cluster_event
    ON public.fraud_flags (cluster_event_id, flagged_at DESC)
    WHERE cluster_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fraud_flags_pending_resolution
    ON public.fraud_flags (resolution, flagged_at ASC)
    WHERE resolution = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_fraud_flags_deciding_factor
    ON public.fraud_flags (was_deciding_factor, flag_type)
    WHERE was_deciding_factor = TRUE;

CREATE INDEX IF NOT EXISTS idx_fraud_flags_detection_layer
    ON public.fraud_flags (detection_layer, flag_type, flagged_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_score_contribution
    ON public.fraud_flags (score_contribution DESC, flagged_at DESC)
    WHERE score_contribution > 0;

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

INSERT INTO public.schema_migrations (version, description)
VALUES ('009', 'Create fraud_flags table')
ON CONFLICT (version) DO NOTHING;