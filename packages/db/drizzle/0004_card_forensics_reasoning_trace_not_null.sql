-- Migration to ensure reasoning_trace is never null (backward compatibility guard)
-- This migration is idempotent and safe to run multiple times

-- Ensure reasoning_trace has a default value for any existing NULL rows
UPDATE card_forensics
SET reasoning_trace = '{}'
WHERE reasoning_trace IS NULL;

-- The column is already defined as NOT NULL with DEFAULT '{}' in the table creation,
-- but this migration ensures data integrity for any pre-existing rows

