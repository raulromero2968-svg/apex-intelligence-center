-- Create arbitrage_opportunities table
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_collection TEXT NOT NULL,
  edge_bps REAL NOT NULL,
  estimated_profit_usd NUMERIC(12, 2) NOT NULL,
  risk_score REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  legs JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS arbitrage_opportunities_created_at_idx ON arbitrage_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS arbitrage_opportunities_base_collection_idx ON arbitrage_opportunities(base_collection);
CREATE INDEX IF NOT EXISTS arbitrage_opportunities_status_idx ON arbitrage_opportunities(status);

