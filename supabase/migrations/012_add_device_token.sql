-- Migration 008: Add Firebase Device Token field to workers

ALTER TABLE workers
ADD COLUMN device_token TEXT;

COMMENT ON COLUMN workers.device_token IS 'Firebase Cloud Messaging unique device token assigned to the worker';
