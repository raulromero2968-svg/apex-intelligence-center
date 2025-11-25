/**
 * Mobile Performance Module
 *
 * Exports all mobile performance optimization services.
 * Implements knowledge-08-mobile-performance architecture.
 *
 * @see knowledge-08-mobile-performance for domain mapping
 */

// Performance Profiler
export {
  createProfile,
  getProfile,
  getUserProfiles,
  getProjectProfiles,
  updateProfile,
  deleteProfile,
  recordMetrics,
  getSessionMetrics,
  getProfileMetrics,
  getMetricsSummary,
  analyzePerformance,
  generateOptimizedConfig,
  generateFlatListCode,
  DEFAULT_PROFILE,
  PLATFORM_DEFAULTS,
  GRADE_THRESHOLDS,
  type Platform,
  type DeviceTier,
  type PerformanceGrade,
  type ListConfig,
  type ImageConfig,
  type BridgeConfig,
  type PerformanceThresholds,
  type PerformanceAnalysis,
  type PerformanceIssue,
  type Recommendation,
} from './performance-profiler';

// Optimization Engine
export {
  getOptimizationRules,
  createOptimizationRule,
  initializeBuiltInRules,
  analyzeComponent,
  generateOptimizedComponent,
  recordBridgeCall,
  getSessionBridgeAnalytics,
  analyzeBridgeCalls,
  generateBatchingCode,
  BUILT_IN_RULES,
  type OptimizationType,
  type ComponentAnalysis,
  type ComponentIssue,
  type OptimizationSuggestion,
  type BridgeOptimization,
} from './optimization-engine';

// Device Tuner
export {
  getAllDeviceConfigs,
  getDeviceConfig,
  getConfigForDevice,
  createDeviceConfig,
  updateDeviceConfig,
  initializeBuiltInConfigs,
  createOfflineConfig,
  getOfflineConfig,
  updateOfflineConfig,
  detectDeviceTier,
  getTunedSettings,
  generateAppConfig,
  generateOfflineSyncCode,
  BUILT_IN_DEVICE_CONFIGS,
  type DeviceSpecs,
  type RecommendedSettings,
  type HermesConfig,
  type CacheConfig,
  type OfflineDataPolicies,
} from './device-tuner';

// Domain Pack (RAG)
export {
  initializeMobileKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateMobilePerfPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Category,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';
