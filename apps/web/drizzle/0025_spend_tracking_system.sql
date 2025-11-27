-- Migration: Spend Tracking System
-- Created: 2025-11-21
-- Purpose: Implement unbreakable daily/weekly spend limits across Stripe + on-chain payments

-- Create spend_tracking table
CREATE TABLE IF NOT EXISTS "spend_tracking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount_usd" real NOT NULL,
  "payment_type" text NOT NULL CHECK ("payment_type" IN ('stripe', 'onchain')),
  "stripe_payment_intent_id" text,
  "stripe_charge_id" text,
  "onchain_tx_hash" text,
  "onchain_network" text,
  "status" text DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'completed', 'failed', 'refunded')),
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- Create indexes for fast spend limit queries
CREATE INDEX IF NOT EXISTS "idx_spend_tracking_user_created" ON "spend_tracking" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_spend_tracking_user_status" ON "spend_tracking" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_spend_tracking_stripe_pi" ON "spend_tracking" ("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "idx_spend_tracking_onchain_tx" ON "spend_tracking" ("onchain_tx_hash");
CREATE INDEX IF NOT EXISTS "idx_spend_tracking_created" ON "spend_tracking" ("created_at");

-- Create unique constraints to prevent double-counting
CREATE UNIQUE INDEX IF NOT EXISTS "idx_spend_tracking_stripe_unique" ON "spend_tracking" ("stripe_payment_intent_id") WHERE "stripe_payment_intent_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_spend_tracking_onchain_unique" ON "spend_tracking" ("onchain_tx_hash", "onchain_network") WHERE "onchain_tx_hash" IS NOT NULL AND "onchain_network" IS NOT NULL;

-- Add comment explaining the table
COMMENT ON TABLE "spend_tracking" IS 'Tracks all payment transactions for enforcing unbreakable $50 daily and $200 weekly spend limits';
COMMENT ON COLUMN "spend_tracking"."amount_usd" IS 'All amounts normalized to USD for consistent limit enforcement';
COMMENT ON COLUMN "spend_tracking"."created_at" IS 'Used for rolling window calculations (24h daily, 7d weekly)';
