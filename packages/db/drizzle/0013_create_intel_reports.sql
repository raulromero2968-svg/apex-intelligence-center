-- Intel Reports with RAG Search Support
-- Implements hybrid search (vector + keyword) for report discoverability
-- Reference: knowledge-02-ai-rag-architecture-v2.md

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE intel_report_tier AS ENUM ('free', 'premium', 'exclusive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intel_report_category AS ENUM (
    'market_analysis',
    'price_prediction',
    'set_review',
    'card_spotlight',
    'grading_guide',
    'investment_strategy',
    'breaking_news',
    'tutorial',
    'opinion',
    'research'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intel_report_status AS ENUM (
    'draft',
    'pending_review',
    'published',
    'rejected',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intel_posting_destination AS ENUM ('commons', 'rc_market', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- INTEL REPORTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS intel_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,

  -- Classification
  category intel_report_category NOT NULL DEFAULT 'market_analysis',
  tier intel_report_tier NOT NULL DEFAULT 'free',
  status intel_report_status NOT NULL DEFAULT 'draft',
  posted_to intel_posting_destination NOT NULL DEFAULT 'commons',

  -- Pricing (for RC Market)
  price INTEGER DEFAULT 0,

  -- TCG-specific metadata
  game TEXT DEFAULT 'pokemon',
  set_code TEXT,
  card_ids JSONB DEFAULT '[]',

  -- Tags for discovery
  tags JSONB DEFAULT '[]',

  -- RAG Embedding - OpenAI text-embedding-ada-002 (1536 dimensions)
  embedding vector(1536),

  -- Engagement metrics
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,

  -- Quality signals
  quality_score DECIMAL(5, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,

  -- AI metadata
  ai_metadata JSONB,

  -- Moderation
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Lifecycle timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INTEL REPORT PURCHASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS intel_report_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL REFERENCES intel_reports(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction details
  price_paid INTEGER NOT NULL,
  transaction_id UUID,

  -- Access tracking
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one purchase per buyer per report
  UNIQUE(report_id, buyer_id)
);

-- =============================================================================
-- REPORT-CARDS JUNCTION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL REFERENCES intel_reports(id) ON DELETE CASCADE,

  -- Card reference
  card_id TEXT NOT NULL,
  card_name TEXT,
  game TEXT NOT NULL DEFAULT 'pokemon',

  -- Price context at time of report
  price_at_report DECIMAL(10, 2),
  price_source TEXT,

  -- Relevance metadata
  is_primary BOOLEAN DEFAULT false,
  mention_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per report-card pair
  UNIQUE(report_id, card_id)
);

-- =============================================================================
-- INTEL REPORT LIKES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS intel_report_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL REFERENCES intel_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One like per user per report
  UNIQUE(report_id, user_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Intel Reports Indexes
CREATE INDEX IF NOT EXISTS intel_reports_user_idx ON intel_reports(user_id);
CREATE INDEX IF NOT EXISTS intel_reports_published_destination_idx ON intel_reports(status, posted_to, published_at DESC);
CREATE INDEX IF NOT EXISTS intel_reports_category_idx ON intel_reports(category);
CREATE INDEX IF NOT EXISTS intel_reports_game_idx ON intel_reports(game);
CREATE INDEX IF NOT EXISTS intel_reports_tier_idx ON intel_reports(tier);
CREATE INDEX IF NOT EXISTS intel_reports_slug_idx ON intel_reports(slug);
CREATE INDEX IF NOT EXISTS intel_reports_quality_idx ON intel_reports(quality_score DESC);

-- HNSW index on embedding for vector similarity search (cosine distance)
-- Using vector_cosine_ops for cosine similarity
CREATE INDEX IF NOT EXISTS intel_reports_embedding_hnsw_idx
ON intel_reports
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search on content
CREATE INDEX IF NOT EXISTS intel_reports_content_fts_idx
ON intel_reports
USING gin (to_tsvector('english', content));

-- GIN index for full-text search on title + summary combined
CREATE INDEX IF NOT EXISTS intel_reports_title_summary_fts_idx
ON intel_reports
USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')));

-- GIN index for tags JSONB array
CREATE INDEX IF NOT EXISTS intel_reports_tags_idx
ON intel_reports
USING gin (tags);

-- Intel Report Purchases Indexes
CREATE INDEX IF NOT EXISTS intel_report_purchases_report_idx ON intel_report_purchases(report_id);
CREATE INDEX IF NOT EXISTS intel_report_purchases_buyer_idx ON intel_report_purchases(buyer_id);

-- Report Cards Indexes
CREATE INDEX IF NOT EXISTS report_cards_report_idx ON report_cards(report_id);
CREATE INDEX IF NOT EXISTS report_cards_card_idx ON report_cards(card_id);
CREATE INDEX IF NOT EXISTS report_cards_game_card_idx ON report_cards(game, card_id);

-- Intel Report Likes Indexes
CREATE INDEX IF NOT EXISTS intel_report_likes_report_idx ON intel_report_likes(report_id);
CREATE INDEX IF NOT EXISTS intel_report_likes_user_idx ON intel_report_likes(user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intel_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS intel_reports_updated_at_trigger ON intel_reports;
CREATE TRIGGER intel_reports_updated_at_trigger
  BEFORE UPDATE ON intel_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_intel_reports_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE intel_reports IS 'User-generated market intelligence with RAG search support';
COMMENT ON COLUMN intel_reports.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions) for semantic search';
COMMENT ON INDEX intel_reports_embedding_hnsw_idx IS 'HNSW index for approximate nearest-neighbor search using cosine similarity';
COMMENT ON INDEX intel_reports_content_fts_idx IS 'GIN index for PostgreSQL full-text search on report content';
