-- Migration: Simulation Predictions with EGGROLL Evolution and Manifold Markets Integration
-- This migration creates tables for storing Bostrom trilemma predictions, EGGROLL evolution
-- history, and Manifold Markets data with pgvector HNSW indexing.
--
-- Related: knowledge-09-database-architecture.md (pgvector HNSW for prediction embeddings)
-- Related: knowledge-02-ai-rag-architecture-v2.md (EGGROLL integration in fusion queries)

-- Ensure pgvector extension is enabled (should already be from migration 0020)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- SIMULATION PREDICTIONS TABLE
-- ============================================================================
-- Stores Bostrom trilemma predictions with vector embeddings for semantic search
-- Supports TCG "fantasy markets" as analog models for existential predictions

CREATE TABLE IF NOT EXISTS simulation_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who created the prediction
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Query that generated this prediction
  original_query TEXT NOT NULL,

  -- Bostrom scenario type
  scenario TEXT NOT NULL CHECK (scenario IN ('extinction', 'posthuman', 'simulated_reality', 'general')),

  -- Prediction content (the actual analysis)
  content TEXT NOT NULL,

  -- Vector embedding for semantic search (text-embedding-3-large: 1536 dims)
  embedding vector(1536) NOT NULL,

  -- EGGROLL fitness score (1-10 integer scale)
  fitness_score INTEGER NOT NULL CHECK (fitness_score >= 1 AND fitness_score <= 10),

  -- Probability estimate (0.0 to 1.0)
  probability_estimate REAL CHECK (probability_estimate >= 0.0 AND probability_estimate <= 1.0),

  -- Source market data (Manifold, Polymarket, etc.)
  market_source TEXT CHECK (market_source IN ('manifold', 'polymarket', 'metaculus', 'internal', 'hybrid')),

  -- External market ID (if sourced from prediction market)
  external_market_id TEXT,

  -- Confidence metadata from EGGROLL evolution
  evolution_metadata JSONB NOT NULL DEFAULT '{}',

  -- Source citations and provenance
  sources JSONB NOT NULL DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ -- Optional TTL for cache invalidation
);

-- ============================================================================
-- EGGROLL EVOLUTION HISTORY TABLE
-- ============================================================================
-- Tracks EGGROLL evolution generations for reproducibility and analysis

CREATE TABLE IF NOT EXISTS eggroll_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent prediction ID
  prediction_id UUID REFERENCES simulation_predictions(id) ON DELETE CASCADE,

  -- Evolution generation (0 = initial, 1+ = evolved)
  generation INTEGER NOT NULL CHECK (generation >= 0),

  -- Variant content
  variant_content TEXT NOT NULL,

  -- Integer weight (1-10)
  weight INTEGER NOT NULL CHECK (weight >= 1 AND weight <= 10),

  -- Mutation type applied
  mutation_type TEXT CHECK (mutation_type IN (
    'initial',
    'weight_adjust',
    'perspective_shift',
    'evidence_refinement',
    'scenario_blend',
    'reranked',
    'fallback',
    'random'
  )),

  -- Mutation history (lineage tracking)
  mutation_history TEXT[] DEFAULT '{}',

  -- Was this variant selected as fittest?
  is_fittest BOOLEAN DEFAULT FALSE,

  -- Cohere rerank score (if reranking was applied)
  rerank_score REAL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- MANIFOLD MARKET CACHE TABLE
-- ============================================================================
-- Caches Manifold Markets data for reduced API calls and faster access

CREATE TABLE IF NOT EXISTS manifold_market_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Manifold market ID
  market_id TEXT NOT NULL UNIQUE,

  -- Market question/title
  question TEXT NOT NULL,

  -- Market description
  description TEXT,

  -- Current probability (for BINARY markets)
  probability REAL,

  -- Market outcome type
  outcome_type TEXT NOT NULL CHECK (outcome_type IN (
    'BINARY',
    'FREE_RESPONSE',
    'NUMERIC',
    'PSEUDO_NUMERIC',
    'MULTIPLE_CHOICE'
  )),

  -- Market status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution TEXT,
  resolution_time TIMESTAMPTZ,

  -- Market metrics
  volume REAL DEFAULT 0,
  volume_24h REAL DEFAULT 0,
  total_liquidity REAL,
  unique_bettor_count INTEGER DEFAULT 0,

  -- Market URL
  url TEXT,

  -- Market close time
  close_time TIMESTAMPTZ,

  -- Bostrom trilemma analysis
  simulation_analysis JSONB DEFAULT '{}',

  -- Creator info
  creator_username TEXT,
  creator_name TEXT,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Raw API response for debugging
  raw_response JSONB,

  -- Timestamps
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ, -- Market creation time on Manifold
  expires_at TIMESTAMPTZ NOT NULL -- Cache TTL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- 1. HNSW index for simulation_predictions vector search (cosine similarity)
