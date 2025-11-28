-- Migration: 0029_simulation_markets
-- Description: Add simulation markets schema for TCG predictions and Polymarket integration
-- Features:
--   - tcg_outcomes table with pgvector embeddings and HNSW index
--   - polymarket_events table for caching prediction market data
--   - simulation_runs table for tracking simulation execution
--   - market_odds_cache table for unified market odds caching
--
-- References:
--   - KB-09: Advanced Database Architecture (pgvector HNSW)
--   - KB-02: AI RAG Architecture (embeddings)
--   - EGGROLL: Gradient-free evolution for stable predictions

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TCG OUTCOMES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "tcg_outcomes" (
    "id" serial PRIMARY KEY,
    "tcg_card_id" text REFERENCES "cards"("id") ON DELETE SET NULL,
    "simulation_id" text NOT NULL,
    "scenario_type" text NOT NULL CHECK (
        "scenario_type" IN (
            'price_prediction',
            'market_correction',
            'black_swan',
            'trend_continuation',
            'arbitrage_opportunity'
        )
    ),
    "embedding" vector(1536),
    "prediction" real,
    "prediction_text" text,
    "confidence" real NOT NULL DEFAULT 0.5 CHECK ("confidence" >= 0 AND "confidence" <= 1),
    "integer_weight" integer CHECK ("integer_weight" >= 1 AND "integer_weight" <= 10),
    "actual_outcome" real,
    "actual_outcome_text" text,
    "outcome_date" timestamp,
    "calibration_error" real,
    "brier_score" real,
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "expires_at" timestamp
);

-- Standard indexes for tcg_outcomes
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_card" ON "tcg_outcomes" ("tcg_card_id");
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_simulation" ON "tcg_outcomes" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_scenario" ON "tcg_outcomes" ("scenario_type");
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_confidence" ON "tcg_outcomes" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_created" ON "tcg_outcomes" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_expires" ON "tcg_outcomes" ("expires_at");

-- HNSW index for fast cosine similarity search (KB-09 pattern)
-- Parameters:
--   m = 16: Max connections per node (default, good balance)
--   ef_construction = 64: Build-time search width (higher = better quality, slower build)
CREATE INDEX IF NOT EXISTS "idx_tcg_outcomes_hnsw" ON "tcg_outcomes"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- POLYMARKET EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "polymarket_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id" text NOT NULL UNIQUE,
    "condition_id" text,
    "slug" text,
    "title" text NOT NULL,
    "description" text,
    "category" text,
    "outcome_yes" real,
    "outcome_no" real,
    "volume" real,
    "liquidity" real,
    "spread_bps" integer,
    "is_resolved" boolean NOT NULL DEFAULT false,
    "resolved_outcome" text,
    "resolved_at" timestamp,
    "last_fetched_at" timestamp NOT NULL DEFAULT now(),
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "raw_data" jsonb
);

-- Indexes for polymarket_events
CREATE INDEX IF NOT EXISTS "idx_polymarket_event_id" ON "polymarket_events" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_polymarket_category" ON "polymarket_events" ("category");
CREATE INDEX IF NOT EXISTS "idx_polymarket_resolved" ON "polymarket_events" ("is_resolved");
CREATE INDEX IF NOT EXISTS "idx_polymarket_expires" ON "polymarket_events" ("expires_at");

-- ============================================================================
-- SIMULATION RUNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "simulation_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "simulation_id" text NOT NULL UNIQUE,
    "run_type" text NOT NULL CHECK (
        "run_type" IN (
            'tcg_market',
            'polymarket_sync',
            'bostrom_trilemma',
            'eggroll_evolution',
            'hybrid'
        )
    ),
    "status" text NOT NULL DEFAULT 'pending' CHECK (
        "status" IN ('pending', 'running', 'completed', 'failed', 'cancelled')
    ),
    "config" jsonb DEFAULT '{}',
    "predictions_generated" integer DEFAULT 0,
    "avg_confidence" real,
    "avg_calibration_error" real,
    "started_at" timestamp,
    "completed_at" timestamp,
    "duration_ms" integer,
    "error_message" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for simulation_runs
