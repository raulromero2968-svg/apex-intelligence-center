/**
 * YouTube Visualization Generator Re-exports
 *
 * Re-exports the youtube-gen module from the root lib directory
 * for use within the apps/web Next.js application.
 *
 * @module lib/viz/youtube-gen
 */

export {
  generateYouTubeViz,
  generateCardViz,
  generateDailyContent,
  generateThumbnailSVG,
  generateScript,
  fetchTrendingTCGData,
  fetchRAGContext,
} from '../../../../../lib/viz/youtube-gen';

export type {
  YouTubeVizOutput,
  ThumbnailData,
  ThumbnailElement,
  ScriptData,
  VizMetadata,
  YouTubeVizConfig,
  TCGDataPoint,
} from '../../../../../lib/viz/youtube-gen';
