/**
 * WebXR Module
 *
 * Exports all WebXR services for cross-platform XR development.
 * Implements pack-webxr-001 architecture.
 *
 * @see pack-webxr-001 for domain mapping
 */

// Session Manager
export {
  createSession,
  getSession,
  updateSessionStatus,
  endSession,
  getRecentSessions,
  getActiveSessionsCount,
  logAnalyticEvent,
  getSessionAnalytics,
  getSceneAnalyticsSummary,
  getWebXRSupportInfo,
  getRecommendedConfig,
  detectDeviceType,
  getAvailableModes,
  generateModeSwitchCode,
  DEFAULT_SESSION_CONFIG,
  SESSION_FEATURES,
  REFERENCE_SPACE_INFO,
  type SessionType,
  type ReferenceSpace,
  type SessionStatus,
  type SessionConfig,
  type SessionCapabilities,
  type SessionMetrics,
  type DeviceInfo,
} from './session-manager';

// Scene Builder
export {
  createScene,
  createSceneFromTemplate,
  getScene,
  getSceneWithObjects,
  getUserScenes,
  updateScene,
  deleteScene,
  incrementSceneViews,
  createSceneObject,
  getSceneObject,
  updateSceneObject,
  updateObjectTransform,
  deleteSceneObject,
  reorderSceneObjects,
  createAsset,
  getAsset,
  getUserAssets,
  getPublicAssets,
  updateAsset,
  incrementAssetUsage,
  createInteraction,
  getSceneInteractions,
  getObjectInteractions,
  updateInteraction,
  deleteInteraction,
  generateThreeJsSceneCode,
  DEFAULT_SCENE_SETTINGS,
  DEFAULT_LIGHTING,
  SCENE_TEMPLATES,
  type SceneType,
  type EngineType,
  type ObjectType,
  type Transform,
  type SceneSettings,
  type LightConfig,
} from './scene-builder';

// Device Profiler
export {
  getDeviceProfile,
  getAllDeviceProfiles,
  createDeviceProfile,
  updateDeviceProfile,
  getOptimalSettings,
  getPerformanceBudget,
  analyzeScenePerformance,
  getCompatibilityMatrix,
  BUILT_IN_PROFILES,
  type DeviceType,
  type GpuTier,
  type QualitySetting,
  type AntialiasingSetting,
  type PerformanceSpec,
  type RecommendedSettings,
  type DisplayConfig,
  type InputCapabilities,
} from './device-profiler';

// Domain Pack (RAG)
export {
  initializeWebxrKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateWebxrPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Category,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';
