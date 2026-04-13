-- Add explicit claim states for payout gateway failure handling.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'claim_status' AND e.enumlabel = 'payment_failed'
    ) THEN
        ALTER TYPE claim_status ADD VALUE 'payment_failed';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'claim_status' AND e.enumlabel = 'rollback'
    ) THEN
        ALTER TYPE claim_status ADD VALUE 'rollback';
    END IF;
END $$;
