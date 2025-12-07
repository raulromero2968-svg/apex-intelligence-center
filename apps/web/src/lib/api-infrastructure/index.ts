/**
 * API Infrastructure Module
 *
 * Provides comprehensive API infrastructure utilities including:
 * - DDoS protection and advanced rate limiting
 * - API versioning with backward compatibility
 * - Multi-signature action approval
 * - Session management with Redis
 * - Health check endpoints
 *
 * @see API Infrastructure Blueprint v1.0
 */

// DDoS Protection
export {
  checkDdosProtection,
  ddosProtectionMiddleware,
  isIpBlockedInRedis,
  markIpAsTrusted,
  blockIp,
  unblockIp,
  getProtectionStats,
  DDOS_THRESHOLDS,
  type DdosCheckResult,
  type IpReputation,
} from './ddos-protection';

// API Versioning
export {
  resolveApiVersion,
  withApiVersion,
  createVersionContext,
  checkVersionCompatibility,
  createVersionedTransformer,
  deprecateVersion,
  getDeprecationHeaders,
  logDeprecatedUsage,
  API_VERSIONS,
  CURRENT_API_VERSION,
  DEFAULT_API_VERSION,
  VERSION_HEADER,
  DEPRECATION_HEADER,
  type ApiVersion,
  type VersionResolution,
  type ApiVersionContext,
  type VersionCompatibility,
  type ResponseTransformer,
} from './versioning';

// Multi-Signature Actions
export {
  createMultiSigProposal,
  addSignature,
  executeMultiSigProposal,
  getPendingProposals,
  rejectProposal,
  createOnChainMultiSig,
  requiresMultiSig,
  getRequiredSignatures,
  MULTISIG_CONFIG,
  type MultiSigStatus,
  type Signature,
  type MultiSigProposal,
  type MultiSigResult,
} from './multi-sig';

// Session Management
export {
  createSession,
  getSession,
  touchSession,
  deleteSession,
  deleteUserSessions,
  getUserSessions,
  validateSession,
  getSessionStats,
  getSessionCookieOptions,
  parseSessionCookie,
  SESSION_CONFIG,
  type SessionData,
  type Session,
  type CreateSessionOptions,
} from './session-management';

// Health Checks
export {
  checkBasicHealth,
  checkSystemHealth,
  checkDetailedHealth,
  healthCheckHandler,
  livenessHandler,
  readinessHandler,
  HEALTH_THRESHOLDS,
  type HealthStatus,
  type ComponentHealth,
  type SystemHealth,
  type DetailedHealthCheck,
} from './health';
