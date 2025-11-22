/**
 * ML Module - Multi-Modal ML Utilities
 *
 * Provides TypeScript interfaces to Python ML models for:
 * - CLIP image embeddings
 * - Wav2Vec2 audio embeddings
 * - Video generation (placeholder for future integration)
 */

export {
  extractImageEmbedding,
  extractAudioEmbedding,
  batchExtractEmbeddings,
  checkMLDependencies,
} from './embeddings';

export {
  generateVideo,
  checkVideoGenDependencies,
} from './video-generation';
