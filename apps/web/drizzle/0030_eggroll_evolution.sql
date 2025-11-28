-- Migration: 0030_eggroll_evolution
-- Description: EGGROLL RAG-Fusion evolution schema for integer-weight predictions
-- Features:
--   - eggroll_variants table for evolved prediction variants with pgvector HNSW
--   - eggroll_generations table for tracking evolution history
--   - post_agency_configs table for corrigibility and value adaptation settings
--   - bostrom_predictions table for trilemma-specific predictions with SVD metadata
--
-- References:
--   - KB-02: EGGROLL RAG-Fusion architecture
--   - KB-09: pgvector HNSW indexing (cosine similarity)
--   - Thornley/POST-Agency: Corrigible value adaptation
--   - Deep Utopia: Abundance-focused posthuman framing

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- EGGROLL VARIANTS TABLE
-- Core storage for evolved prediction variants with integer weights
-- ============================================================================

CREATE TABLE IF NOT EXISTS "eggroll_variants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "simulation_id" text NOT NULL,
    "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,

    -- Variant content and evolution metadata
    "variant_text" text NOT NULL,
    "integer_weight" integer NOT NULL CHECK ("integer_weight" >= 1 AND "integer_weight" <= 10),
    "generation" integer NOT NULL DEFAULT 0,
    "parent_variant_id" uuid REFERENCES "eggroll_variants"("id") ON DELETE SET NULL,

    -- Mutation tracking
    "mutation_type" text CHECK (
        "mutation_type" IN (
            'weight_adjust',
            'perspective_shift',
            'evidence_refinement',
            'scenario_blend',
            'random',
            'fallback',
            'reranked',
            'svd_selected',
            'utility_capped',
            'reward_capped',
            'utopia_boosted'
        )
    ),
    "mutation_history" jsonb DEFAULT '[]',

    -- Fitness and scoring
    "fitness_score" real CHECK ("fitness_score" >= 0 AND "fitness_score" <= 10),
    "accuracy_score" real CHECK ("accuracy_score" >= 0 AND "accuracy_score" <= 10),
    "stability_score" real CHECK ("stability_score" >= 0 AND "stability_score" <= 10),
    "coherence_score" real CHECK ("coherence_score" >= 0 AND "coherence_score" <= 10),
    "rerank_score" real,

    -- Embedding for similarity search (text-embedding-3-large: 1536 dims)
    "embedding" vector(1536),

    -- Bostrom scenario metadata
    "bostrom_scenario" text CHECK (
        "bostrom_scenario" IN ('extinction', 'posthuman', 'simulated_reality')
    ),

    -- SVD approximation metadata
    "svd_rank" integer,
    "svd_efficiency_gain" real,
    "svd_singular_values" jsonb,

    -- POST-Agency corrigibility metadata
    "corrigibility_score" real CHECK ("corrigibility_score" >= 0 AND "corrigibility_score" <= 1),
    "post_agency_applied" boolean DEFAULT false,
    "utility_indifference_applied" boolean DEFAULT false,
    "recursive_reward_capped" boolean DEFAULT false,
    "deep_utopia_framed" boolean DEFAULT false,

    -- Timestamps
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Standard indexes for eggroll_variants
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_simulation" ON "eggroll_variants" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_user" ON "eggroll_variants" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_generation" ON "eggroll_variants" ("generation");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_weight" ON "eggroll_variants" ("integer_weight");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_scenario" ON "eggroll_variants" ("bostrom_scenario");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_corrigibility" ON "eggroll_variants" ("corrigibility_score");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_fitness" ON "eggroll_variants" ("fitness_score");
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_created" ON "eggroll_variants" ("created_at");

-- HNSW index for fast cosine similarity search (KB-09 pattern)
-- Used for finding similar prediction variants and value shift detection
CREATE INDEX IF NOT EXISTS "idx_eggroll_variants_hnsw" ON "eggroll_variants"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- EGGROLL GENERATIONS TABLE
-- Tracks evolution history for A/B testing and model improvement
-- ============================================================================

