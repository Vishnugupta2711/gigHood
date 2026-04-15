DO $$ BEGIN
CREATE TYPE public.payment_status AS ENUM (
'INITIATED','PENDING_WEBHOOK','CONFIRMED','FAILED','RETRYING','CANCELLED','REFUNDED','DISPUTED'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE public.payment_failure_reason AS ENUM (
'INSUFFICIENT_BALANCE','INVALID_VPA','BANK_DECLINED','TIMEOUT','RAZORPAY_ERROR','NETWORK_ERROR','WEBHOOK_TIMEOUT','SIGNATURE_MISMATCH','DUPLICATE_REQUEST','WORKER_SUSPENDED','OTHER'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE public.reconciliation_status AS ENUM (
'PENDING','MATCHED','UNMATCHED','DISPUTED','WRITTEN_OFF'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.premium_payments_id_seq
AS BIGINT START WITH 1 INCREMENT BY 1 NO MAXVALUE CACHE 100;

CREATE TABLE IF NOT EXISTS public.premium_payments (
id BIGINT NOT NULL DEFAULT nextval('public.premium_payments_id_seq'),
worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
hex_id BIGINT NOT NULL,
city VARCHAR(50) NOT NULL,
tier public.worker_tier NOT NULL,
week_start DATE NOT NULL,
week_end DATE NOT NULL,
amount_paise INTEGER NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 10000),
reserve_fund_contribution_paise INTEGER NOT NULL DEFAULT 0,
net_premium_paise INTEGER GENERATED ALWAYS AS (amount_paise - reserve_fund_contribution_paise) STORED,
is_upgrade_payment BOOLEAN NOT NULL DEFAULT FALSE,
base_tier_amount_paise INTEGER DEFAULT 0,
upgrade_delta_paise INTEGER GENERATED ALWAYS AS (GREATEST(0, amount_paise - base_tier_amount_paise)) STORED,
idempotency_key TEXT NOT NULL,
razorpay_order_id VARCHAR(100),
razorpay_payment_id VARCHAR(100) UNIQUE,
razorpay_signature VARCHAR(200),
signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
upi_transaction_ref VARCHAR(100),
upi_vpa_used VARCHAR(100),
payment_channel public.payout_channel NOT NULL DEFAULT 'UPI',
status public.payment_status NOT NULL DEFAULT 'INITIATED',
failure_reason public.payment_failure_reason,
failure_detail TEXT,
attempt_count SMALLINT NOT NULL DEFAULT 1 CHECK (attempt_count BETWEEN 1 AND 3),
next_retry_at TIMESTAMPTZ,
previous_attempt_id BIGINT,
refund_issued BOOLEAN NOT NULL DEFAULT FALSE,
refund_amount_paise INTEGER DEFAULT 0,
razorpay_refund_id VARCHAR(100),
refund_reason TEXT,
refund_initiated_at TIMESTAMPTZ,
refund_confirmed_at TIMESTAMPTZ,
refund_days_remaining SMALLINT,
reconciliation_status public.reconciliation_status NOT NULL DEFAULT 'PENDING',
reconciled_at TIMESTAMPTZ,
razorpay_settlement_id VARCHAR(100),
reconciliation_discrepancy_paise INTEGER DEFAULT 0,
reconciliation_notes TEXT,
reserve_fund_credited BOOLEAN NOT NULL DEFAULT FALSE,
reserve_fund_credited_at TIMESTAMPTZ,
initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
confirmed_at TIMESTAMPTZ,
failed_at TIMESTAMPTZ,
paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
PRIMARY KEY (id, paid_at),
CHECK (week_end = week_start + INTERVAL '6 days')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_premium_payments_idempotency_confirmed
ON public.premium_payments (idempotency_key)
WHERE status = 'CONFIRMED';

CREATE UNIQUE INDEX IF NOT EXISTS uq_premium_payments_razorpay_payment_id
ON public.premium_payments (razorpay_payment_id)
WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_premium_payments_worker_time
ON public.premium_payments (worker_id, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_premium_payments_hex_week
ON public.premium_payments (hex_id, week_start, status);

CREATE INDEX IF NOT EXISTS idx_premium_payments_policy
ON public.premium_payments (policy_id, status);

CREATE INDEX IF NOT EXISTS idx_premium_payments_status_time
ON public.premium_payments (status, initiated_at DESC);

CREATE INDEX IF NOT EXISTS idx_premium_payments_retry_queue
ON public.premium_payments (next_retry_at ASC)
WHERE status = 'RETRYING';

CREATE INDEX IF NOT EXISTS idx_premium_payments_reconcile_queue
ON public.premium_payments (reconciliation_status, paid_at ASC)
WHERE status = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_premium_payments_reserve_fund
ON public.premium_payments (reserve_fund_credited, confirmed_at ASC)
WHERE status = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_premium_payments_disputed
ON public.premium_payments (reconciliation_status, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_premium_payments_city_week
ON public.premium_payments (city, week_start, tier);

ALTER TABLE public.premium_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_premium_payments_select_own
ON public.premium_payments
FOR SELECT
USING (worker_id = auth.uid());

INSERT INTO public.schema_migrations (version, description)
VALUES ('010', 'Create premium_payments')
ON CONFLICT (version) DO NOTHING;