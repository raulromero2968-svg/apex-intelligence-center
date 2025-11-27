-- Create card_fingerprints table for unique fingerprint hashes
CREATE TABLE IF NOT EXISTS card_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  card_id TEXT,
  job_id TEXT,
  image_url TEXT NOT NULL,
  grade REAL,
  hash_version TEXT NOT NULL,
  fingerprint_vector vector(256) NOT NULL,
  fingerprint_hex TEXT NOT NULL,
  nearest_neighbor_id UUID,
  nearest_neighbor_distance REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index on (hash_version, fingerprint_hex) to prevent exact duplicates
CREATE UNIQUE INDEX IF NOT EXISTS card_fingerprints_hash_version_fingerprint_hex_unique_idx
ON card_fingerprints(hash_version, fingerprint_hex);

-- HNSW index on fingerprint_vector for approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS card_fingerprints_fingerprint_vector_hnsw_idx
ON card_fingerprints
USING hnsw (fingerprint_vector vector_l2_ops);

-- B-tree index on card_id for fast lookups
CREATE INDEX IF NOT EXISTS card_fingerprints_card_id_idx ON card_fingerprints(card_id);

-- B-tree index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS card_fingerprints_user_id_idx ON card_fingerprints(user_id);

-- B-tree index on job_id for linking to VARC jobs
CREATE INDEX IF NOT EXISTS card_fingerprints_job_id_idx ON card_fingerprints(job_id);

