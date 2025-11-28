/**
 * Security & Authentication Module
 *
 * Defense-grade security with MFA, token rotation, and audit logging.
 * Implements knowledge-05-security-oauth2-jwt.
 */

export {
  // Types
  type MfaMethod,
  type RiskLevel,
  type AuditAction,
  type Session,
  type SecurityContext,
  type DefenseAccessResult,
  type DefenseAction,
  type RiskFactors,
  type AuditLogEntry,

  // Constants
  DEFENSE_ACTIONS,
  ACTION_RISK_LEVELS,
  MFA_REQUIRED_ACTIONS,
  TOKEN_ROTATION_ACTIONS,

  // Token Management
  generateSecureToken,
  hashToken,
  generateTokenPair,
  rotateRefreshToken,

  // MFA
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  verifyBackupCode,

  // Defense Access Control
  requiresMfa,
  requiresTokenRotation,
  getActionRiskLevel,
  secureDefenseAccess,

  // Risk Assessment
  calculateRiskScore,
  needsAdditionalVerification,

  // Audit Logging
  createAuditLog,
  logSuspiciousActivity,

  // Session Security
  validateSessionSecurity,
  needsReauthentication,
} from './defense-auth';

// FHI Corrigibility (KB-05 Security + Simulation Integration)
export {
  fhiCorrigible,
  verifySimulationToken,
  generateSimulationToken,
  isHarmfulOutcome,
  isHighStakeOutcome,
  isSessionFresh,
  getEthicalDisclaimer,
  SIMULATION_LIMITS,
  type SimulationClaims,
  type CorrigibilityResult,
} from './fhi-corr';
