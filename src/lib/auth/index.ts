/**
 * Auth module barrel exports
 *
 * This module provides authentication and authorization utilities including:
 * - JWT token validation and user extraction
 * - Session management (future)
 * - OAuth integration (future)
 * - PKCE flow support (future)
 */

// JWT utilities
export { getUserFromRequest, type UserWithTier } from './jwt';
