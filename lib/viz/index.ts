/**
 * Visualization Module Barrel Export
 *
 * Exports all AI visualization functionality including:
 * - YouTube content generation (thumbnails + scripts)
 * - TCG data visualization
 * - Daily automation support
 *
 * @module viz
 */

// YouTube Content Generation
export {
  generateYouTubeViz,
  generateCardViz,
  generateDailyContent,
  generateThumbnailSVG,
  generateScript,
  fetchTrendingTCGData,
  fetchRAGContext,
  type YouTubeVizOutput,
  type ThumbnailData,
  type ThumbnailElement,
  type ScriptData,
  type VizMetadata,
  type YouTubeVizConfig,
  type TCGDataPoint,
} from './youtube-gen';
