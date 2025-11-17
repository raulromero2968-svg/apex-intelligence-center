-- Migration: Add collections sharing fields
-- This migration adds necessary fields for collections caching and sharing functionality

-- Add slug column (unique identifier for URL-friendly collection access)
ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add visibility and access control fields
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false NOT NULL;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_unlisted boolean DEFAULT false NOT NULL;

-- Add collection type field (default, search, custom, etc.)
ALTER TABLE collections ADD COLUMN IF NOT EXISTS type text DEFAULT 'default' NOT NULL;

-- Add search parameters for dynamic collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS search_params jsonb;

-- Create index for efficient public collection queries
-- This supports the listPublicCollections query with optimal performance
CREATE INDEX IF NOT EXISTS idx_collections_public_updated
  ON collections (is_public DESC, updated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN collections.slug IS 'URL-friendly unique identifier for collection';
COMMENT ON COLUMN collections.is_public IS 'Whether collection appears in public listings';
COMMENT ON COLUMN collections.is_unlisted IS 'Whether collection is hidden from search engines (noindex)';
COMMENT ON COLUMN collections.type IS 'Collection type: default, search, custom';
COMMENT ON COLUMN collections.search_params IS 'Saved search parameters for dynamic collections';
COMMENT ON INDEX idx_collections_public_updated IS 'Optimizes public collection listing queries';
