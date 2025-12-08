-- Blog Schema Migration
-- Perplexity-style blog with topic clusters, citations, and LLMO support
-- Reference: Cycle Summary Protocol - Great Reset Execution

-- =============================================================================
-- CLUSTERS TABLE (Topic Cluster / SEO Pillar)
-- =============================================================================

CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core content
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug lookup for URL routing
CREATE INDEX IF NOT EXISTS clusters_slug_idx ON clusters(slug);

-- Table comment
COMMENT ON TABLE clusters IS 'Topic clusters represent SEO pillars that group related blog content (e.g., "TCG Investing 101")';

-- =============================================================================
-- POSTS TABLE (Blog Content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cluster relationship
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- Core content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT,

  -- Subscription gating
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,

  -- LLMO/AI Search Optimization
  meta_schema JSONB,

  -- Lifecycle timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cluster lookup for topic grouping
CREATE INDEX IF NOT EXISTS posts_cluster_idx ON posts(cluster_id);

-- Slug lookup for URL routing
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);

-- Published posts query (for feed)
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published_at);

-- Premium content filtering
CREATE INDEX IF NOT EXISTS posts_premium_idx ON posts(is_premium);

-- Table comment
COMMENT ON TABLE posts IS 'Blog posts with Markdown/MDX content, JSON-LD structured data for AI search, and premium content gating';

-- Column comments
COMMENT ON COLUMN posts.meta_schema IS 'JSON-LD structured data for LLMO optimization - enables AI search discovery';
COMMENT ON COLUMN posts.is_premium IS 'Pro subscription gate - requires active subscription to view full content';
COMMENT ON COLUMN posts.summary IS 'AI-generated summary for previews and search results';

-- =============================================================================
-- CITATIONS TABLE (Perplexity-Style Sourcing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Post relationship
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Source information
  source_name TEXT NOT NULL,
  source_url TEXT,

  -- Quality metrics
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 100),
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,

  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post lookup for fetching all citations
CREATE INDEX IF NOT EXISTS citations_post_idx ON citations(post_id);

-- Relevance sorting
CREATE INDEX IF NOT EXISTS citations_relevance_idx ON citations(relevance_score);

-- Table comment
COMMENT ON TABLE citations IS 'Perplexity-style source references with relevance scoring and verification status';

-- Column comments
COMMENT ON COLUMN citations.relevance_score IS 'Internal quality metric (1-100) for source relevance to post content';
COMMENT ON COLUMN citations.is_verified IS 'Editorial verification status - indicates source has been reviewed';

-- =============================================================================
-- HELPER FUNCTION: Update timestamp trigger
-- =============================================================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for posts table
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
