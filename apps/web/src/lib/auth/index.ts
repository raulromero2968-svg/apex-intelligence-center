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

// Re-export signJwt from root auth module for registration flow
export { signJwt } from '../../../../../src/lib/auth/jwt';