CREATE TABLE IF NOT EXISTS "eggroll_generations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "simulation_id" text NOT NULL,
    "generation_number" integer NOT NULL,

    -- Population statistics
    "population_size" integer NOT NULL,
    "top_k_selected" integer NOT NULL,
    "avg_fitness" real,
    "max_fitness" real,
    "min_fitness" real,
    "fitness_std_dev" real,

    -- Evolution parameters
    "mutation_rate" real,
    "temperature" real,
    "lambda_mmr" real, -- MMR diversity parameter

    -- SVD efficiency tracking
    "svd_enabled" boolean DEFAULT false,
    "svd_rank" integer,
    "svd_efficiency_gain" real,

    -- POST-Agency tracking
    "post_agency_enabled" boolean DEFAULT false,
    "avg_corrigibility" real,
    "utility_indifference_rate" real,
    "reward_cap_rate" real,

    -- Performance metrics
    "latency_ms" integer,
    "tokens_consumed" integer,
    "tokens_saved" integer,

    -- Timestamps
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for eggroll_generations
CREATE INDEX IF NOT EXISTS "idx_eggroll_generations_simulation" ON "eggroll_generations" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_eggroll_generations_gen" ON "eggroll_generations" ("generation_number");
CREATE INDEX IF NOT EXISTS "idx_eggroll_generations_fitness" ON "eggroll_generations" ("avg_fitness");

-- ============================================================================
-- POST-AGENCY CONFIGS TABLE
-- Stores corrigibility and value adaptation settings per simulation
-- ============================================================================

CREATE TABLE IF NOT EXISTS "post_agency_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "simulation_id" text NOT NULL UNIQUE,
    "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,

    -- Core POST-Agency settings (per Thornley)
    "enabled" boolean NOT NULL DEFAULT true,
    "max_update_depth" integer NOT NULL DEFAULT 3,
    "utility_indifference" boolean NOT NULL DEFAULT true,
    "recursive_reward_cap" real NOT NULL DEFAULT 0.9 CHECK (
        "recursive_reward_cap" >= 0 AND "recursive_reward_cap" <= 1
    ),
    "corrigibility_threshold" real NOT NULL DEFAULT 0.7 CHECK (
        "corrigibility_threshold" >= 0 AND "corrigibility_threshold" <= 1
    ),

    -- Deep utopia framing
    "deep_utopia_framing" boolean NOT NULL DEFAULT true,
    "abundance_focus" boolean DEFAULT true,
    "dignity_preserving" boolean DEFAULT true,

    -- Value loading settings (superintelligence strategies)
    "value_loading_enabled" boolean DEFAULT false,
    "value_loading_method" text CHECK (
        "value_loading_method" IN ('direct', 'inverse_rl', 'debate', 'amplification')
    ),

    -- Ethical disclaimers
    "ethics_disclaimers_enabled" boolean NOT NULL DEFAULT true,
    "custom_disclaimer" text,

    -- FHI alignment
    "fhi_alignment_mode" text DEFAULT 'standard' CHECK (
        "fhi_alignment_mode" IN ('standard', 'longtermist', 'existential_risk', 'flourishing')
    ),
    "bostrom_prob_cap" real DEFAULT 0.9 CHECK (
        "bostrom_prob_cap" >= 0 AND "bostrom_prob_cap" <= 1
    ),

    -- Timestamps
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for post_agency_configs
CREATE INDEX IF NOT EXISTS "idx_post_agency_simulation" ON "post_agency_configs" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_post_agency_user" ON "post_agency_configs" ("user_id");

