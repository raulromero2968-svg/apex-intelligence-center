-- Create card_forensics table for VARC job results
CREATE TABLE IF NOT EXISTS card_forensics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  card_id TEXT NOT NULL,
  image_url TEXT,
  grade REAL,
  grade_confidence REAL,
  counterfeit_score REAL,
  embedding_768 vector(768),
  embedding_1536 vector(1536),
  reasoning_trace JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B-tree index on card_id for fast lookups
CREATE INDEX IF NOT EXISTS card_forensics_card_id_idx ON card_forensics(card_id);

-- Unique index on job_id (already enforced by UNIQUE constraint, but explicit for clarity)
CREATE UNIQUE INDEX IF NOT EXISTS card_forensics_job_id_unique_idx ON card_forensics(job_id);

-- HNSW index on embedding_768 for vector similarity search
CREATE INDEX IF NOT EXISTS card_forensics_embedding_768_hnsw
ON card_forensics
USING hnsw (embedding_768 vector_l2_ops);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_card_forensics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_forensics_updated_at_trigger
BEFORE UPDATE ON card_forensics
FOR EACH ROW
EXECUTE FUNCTION update_card_forensics_updated_at();

