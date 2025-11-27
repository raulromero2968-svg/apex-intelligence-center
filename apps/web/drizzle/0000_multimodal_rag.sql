-- Migration: Multi-Modal RAG Tables
-- Generated: 2025-11-22
-- Description: Add multi_modal_embeddings and video_generation_requests tables for AI video generation

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Multi-Modal Embeddings Table
CREATE TABLE IF NOT EXISTS "multi_modal_embeddings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL CHECK ("type" IN ('image', 'audio')),
  "embedding" vector(768) NOT NULL,
  "file_url" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "multi_modal_embeddings_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

-- Video Generation Requests Table
CREATE TABLE IF NOT EXISTS "video_generation_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "script" text NOT NULL,
  "setting" text NOT NULL,
  "duration" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
  "output_url" text,
  "processing_started_at" timestamp,
  "processing_completed_at" timestamp,
  "error_message" text,
  "retrieval_metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "video_generation_requests_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

-- Indexes for multi_modal_embeddings
CREATE INDEX IF NOT EXISTS "idx_multimodal_user" ON "multi_modal_embeddings" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_multimodal_type" ON "multi_modal_embeddings" ("type");
CREATE INDEX IF NOT EXISTS "idx_multimodal_user_type" ON "multi_modal_embeddings" ("user_id", "type");
CREATE INDEX IF NOT EXISTS "idx_multimodal_created_at" ON "multi_modal_embeddings" ("created_at");

-- HNSW index for vector similarity search
-- Using cosine distance (most common for embeddings)
CREATE INDEX IF NOT EXISTS "idx_multimodal_embedding_hnsw"
  ON "multi_modal_embeddings"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Indexes for video_generation_requests
CREATE INDEX IF NOT EXISTS "idx_video_gen_user" ON "video_generation_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_video_gen_status" ON "video_generation_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_video_gen_created_at" ON "video_generation_requests" ("created_at");

-- Comments for documentation
COMMENT ON TABLE "multi_modal_embeddings" IS 'Stores multi-modal embeddings for images (CLIP) and audio (Wav2Vec2) to enable RAG-based retrieval for personalized video generation';
COMMENT ON TABLE "video_generation_requests" IS 'Tracks video generation requests with status, output files, and RAG retrieval metadata';

COMMENT ON COLUMN "multi_modal_embeddings"."embedding" IS 'Vector embedding (768-dim): CLIP ViT-B/32 for images (padded from 512), Wav2Vec2 for audio';
COMMENT ON COLUMN "multi_modal_embeddings"."file_url" IS 'S3/R2 URL or local path to the original file';
COMMENT ON COLUMN "multi_modal_embeddings"."metadata" IS 'Additional metadata: filename, fileSize, mimeType, faceLandmarks, emotionScores, voiceCharacteristics';

COMMENT ON COLUMN "video_generation_requests"."retrieval_metadata" IS 'RAG retrieval metadata: which embeddings were used, similarity scores, etc.';