CREATE INDEX IF NOT EXISTS "idx_simulation_runs_user" ON "simulation_runs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_simulation_runs_sim" ON "simulation_runs" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_simulation_runs_status" ON "simulation_runs" ("status");
CREATE INDEX IF NOT EXISTS "idx_simulation_runs_type" ON "simulation_runs" ("run_type");
CREATE INDEX IF NOT EXISTS "idx_simulation_runs_created" ON "simulation_runs" ("created_at");

-- ============================================================================
-- MARKET ODDS CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "market_odds_cache" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "source" text NOT NULL CHECK (
        "source" IN ('polymarket', 'metaculus', 'kalshi', 'predictit', 'manifold')
    ),
    "external_id" text NOT NULL,
    "question" text NOT NULL,
    "category" text,
    "probability" real NOT NULL CHECK ("probability" >= 0 AND "probability" <= 1),
    "volume_usd" real,
    "num_traders" integer,
    "probability_history" jsonb DEFAULT '[]',
    "hit_count" integer DEFAULT 0,
    "last_hit_at" timestamp,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for market_odds_cache
CREATE INDEX IF NOT EXISTS "idx_market_odds_source_external" ON "market_odds_cache" ("source", "external_id");
CREATE INDEX IF NOT EXISTS "idx_market_odds_category" ON "market_odds_cache" ("category");
CREATE INDEX IF NOT EXISTS "idx_market_odds_expires" ON "market_odds_cache" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_market_odds_hits" ON "market_odds_cache" ("hit_count");

-- Unique constraint on source + external_id
CREATE UNIQUE INDEX IF NOT EXISTS "idx_market_odds_unique" ON "market_odds_cache" ("source", "external_id");

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tcg_outcomes_updated_at ON "tcg_outcomes";
CREATE TRIGGER tcg_outcomes_updated_at
    BEFORE UPDATE ON "tcg_outcomes"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS polymarket_events_updated_at ON "polymarket_events";
CREATE TRIGGER polymarket_events_updated_at
    BEFORE UPDATE ON "polymarket_events"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS simulation_runs_updated_at ON "simulation_runs";
CREATE TRIGGER simulation_runs_updated_at
    BEFORE UPDATE ON "simulation_runs"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS market_odds_cache_updated_at ON "market_odds_cache";
CREATE TRIGGER market_odds_cache_updated_at
    BEFORE UPDATE ON "market_odds_cache"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "tcg_outcomes" IS 'TCG simulation predictions with pgvector embeddings for similarity search';
COMMENT ON COLUMN "tcg_outcomes"."embedding" IS 'OpenAI text-embedding-3-large vector (1536 dims) for cosine similarity';
COMMENT ON COLUMN "tcg_outcomes"."integer_weight" IS 'EGGROLL-style integer weight (1-10) for stable predictions';
COMMENT ON COLUMN "tcg_outcomes"."brier_score" IS 'Brier score for probabilistic prediction calibration';

COMMENT ON TABLE "polymarket_events" IS 'Cached Polymarket prediction market events for TCG simulations';
COMMENT ON COLUMN "polymarket_events"."outcome_yes" IS 'Probability of YES outcome (0-1)';
COMMENT ON COLUMN "polymarket_events"."spread_bps" IS 'Bid-ask spread in basis points';

COMMENT ON TABLE "simulation_runs" IS 'Simulation execution history for versioning and A/B testing';
COMMENT ON COLUMN "simulation_runs"."run_type" IS 'Type of simulation: tcg_market, polymarket_sync, bostrom_trilemma, eggroll_evolution, hybrid';

COMMENT ON TABLE "market_odds_cache" IS 'Unified cache for prediction market odds from multiple sources';
COMMENT ON COLUMN "market_odds_cache"."probability_history" IS 'JSON array of historical probability snapshots with timestamps';

COMMENT ON INDEX "idx_tcg_outcomes_hnsw" IS 'HNSW index for fast approximate nearest neighbor search on embeddings';
