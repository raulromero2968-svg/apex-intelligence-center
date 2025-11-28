/**
 * Public API for Security module
 * Explicit exports - no barrel exports allowed
 */

export {
  fhiCorrigible,
  verifyFHICorrigibility,
  validateOutcome,
  incrementSimulationUsage,
  generateEthicsAcknowledgment,
  getFHIClaimsFromRequest,
  checkCorrigibilityMiddleware,
  createFHICorrigibilityClaims,
  type FHICorrigibilityPayload,
  type CorrigibilityCheckResult,
  type OutcomeValidation,
  type SimulationRole,
} from './fhi-corr';

export {
  checkMarketRateLimit,
  checkBostromRateLimit,
  rateLimitMiddleware,
  getTierFromRequest,
  addRateLimitHeaders,
  getUsageStats,
  type MarketTier,
  type TierLimits,
  type RateLimitResult,
  type MarketRateLimitConfig,
} from './tiered-ratelimit';
