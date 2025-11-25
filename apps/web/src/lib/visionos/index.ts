/**
 * visionOS Spatial Computing Module
 *
 * Exports all visionOS services for spatial app development.
 * Implements pack-visionos-001 architecture.
 *
 * @see pack-visionos-001 for domain mapping
 */

// Gesture Fusion
export {
  createGestureState,
  updateGazeState,
  updateHandState,
  detectGestures,
  interpretGestureIntent,
  createGestureBinding,
  getSceneBindings,
  getGlobalBindings,
  updateGestureBinding,
  deleteGestureBinding,
  initializeTCGBindings,
  DEFAULT_THRESHOLDS,
  TCG_DEFAULT_BINDINGS,
  type GestureType,
  type ActionType,
  type GestureInput,
  type GestureIntent,
  type GestureState,
  type HandState,
} from './gesture-fusion';

// Device Calibration
export {
  createCalibrationProfile,
  getCalibrationProfile,
  getActiveCalibration,
  getUserCalibrations,
  getOrCreateDefaultProfile,
  updateCalibrationProfile,
  setActiveCalibration,
  deleteCalibrationProfile,
  updateGazeCalibration,
  updateHandCalibration,
  updateSpatialCalibration,
  updatePerformanceProfile,
  updateAccessibilityConfig,
  runGazeCalibrationTest,
  runHandCalibrationTest,
  calculateCalibrationAdjustments,
  detectDeviceType,
  getOptimalPerformance,
  DEFAULT_GAZE_CALIBRATION,
  DEFAULT_HAND_CALIBRATION,
  DEFAULT_SPATIAL_CALIBRATION,
  PERFORMANCE_PROFILES,
  DEFAULT_ACCESSIBILITY,
  type DeviceType,
  type GazeCalibration,
  type HandCalibration,
  type SpatialCalibration,
  type PerformanceProfile,
  type AccessibilityConfig,
  type CalibrationTestResult,
} from './device-calibration';

// Domain Pack (RAG)
export {
  initializeVisionOSKnowledge,
  searchKnowledge,
  getKnowledgeByFramework,
  getKnowledgeByType,
  getPortingGuides,
  getTroubleshootingGuides,
  getPromptTemplate,
  fillPromptTemplate,
  generateVisionOSPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type DocumentType,
  type Framework,
  type KnowledgeQuery,
  type PromptTemplate,
} from './domain-pack';
