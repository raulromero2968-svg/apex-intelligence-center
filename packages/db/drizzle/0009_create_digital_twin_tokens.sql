-- Create digital_twin_status enum
CREATE TYPE digital_twin_status AS ENUM ('pending', 'minted', 'failed');

-- Create digital_twin_tokens table
CREATE TABLE IF NOT EXISTS digital_twin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_forensics_id UUID NOT NULL UNIQUE,
  user_id TEXT,
  card_id TEXT,
  polygon_token_id TEXT NOT NULL,
  polygon_tx_hash TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  status digital_twin_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on card_forensics_id (one twin per forensics record)
CREATE UNIQUE INDEX IF NOT EXISTS digital_twin_tokens_card_forensics_id_unique_idx 
ON digital_twin_tokens(card_forensics_id);

-- Index on polygon_token_id for lookups
CREATE INDEX IF NOT EXISTS digital_twin_tokens_polygon_token_id_idx 
ON digital_twin_tokens(polygon_token_id);

-- Index on user_id for user queries
CREATE INDEX IF NOT EXISTS digital_twin_tokens_user_id_idx 
ON digital_twin_tokens(user_id);

-- Index on card_id for card queries
CREATE INDEX IF NOT EXISTS digital_twin_tokens_card_id_idx 
ON digital_twin_tokens(card_id);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS digital_twin_tokens_status_idx 
ON digital_twin_tokens(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_digital_twin_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digital_twin_tokens_updated_at_trigger
BEFORE UPDATE ON digital_twin_tokens
FOR EACH ROW
EXECUTE FUNCTION update_digital_twin_tokens_updated_at();