-- ============================================================================
-- BOSTROM PREDICTIONS TABLE
-- Specialized table for trilemma predictions with probability distributions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "bostrom_predictions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "simulation_id" text NOT NULL,
    "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "eggroll_variant_id" uuid REFERENCES "eggroll_variants"("id") ON DELETE SET NULL,

    -- Query and context
    "query" text NOT NULL,
    "context_hash" text, -- Hash of RAG context for deduplication

    -- Trilemma probability distribution
    "prob_extinction" real NOT NULL CHECK ("prob_extinction" >= 0 AND "prob_extinction" <= 1),
    "prob_posthuman" real NOT NULL CHECK ("prob_posthuman" >= 0 AND "prob_posthuman" <= 1),
    "prob_simulated" real NOT NULL CHECK ("prob_simulated" >= 0 AND "prob_simulated" <= 1),

    -- Derived scenario (highest probability)
    "primary_scenario" text NOT NULL CHECK (
        "primary_scenario" IN ('extinction', 'posthuman', 'simulated_reality')
    ),

    -- Confidence and calibration
    "confidence" real NOT NULL CHECK ("confidence" >= 0 AND "confidence" <= 1),
    "integer_weight" integer CHECK ("integer_weight" >= 1 AND "integer_weight" <= 10),
    "calibration_bucket" text, -- For Brier score tracking

    -- Embedding for outcome similarity search
    "embedding" vector(1536),

    -- SVD approximation metadata
    "svd_applied" boolean DEFAULT false,
    "svd_efficiency_gain" real,

    -- Corrigibility flags
    "corrigibility_checked" boolean DEFAULT false,
    "corrigibility_score" real,
    "probability_capped" boolean DEFAULT false,
    "original_prob_simulated" real, -- Pre-cap value if capped

    -- Ethical metadata
    "ethical_disclaimer" text,
    "deep_utopia_framed" boolean DEFAULT false,
    "glitch_hypothesis_warning" boolean DEFAULT false,

    -- Market integration (Polymarket/Manifold/Kalshi)
    "market_source" text CHECK (
        "market_source" IN ('polymarket', 'manifold', 'kalshi', 'apex_internal')
    ),
    "external_market_id" text,
    "market_probability" real,

    -- Timestamps
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "expires_at" timestamp
);

-- Standard indexes for bostrom_predictions
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_simulation" ON "bostrom_predictions" ("simulation_id");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_user" ON "bostrom_predictions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_scenario" ON "bostrom_predictions" ("primary_scenario");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_confidence" ON "bostrom_predictions" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_weight" ON "bostrom_predictions" ("integer_weight");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_created" ON "bostrom_predictions" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_market" ON "bostrom_predictions" ("market_source", "external_market_id");

