-- Add hysteresis tracking to hex_zones for flapping prevention
ALTER TABLE public.hex_zones
ADD COLUMN IF NOT EXISTS consecutive_normal_cycles INT DEFAULT 0 NOT NULL;
