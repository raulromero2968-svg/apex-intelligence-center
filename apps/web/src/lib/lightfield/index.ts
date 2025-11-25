/**
 * Light Field Display Module
 *
 * Exports all light field display services for holographic visualization.
 * Implements pack-lfd-001 architecture.
 *
 * @see pack-lfd-001 for domain mapping
 */

// Quilt Generation
export {
  generateQuiltConfig,
  generateQuilt,
  getQuiltAsset,
  getUserQuiltAssets,
  updateQuiltAsset,
  deleteQuiltAsset,
  calculateQuiltDimensions,
  generateQuiltPreview,
  type QuiltConfig,
  type QuiltGenerationRequest,
  type QuiltGenerationResult,
} from './quilt-generator';

// Display Calibration
export {
  getOrCreateDefaultProfile,
  createDisplayProfile,
  getDisplayProfile,
  getUserDisplayProfiles,
  updateDisplayProfile,
  updateCalibration,
  calculateViewingZone,
  adjustForViewerPosition,
  calculateSubpixelOffset,
  getOptimalQuality,
  estimateGpuMemoryMB,
  detectDisplayFromUserAgent,
  inferDisplayFromResolution,
  DEFAULT_HARDWARE_SPECS,
  DEFAULT_RENDER_PARAMS,
  DEFAULT_QUALITY_PRESETS,
  type DisplayModel,
  type HardwareSpecs,
  type RenderParams,
  type QualityPreset,
  type CalibrationData,
} from './display-calibration';

// Domain Pack (RAG)
export {
  initializeLightFieldKnowledge,
  searchKnowledge,
  getKnowledgeByDomain,
  getKnowledgeByType,
  getTroubleshootingGuides,
  getHardwareKnowledge,
  getPromptTemplate,
  fillPromptTemplate,
  generateLightFieldPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Domain,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';