-- HNSW index for cosine similarity on outcome embeddings
-- Used for finding similar value shifts (e.g., "simulated reality" transitions)
CREATE INDEX IF NOT EXISTS "idx_bostrom_predictions_hnsw" ON "bostrom_predictions"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Constraint: probabilities must sum to ~1 (with tolerance for floating point)
ALTER TABLE "bostrom_predictions" ADD CONSTRAINT "bostrom_prob_sum_check"
    CHECK (
        ("prob_extinction" + "prob_posthuman" + "prob_simulated") BETWEEN 0.99 AND 1.01
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Trigger for updated_at on eggroll_variants
DROP TRIGGER IF EXISTS eggroll_variants_updated_at ON "eggroll_variants";
CREATE TRIGGER eggroll_variants_updated_at
    BEFORE UPDATE ON "eggroll_variants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on post_agency_configs
DROP TRIGGER IF EXISTS post_agency_configs_updated_at ON "post_agency_configs";
CREATE TRIGGER post_agency_configs_updated_at
    BEFORE UPDATE ON "post_agency_configs"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on bostrom_predictions
DROP TRIGGER IF EXISTS bostrom_predictions_updated_at ON "bostrom_predictions";
CREATE TRIGGER bostrom_predictions_updated_at
    BEFORE UPDATE ON "bostrom_predictions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEW: EGGROLL PERFORMANCE METRICS
-- Aggregates evolution performance for monitoring
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS "eggroll_performance_metrics" AS
SELECT
    DATE_TRUNC('day', eg.created_at) AS day,
    eg.simulation_id,
    COUNT(DISTINCT ev.id) AS total_variants,
    AVG(ev.integer_weight) AS avg_weight,
    AVG(ev.fitness_score) AS avg_fitness,
    AVG(ev.corrigibility_score) AS avg_corrigibility,
    SUM(CASE WHEN ev.svd_efficiency_gain > 0 THEN 1 ELSE 0 END) AS svd_optimized_count,
    AVG(ev.svd_efficiency_gain) FILTER (WHERE ev.svd_efficiency_gain > 0) AS avg_svd_efficiency,
    SUM(CASE WHEN ev.deep_utopia_framed THEN 1 ELSE 0 END) AS utopia_framed_count,
    AVG(eg.latency_ms) AS avg_latency_ms,
    SUM(eg.tokens_saved) AS total_tokens_saved
FROM "eggroll_generations" eg
LEFT JOIN "eggroll_variants" ev ON eg.simulation_id = ev.simulation_id
    AND eg.generation_number = ev.generation
GROUP BY DATE_TRUNC('day', eg.created_at), eg.simulation_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS "idx_eggroll_metrics_day_sim"
    ON "eggroll_performance_metrics" (day, simulation_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "eggroll_variants" IS 'EGGROLL-evolved prediction variants with integer weights and pgvector embeddings';
COMMENT ON COLUMN "eggroll_variants"."integer_weight" IS 'Integer fitness weight (1-10) from EGGROLL evolution';
COMMENT ON COLUMN "eggroll_variants"."svd_efficiency_gain" IS 'Compute savings from SVD low-rank approximation (target 20%)';
COMMENT ON COLUMN "eggroll_variants"."corrigibility_score" IS 'POST-Agency corrigibility check score (0-1)';
COMMENT ON COLUMN "eggroll_variants"."deep_utopia_framed" IS 'Whether variant uses deep utopia abundance framing';
COMMENT ON INDEX "idx_eggroll_variants_hnsw" IS 'HNSW index for cosine similarity search on variant embeddings';

COMMENT ON TABLE "eggroll_generations" IS 'Evolution generation history for tracking EGGROLL performance';
COMMENT ON COLUMN "eggroll_generations"."svd_efficiency_gain" IS 'Aggregate efficiency gain from SVD approximations';
COMMENT ON COLUMN "eggroll_generations"."utility_indifference_rate" IS 'Rate of variants with utility indifference applied';

COMMENT ON TABLE "post_agency_configs" IS 'POST-Agency corrigibility and value adaptation settings per simulation';
COMMENT ON COLUMN "post_agency_configs"."recursive_reward_cap" IS 'Cap on recursive rewards to prevent value drift (per Thornley)';
COMMENT ON COLUMN "post_agency_configs"."bostrom_prob_cap" IS 'Cap on simulation probability to prevent overconfidence (FHI alignment)';

COMMENT ON TABLE "bostrom_predictions" IS 'Bostrom trilemma predictions with probability distributions';
COMMENT ON COLUMN "bostrom_predictions"."prob_extinction" IS 'Probability of extinction scenario (0-1)';
COMMENT ON COLUMN "bostrom_predictions"."prob_posthuman" IS 'Probability of posthuman scenario (0-1)';
COMMENT ON COLUMN "bostrom_predictions"."prob_simulated" IS 'Probability of simulated reality scenario (0-1)';
COMMENT ON COLUMN "bostrom_predictions"."probability_capped" IS 'Whether simulation probability was capped per FHI corrigibility';
COMMENT ON INDEX "idx_bostrom_predictions_hnsw" IS 'HNSW index for finding similar value shift outcomes';

COMMENT ON MATERIALIZED VIEW "eggroll_performance_metrics" IS 'Aggregated EGGROLL evolution performance metrics for monitoring';
