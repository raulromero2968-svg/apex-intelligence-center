-- Migration: Card Forensics AI Analysis System
-- This migration creates the card_forensics table for AI-powered card authenticity analysis
-- with vector embeddings for visual similarity and structured defect detection

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create card_forensics table for AI analysis results
-- This table stores comprehensive forensic analysis of TCG cards including:
-- - Visual embeddings for similarity matching
-- - Structured reasoning trace for explainability
-- - Detected defects catalog
-- - Authenticity scoring
CREATE TABLE IF NOT EXISTS card_forensics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- Visual embedding vector (768 dimensions for CLIP ViT-L/14 or similar vision models)
  embedding vector(768),

  -- Structured reasoning trace for AI explainability (EU AI Act compliance)
  -- Example: { "steps": [...], "confidence": 0.95, "red_flags": [...] }
  reasoning_trace JSONB NOT NULL DEFAULT '{}',

  -- Detected defects catalog
  -- Example: { "print_lines": { "severity": "minor", "locations": [...] }, "centering": { "score": 8.5 } }
  detected_defects JSONB NOT NULL DEFAULT '{}',

  -- Authenticity score (0.0 - 1.0, where 1.0 is authentic)
  authenticity_score REAL NOT NULL,

  -- Model version for tracking analysis provenance
  model_version TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Ensure one analysis per card (can be relaxed to allow multiple versions)
  CONSTRAINT card_forensics_card_unique UNIQUE (card_id)
);

-- Indexes for Card Forensics Performance

-- 1. HNSW index for fast approximate nearest neighbor visual similarity search
-- HNSW (Hierarchical Navigable Small World) provides better performance than IVFFlat
-- for high-dimensional vectors and works well without manual tuning
CREATE INDEX IF NOT EXISTS idx_card_forensics_embedding
  ON card_forensics USING hnsw (embedding vector_cosine_ops);

-- 2. GIN index for reasoning_trace JSONB queries
-- Enables fast filtering by reasoning steps, confidence levels, and red flags
CREATE INDEX IF NOT EXISTS idx_card_forensics_reasoning_trace
  ON card_forensics USING GIN (reasoning_trace jsonb_path_ops);

-- 3. GIN index for detected_defects JSONB queries
-- Enables fast filtering by defect types and severity levels
CREATE INDEX IF NOT EXISTS idx_card_forensics_detected_defects
  ON card_forensics USING GIN (detected_defects jsonb_path_ops);

-- 4. Authenticity score index for filtering suspicious cards
CREATE INDEX IF NOT EXISTS idx_card_forensics_authenticity_score
  ON card_forensics (authenticity_score);

-- 5. Model version index for tracking analysis versions
CREATE INDEX IF NOT EXISTS idx_card_forensics_model_version
  ON card_forensics (model_version);

-- 6. Card ID index for fast lookups
CREATE INDEX IF NOT EXISTS idx_card_forensics_card_id
  ON card_forensics (card_id);

-- 7. Timestamp index for temporal queries
CREATE INDEX IF NOT EXISTS idx_card_forensics_created_at
  ON card_forensics (created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE card_forensics IS 'AI-powered card authenticity analysis with visual embeddings and defect detection';
COMMENT ON COLUMN card_forensics.embedding IS 'CLIP ViT-L/14 visual embedding vector (768 dimensions) for similarity matching';
COMMENT ON COLUMN card_forensics.reasoning_trace IS 'Structured reasoning trace for AI explainability and EU AI Act compliance';
COMMENT ON COLUMN card_forensics.detected_defects IS 'Catalog of detected defects with severity levels and locations';
COMMENT ON COLUMN card_forensics.authenticity_score IS 'Authenticity score from 0.0 (counterfeit) to 1.0 (authentic)';
COMMENT ON COLUMN card_forensics.model_version IS 'Model version identifier for tracking analysis provenance';
COMMENT ON INDEX idx_card_forensics_embedding IS 'HNSW index for fast visual similarity search using cosine distance';
COMMENT ON INDEX idx_card_forensics_reasoning_trace IS 'GIN index for fast reasoning trace queries';
COMMENT ON INDEX idx_card_forensics_detected_defects IS 'GIN index for fast defect filtering';

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_card_forensics_updated_at
  BEFORE UPDATE ON card_forensics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
