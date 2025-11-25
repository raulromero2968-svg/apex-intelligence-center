/**
 * Cross-Pack Integration Module
 *
 * Integrations between different platform modules for cohesive functionality.
 */

// Resilient Mobile-Defense Sync
export {
  // Types
  type SyncStatus,
  type OperationType,
  type ConflictStrategy,
  type ConnectionState,
  type SyncOperation,
  type SyncDelta,
  type SyncResult,
  type ConnectionStatus,
  type SyncConfig,

  // Constants
  DEFAULT_SYNC_CONFIG,
  DDIL_THRESHOLDS,

  // Connection Monitoring
  checkConnectionStatus,
  detectDdilCondition,

  // Sync Queue
  queueOperation,
  getPendingOperations,
  removeFromQueue,
  clearFailedOperations,

  // Sync Execution
  calculateBackoff,
  resilientMobileSync,

  // Health & Monitoring
  getSyncHealthStatus,

  // Offline Storage
  persistQueue,
  restoreQueue,
  processQueue,
} from './resilient-sync';

// XR Hybrid Integration
export {
  // Types
  type XrPlatform,
  type RenderMode,
  type HandTrackingSupport,
  type DeviceCapabilities,
  type XrSessionConfig,
  type XrSession,
  type RenderModeTransition,
  type HandPose,
  type QuiltConfig,

  // Constants
  DEFAULT_XR_CONFIG,
  PLATFORM_CAPABILITIES,

  // Device Detection
  detectDeviceCapabilities,

  // Platform Selection
  selectPlatform,

  // Session Management
  startXrSession,
  endXrSession,
  getActiveSession,

  // Render Mode
  switchRenderMode,

  // Hand Tracking
  getHandTracking,

  // Light Field
  getQuiltConfig,
  shouldFallbackToLightField,
} from './xr-hybrid';
