-- Migration: TCG RAG System - Vector Search & Provenance
-- This migration creates the foundation for the Apex Intelligence RAG engine
-- with full attribution tracking to solve the "attribution collapse" problem

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tcg_documents table for RAG system
-- This table stores all TCG-related content with embeddings and provenance metadata
CREATE TABLE IF NOT EXISTS tcg_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- e.g., 'ebay_listing', 'psa_pop_report', 'reddit_comment', 'news_article'
  content TEXT NOT NULL, -- The raw text content (listing description, article body, etc.)
  metadata JSONB NOT NULL DEFAULT '{}', -- Source-specific metadata (see examples below)
  embedding vector(1536), -- For OpenAI text-embedding-3-large or text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Example Metadata Structures by Source Type:
--
-- ebay_listing: {
--   "card_name": "Charizard",
--   "set": "Base Set",
--   "grade": "PSA 10",
--   "sale_price": 15000.00,
--   "sale_date": "2025-10-28",
--   "auction_id": "123456789",
--   "seller": "pokemonmaster",
--   "source_url": "https://ebay.com/itm/123456789",
--   "unique_id": "ebay_123456789"
-- }
--
-- psa_pop_report: {
--   "card_name": "Charizard",
--   "set": "Base Set",
--   "set_number": "4",
--   "grade": "PSA 10",
--   "population": 54,
--   "report_date": "2025-11-01",
--   "source_url": "https://psacard.com/pop/...",
--   "unique_id": "psa_charizard_base_10_20251101"
-- }
--
-- news_article: {
--   "title": "Charizard Prices Hit Record High",
--   "author": "John Doe",
--   "publication": "TCGPlayer Infinite",
--   "publish_date": "2025-11-15",
--   "source_url": "https://infinite.tcgplayer.com/article/...",
--   "unique_id": "tcgplayer_article_12345"
-- }

-- Indexes for Hybrid Search Performance

-- 1. Vector similarity search using IVFFlat index
-- This enables fast approximate nearest neighbor search for semantic queries
CREATE INDEX IF NOT EXISTS idx_tcg_documents_embedding
  ON tcg_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 2. Metadata filtering using GIN index
-- This enables fast filtering by card name, grade, set, etc.
CREATE INDEX IF NOT EXISTS idx_tcg_documents_metadata
  ON tcg_documents USING GIN (metadata jsonb_path_ops);

-- 3. Full-text search for keyword matching (BM25-style)
-- This enables exact keyword matching on content
CREATE INDEX IF NOT EXISTS idx_tcg_documents_content_fts
  ON tcg_documents USING GIN (to_tsvector('english', content));

-- 4. Source type index for filtering by data source
CREATE INDEX IF NOT EXISTS idx_tcg_documents_source_type
  ON tcg_documents (source_type);

-- 5. Timestamp index for temporal queries
CREATE INDEX IF NOT EXISTS idx_tcg_documents_created_at
  ON tcg_documents (created_at DESC);

-- 6. Unique constraint on metadata unique_id to prevent duplicates
-- This enables idempotent ingestion
CREATE UNIQUE INDEX IF NOT EXISTS idx_tcg_documents_unique_id
  ON tcg_documents ((metadata->>'unique_id'));

-- Add comments for documentation
COMMENT ON TABLE tcg_documents IS 'TCG market intelligence documents with vector embeddings for RAG system';
COMMENT ON COLUMN tcg_documents.source_type IS 'Type of data source: ebay_listing, psa_pop_report, reddit_comment, news_article, etc.';
COMMENT ON COLUMN tcg_documents.content IS 'Raw text content for search and analysis';
COMMENT ON COLUMN tcg_documents.metadata IS 'Source-specific metadata including unique_id for idempotent ingestion';
COMMENT ON COLUMN tcg_documents.embedding IS 'OpenAI text-embedding-3-large vector (1536 dimensions)';
COMMENT ON INDEX idx_tcg_documents_embedding IS 'IVFFlat index for fast semantic similarity search';
COMMENT ON INDEX idx_tcg_documents_metadata IS 'GIN index for fast metadata filtering';
COMMENT ON INDEX idx_tcg_documents_content_fts IS 'Full-text search index for keyword matching';
COMMENT ON INDEX idx_tcg_documents_unique_id IS 'Ensures idempotent ingestion via metadata.unique_id';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_tcg_documents_updated_at
  BEFORE UPDATE ON tcg_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