-- HNSW provides better query performance than IVFFlat for semantic search
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_embedding_hnsw
  ON simulation_predictions USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 2. Scenario filtering index
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_scenario
  ON simulation_predictions (scenario);

-- 3. User predictions index
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_user
  ON simulation_predictions (user_id);

-- 4. Fitness score index for ranking
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_fitness
  ON simulation_predictions (fitness_score DESC);

-- 5. Market source index
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_market_source
  ON simulation_predictions (market_source)
  WHERE market_source IS NOT NULL;

-- 6. External market ID lookup
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_external_market
  ON simulation_predictions (external_market_id)
  WHERE external_market_id IS NOT NULL;

-- 7. Timestamps for temporal queries
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_created_at
  ON simulation_predictions (created_at DESC);

-- 8. Composite index for common queries (scenario + fitness)
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_scenario_fitness
  ON simulation_predictions (scenario, fitness_score DESC);

-- 9. TTL index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_simulation_predictions_expires
  ON simulation_predictions (expires_at)
  WHERE expires_at IS NOT NULL;

-- EGGROLL history indexes
CREATE INDEX IF NOT EXISTS idx_eggroll_history_prediction
  ON eggroll_evolution_history (prediction_id);

CREATE INDEX IF NOT EXISTS idx_eggroll_history_generation
  ON eggroll_evolution_history (prediction_id, generation);

CREATE INDEX IF NOT EXISTS idx_eggroll_history_fittest
  ON eggroll_evolution_history (prediction_id)
  WHERE is_fittest = TRUE;

-- Manifold cache indexes
CREATE INDEX IF NOT EXISTS idx_manifold_cache_market_id
  ON manifold_market_cache (market_id);

CREATE INDEX IF NOT EXISTS idx_manifold_cache_expires
  ON manifold_market_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_manifold_cache_probability
  ON manifold_market_cache (probability DESC)
  WHERE outcome_type = 'BINARY';

CREATE INDEX IF NOT EXISTS idx_manifold_cache_tags
  ON manifold_market_cache USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_manifold_cache_simulation
  ON manifold_market_cache USING GIN (simulation_analysis jsonb_path_ops);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE simulation_predictions IS 'Bostrom trilemma predictions with EGGROLL evolution and vector embeddings for semantic search';
COMMENT ON COLUMN simulation_predictions.scenario IS 'Bostrom scenario: extinction (no posthumans), posthuman (few simulations), simulated_reality (we are simulated), or general';
COMMENT ON COLUMN simulation_predictions.fitness_score IS 'EGGROLL integer fitness weight (1-10) from evolution selection';
COMMENT ON COLUMN simulation_predictions.evolution_metadata IS 'EGGROLL metadata: generations, variants, latency, mutation history';
COMMENT ON COLUMN simulation_predictions.embedding IS 'OpenAI text-embedding-3-large vector (1536 dimensions) for semantic search';

COMMENT ON TABLE eggroll_evolution_history IS 'Tracks EGGROLL evolution generations for reproducibility and analysis';
COMMENT ON COLUMN eggroll_evolution_history.mutation_type IS 'EGGROLL mutation operator: weight_adjust, perspective_shift, evidence_refinement, scenario_blend, reranked, fallback, random';

COMMENT ON TABLE manifold_market_cache IS 'Cache for Manifold Markets API data with Bostrom trilemma analysis';
COMMENT ON COLUMN manifold_market_cache.simulation_analysis IS 'Bostrom relevance analysis: bostromRelevance, scenarioType, confidenceScore';

COMMENT ON INDEX idx_simulation_predictions_embedding_hnsw IS 'HNSW index for fast semantic similarity search on prediction embeddings';

-- ============================================================================
-- TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================================================

-- The update_updated_at_column() function already exists from migration 0020
CREATE TRIGGER update_simulation_predictions_updated_at
  BEFORE UPDATE ON simulation_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXAMPLE DATA STRUCTURES
-- ============================================================================
--
-- simulation_predictions.evolution_metadata:
-- {
--   "totalGenerations": 3,
--   "totalVariants": 15,
--   "fitnessScore": 8,
--   "scenario": "simulated_reality",
--   "latencyMs": 2340,
--   "model": "claude-3.5-sonnet"
-- }
--
-- simulation_predictions.sources:
-- [
--   {"type": "manifold", "id": "abc123", "probability": 0.42},
--   {"type": "academic", "doi": "10.1234/simulation.2025"},
--   {"type": "fhi_research", "url": "https://fhi.ox.ac.uk/..."}
-- ]
--
-- manifold_market_cache.simulation_analysis:
-- {
--   "bostromRelevance": 0.85,
--   "scenarioType": "simulated_reality",
--   "confidenceScore": 0.72
-- }
