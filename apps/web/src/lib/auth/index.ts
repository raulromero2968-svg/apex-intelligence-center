/**
 * Public API for auth module
 * Explicit exports - no barrel exports allowed
 */

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeSession,
  getUserFromRequest,
  rotateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  type SubscriptionTier,
  type UserWithTier,
} from './jwt';

