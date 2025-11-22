-- Migration: Add break mode fields to users table
-- Purpose: Allow users (child or parent) to pause all notifications for 24 hours

ALTER TABLE "users" ADD COLUMN "break_mode_until" timestamp;
ALTER TABLE "users" ADD COLUMN "break_mode_activated_by" text;

-- Add check constraint for break_mode_activated_by enum
ALTER TABLE "users" ADD CONSTRAINT "users_break_mode_activated_by_check"
CHECK ("break_mode_activated_by" IN ('child', 'parent'));

-- Add index for efficient break mode queries
CREATE INDEX "idx_users_break_mode" ON "users"("break_mode_until") WHERE "break_mode_until" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "users"."break_mode_until" IS '24-hour notification pause expiry timestamp. NULL = not in break mode';
COMMENT ON COLUMN "users"."break_mode_activated_by" IS 'Who activated break mode: child or parent';
