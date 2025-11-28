/**
 * Security Module - Public API
 *
 * Exports deep corrigibility verification for FHI-aligned
 * simulation markets and AI safety checks.
 */

export {
  deepCorrigibilityCheck,
  deepCorrigible,
  validateCorrigibilityClaims,
  getCorrigibilityDisclaimer,
  type CorrigibilityResult,
} from './deep-corr';
