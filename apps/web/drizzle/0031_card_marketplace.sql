-- Card Marketplace Migration
-- Adds tables for TCG card listings and transactions with RC/USD hybrid payments
-- Reference: knowledge-09-database-architecture.md, knowledge-01-api-stripe-integration.md

-- =============================================================================
-- CARD LISTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "card_listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "card_id" text NOT NULL REFERENCES "cards"("id") ON DELETE CASCADE,
  "seller_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text,
  "description" text,
  "price_rc" integer,
  "price_usd" real,
  "quantity" integer NOT NULL DEFAULT 1,
  "grade" text,
  "grading_company" text,
  "cert_number" text,
  "condition" text DEFAULT 'near_mint',
  "image_urls" jsonb DEFAULT '[]',
  "status" text NOT NULL DEFAULT 'active',
  "view_count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp,
  "sold_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "card_listings_status_check" CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
  CONSTRAINT "card_listings_price_check" CHECK (price_rc IS NOT NULL OR price_usd IS NOT NULL)
);

-- Indexes for card_listings
CREATE INDEX IF NOT EXISTS "idx_card_listings_card" ON "card_listings"("card_id");
CREATE INDEX IF NOT EXISTS "idx_card_listings_seller" ON "card_listings"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_card_listings_status" ON "card_listings"("status");
CREATE INDEX IF NOT EXISTS "idx_card_listings_price_rc" ON "card_listings"("price_rc");
CREATE INDEX IF NOT EXISTS "idx_card_listings_price_usd" ON "card_listings"("price_usd");
CREATE INDEX IF NOT EXISTS "idx_card_listings_created" ON "card_listings"("created_at");
CREATE INDEX IF NOT EXISTS "idx_card_listings_active_price" ON "card_listings"("status", "price_usd") WHERE status = 'active';

-- =============================================================================
-- CARD TRANSACTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "card_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id" uuid NOT NULL REFERENCES "card_listings"("id") ON DELETE CASCADE,
  "buyer_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seller_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "card_id" text NOT NULL REFERENCES "cards"("id") ON DELETE CASCADE,
  "payment_type" text NOT NULL,
  "amount" real NOT NULL,
  "platform_fee" real DEFAULT 0,
  "seller_payout" real NOT NULL,
  "stripe_payment_id" text,
  "stripe_transfer_id" text,
  "rc_transaction_id" text,
  "status" text NOT NULL DEFAULT 'completed',
  "shipping_address" jsonb,
  "tracking_number" text,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "card_transactions_payment_type_check" CHECK (payment_type IN ('rc', 'usd')),
  CONSTRAINT "card_transactions_status_check" CHECK (status IN ('pending', 'completed', 'refunded', 'disputed'))
);

-- Indexes for card_transactions
CREATE INDEX IF NOT EXISTS "idx_card_transactions_listing" ON "card_transactions"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_card_transactions_buyer" ON "card_transactions"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_card_transactions_seller" ON "card_transactions"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_card_transactions_card" ON "card_transactions"("card_id");
CREATE INDEX IF NOT EXISTS "idx_card_transactions_status" ON "card_transactions"("status");
CREATE INDEX IF NOT EXISTS "idx_card_transactions_created" ON "card_transactions"("created_at");

-- =============================================================================
-- CARD LISTING WATCHERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS "card_listing_watchers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id" uuid NOT NULL REFERENCES "card_listings"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "notify_on_price_drop" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for card_listing_watchers
CREATE INDEX IF NOT EXISTS "idx_card_listing_watchers_listing" ON "card_listing_watchers"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_card_listing_watchers_user" ON "card_listing_watchers"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_card_listing_watchers_unique" ON "card_listing_watchers"("listing_id", "user_id");

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_card_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS card_listings_updated_at ON card_listings;
CREATE TRIGGER card_listings_updated_at
  BEFORE UPDATE ON card_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_card_listings_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE card_listings IS 'TCG card marketplace listings with RC/USD hybrid pricing';
COMMENT ON TABLE card_transactions IS 'Marketplace purchase transactions with payment details';
COMMENT ON TABLE card_listing_watchers IS 'Users watching listings for price drops';

COMMENT ON COLUMN card_listings.price_rc IS 'Price in Reputation Credits (internal currency)';
COMMENT ON COLUMN card_listings.price_usd IS 'Price in USD (processed via Stripe)';
COMMENT ON COLUMN card_transactions.platform_fee IS 'Platform fee (10% RC, 2.9%+$0.30 Stripe)';
COMMENT ON COLUMN card_transactions.seller_payout IS 'Amount after platform fees';
