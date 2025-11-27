/**
 * Visualization Library Exports
 *
 * Quantum-inspired neural network visualizations for TCG market analysis.
 * YouTube content generation with AI-powered scripts and thumbnails.
 */

// Quantum Neural Network Visualizations
export {
  QuantumNetworkViz,
  createQuantumVizFromCards,
  generateQuantumViz,
  generateSpiralViz,
  QUANTUM_VIZ_CONSTANTS,
  QUANTUM_SHADERS,
  quantumNodeSchema,
  vizConfigSchema,
} from './quantum-nn';

export type {
  QuantumNode,
  VizConfig,
  VizRenderResult,
  EntanglementPair,
  SpiralConfig,
  QuantumVizState,
} from './quantum-nn';

// YouTube Content Generation
export {
  generateYouTubeViz,
  generateCardViz,
  generateDailyContent,
  generateThumbnailSVG,
  generateScript,
  fetchTrendingTCGData,
  fetchRAGContext,
} from './youtube-gen';

export type {
  YouTubeVizOutput,
  YouTubeVizConfig,
  ThumbnailData,
  ThumbnailElement,
  ScriptData,
  VizMetadata,
  TCGDataPoint,
} from './youtube-gen';
