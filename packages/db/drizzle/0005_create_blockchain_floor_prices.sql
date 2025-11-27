-- Create blockchain_floor_prices table for real-time floor price feeds
CREATE TABLE IF NOT EXISTS blockchain_floor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  collection TEXT NOT NULL,
  token_contract TEXT NOT NULL,
  currency TEXT NOT NULL,
  floor_price NUMERIC(78, 0) NOT NULL,
  floor_price_usd NUMERIC(20, 2) NOT NULL,
  block_number INTEGER NOT NULL,
  tx_hash TEXT,
  liquidity_venue TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index on (chain, collection, observed_at DESC) for efficient queries
CREATE INDEX IF NOT EXISTS blockchain_floor_prices_chain_collection_observed_idx
ON blockchain_floor_prices(chain, collection, observed_at DESC);

-- Index on observed_at for time-range queries
CREATE INDEX IF NOT EXISTS blockchain_floor_prices_observed_at_idx
ON blockchain_floor_prices(observed_at);

