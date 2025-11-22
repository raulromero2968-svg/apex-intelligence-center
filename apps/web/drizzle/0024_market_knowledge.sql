-- Migration: Market Knowledge Table with Vector Embeddings
-- This migration creates the market_knowledge table for storing AI-generated
-- market intelligence claims with sentiment analysis and reliability scoring

-- Ensure pgvector extension is enabled (should already be from migration 0020)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create market_knowledge table
-- Stores market intelligence claims with embeddings, sentiment, and clustering
CREATE TABLE IF NOT EXISTS market_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vector embedding for semantic search (OpenAI text-embedding-3-large)
  embedding vector(1536) NOT NULL,

  -- Market sentiment classification
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),

  -- Type/category of the claim
  claim_type TEXT NOT NULL,

  -- Reliability score (0.0 to 1.0)
  reliability_score REAL NOT NULL CHECK (reliability_score >= 0.0 AND reliability_score <= 1.0),

  -- Cluster ID for knowledge grouping
  cluster_id INTEGER,

  -- Claim content (the actual market intelligence statement)
  content TEXT NOT NULL,

  -- Source metadata (provenance, citations, etc.)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- 1. HNSW index for vector similarity search (faster than IVFFlat for queries)
-- HNSW provides better recall and query performance at the cost of slower inserts
CREATE INDEX IF NOT EXISTS idx_market_knowledge_embedding_hnsw
  ON market_knowledge USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 2. B-tree composite index on sentiment + claim_type for filtering
-- Enables fast queries like: WHERE sentiment = 'bullish' AND claim_type = 'price_movement'
CREATE INDEX IF NOT EXISTS idx_market_knowledge_sentiment_claim_type
  ON market_knowledge (sentiment, claim_type);

-- 3. Index on reliability_score for high-confidence filtering
CREATE INDEX IF NOT EXISTS idx_market_knowledge_reliability
  ON market_knowledge (reliability_score DESC);

-- 4. Index on cluster_id for grouping related knowledge
CREATE INDEX IF NOT EXISTS idx_market_knowledge_cluster
  ON market_knowledge (cluster_id)
  WHERE cluster_id IS NOT NULL;

-- 5. Metadata GIN index for flexible JSONB queries
CREATE INDEX IF NOT EXISTS idx_market_knowledge_metadata
  ON market_knowledge USING GIN (metadata jsonb_path_ops);

-- 6. Timestamp index for temporal queries
CREATE INDEX IF NOT EXISTS idx_market_knowledge_created_at
  ON market_knowledge (created_at DESC);

-- 7. Composite index for common query patterns (sentiment + reliability)
CREATE INDEX IF NOT EXISTS idx_market_knowledge_sentiment_reliability
  ON market_knowledge (sentiment, reliability_score DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE market_knowledge IS 'AI-generated market intelligence claims with vector embeddings, sentiment analysis, and reliability scoring';
COMMENT ON COLUMN market_knowledge.embedding IS 'OpenAI text-embedding-3-large vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN market_knowledge.sentiment IS 'Market sentiment: bullish (positive), bearish (negative), or neutral';
COMMENT ON COLUMN market_knowledge.claim_type IS 'Category of claim (e.g., price_movement, arbitrage, trend_analysis, pop_delta)';
COMMENT ON COLUMN market_knowledge.reliability_score IS 'Confidence score from 0.0 to 1.0 (higher = more reliable)';
COMMENT ON COLUMN market_knowledge.cluster_id IS 'Optional cluster ID for grouping related knowledge claims';
COMMENT ON COLUMN market_knowledge.content IS 'The actual market intelligence statement/claim';
COMMENT ON COLUMN market_knowledge.metadata IS 'Source provenance, citations, and additional context';

COMMENT ON INDEX idx_market_knowledge_embedding_hnsw IS 'HNSW index for fast semantic similarity search (cosine distance)';
COMMENT ON INDEX idx_market_knowledge_sentiment_claim_type IS 'B-tree index for filtering by sentiment and claim type';
COMMENT ON INDEX idx_market_knowledge_reliability IS 'Index for filtering high-confidence claims';
COMMENT ON INDEX idx_market_knowledge_cluster IS 'Partial index for cluster-based queries';

-- ============================================================================
-- TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================================================

-- The update_updated_at_column() function already exists from migration 0020
-- Just add the trigger for this table
CREATE TRIGGER update_market_knowledge_updated_at
  BEFORE UPDATE ON market_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXAMPLE METADATA STRUCTURE
-- ============================================================================
--
-- {
--   "source": "maker_framework",
--   "task_id": "clxyz123",
--   "vote_consensus": 5,
--   "red_flags": 0,
--   "citations": [
--     {"type": "sale", "id": "sale_abc123"},
--     {"type": "population_report", "id": "pop_xyz789"}
--   ],
--   "generated_at": "2025-11-21T10:30:00Z",
--   "model": "claude-sonnet-4.5",
--   "unique_id": "mk_charizard_bullish_20251121_103000"
-- }
