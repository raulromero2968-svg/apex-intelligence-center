-- Add educational warning fields to cards table
-- These fields track 7-day price gains and manipulation flags
-- to trigger educational pop-ups for high-risk cards

-- Add 7-day gain percentage column
ALTER TABLE "cards"
ADD COLUMN IF NOT EXISTS "seven_day_gain_percent" real;

-- Add manipulation flag column
ALTER TABLE "cards"
ADD COLUMN IF NOT EXISTS "is_manipulated" boolean NOT NULL DEFAULT false;

-- Add manipulation reason column
ALTER TABLE "cards"
ADD COLUMN IF NOT EXISTS "manipulation_reason" text;

-- Add last flagged timestamp column
ALTER TABLE "cards"
ADD COLUMN IF NOT EXISTS "last_flagged_at" timestamp;

-- Create index on is_manipulated and seven_day_gain_percent for quick filtering
CREATE INDEX IF NOT EXISTS "idx_cards_high_risk"
ON "cards" ("is_manipulated", "seven_day_gain_percent")
WHERE "is_manipulated" = true OR "seven_day_gain_percent" > 100;

-- Create index on last_flagged_at for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_cards_last_flagged"
ON "cards" ("last_flagged_at")
WHERE "last_flagged_at" IS NOT NULL;
