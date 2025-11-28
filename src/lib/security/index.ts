/**
 * Security Module - Public API
 *
 * Exports deep corrigibility verification for FHI-aligned
 * simulation markets and AI safety checks.
 */

export {
  deepCorr,
  deepCorrSync,
  validateOutcomeCorrigibility,
  requiresDeepCorrigibility,
  type DeepCorrigibilityConfig,
  type DeepCorrigibilityResult,
  type CorrigibilityPayload,
} from './deep-corr';
