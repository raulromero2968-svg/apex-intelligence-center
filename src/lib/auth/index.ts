/**
 * Auth module barrel exports
 *
 * This module provides authentication and authorization utilities including:
 * - JWT token validation and user extraction
 * - Multi-Factor Authentication (MFA) with TOTP and SMS
 * - Session management with Redis and device tracking
 * - Password policies with HIBP breach detection
 * - Federated identity with OIDC/SSO
 *
 * @see knowledge-05-security-oauth2-jwt.md
 * @see OWASP Authentication Best Practices
 */

// JWT utilities
export { getUserFromRequest, signJwt, type UserWithTier } from './jwt';

// MFA (Multi-Factor Authentication)
export {
  // TOTP
  generateTotpSecret,
  verifyTotpCode,
  generateOtpauthUrl,
  // SMS
  generateSmsCode,
  formatSmsMessage,
  sendSmsCode,
  // Backup codes
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  // MFA flow
  enableMfa,
  verifyMfaRequest,
  checkMfaLockout,
  // Types
  type MfaType,
  type MfaEnableResult,
  type MfaVerifyResult,
  type MfaConfig,
  type MfaAttemptTracker,
} from './mfa';

// Session management
export {
  // Session CRUD
  createSession,
  validateSession,
  revokeSession,
  revokeAllSessions,
  revokeOtherSessions,
  getUserSessions,
  markSessionMfaVerified,
  // Device tracking
  parseDeviceInfo,
  isNewDevice,
  detectSessionAnomaly,
  // Request helpers
  getSessionFromRequest,
  getSessionCookieOptions,
  // Types
  type SessionData,
  type SessionConfig,
  type SessionValidationResult,
  type DeviceInfo,
  type SessionAnomalyResult,
  DEFAULT_SESSION_CONFIG,
} from './session';

// Password policies
export {
  // Validation
  validatePasswordPolicy,
  validatePassword,
  // HIBP integration
  checkPasswordBreached,
  checkPasswordBreachedCached,
  // Hashing
  hashPassword,
  verifyPassword,
  needsRehash,
  // Strength analysis
  estimatePasswordEntropy,
  // Generation
  generateSecurePassword,
  generatePassphrase,
  // Types
  type PasswordValidationResult,
  type PasswordConfig,
  DEFAULT_PASSWORD_CONFIG,
} from './password';

// Federated identity (OIDC)
export {
  // PKCE
  generatePkceChallenge,
  verifyPkceChallenge,
  // Discovery
  discoverOidcEndpoints,
  // Authorization flow
  generateAuthorizationUrl,
  federatedLogin,
  federatedCallback,
  // Token management
  exchangeCodeForTokens,
  fetchUserInfo,
  refreshFederatedTokens,
  // Identity linking
  linkFederatedIdentity,
  syncFederatedRcBalance,
  // Utilities
  validateIdToken,
  generateOidcState,
  generateNonce,
  // Types
  type OidcConfig,
  type OidcDiscoveryDocument,
  type OidcTokenResponse,
  type OidcUserInfo,
  type FederatedLoginResult,
  type PkceChallenge,
  type FederatedIdentityLink,
  DEFAULT_OIDC_CONFIG,
} from './federated';
