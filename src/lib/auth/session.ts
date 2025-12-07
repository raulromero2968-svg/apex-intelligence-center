/**
 * Session Management Module
 *
 * Redis-backed session management with device tracking and revocation.
 * Implements knowledge-05-security-oauth2-jwt recommendations.
 *
 * Trade-offs:
 * - GOOD: Redis for distributed sessions enables horizontal scaling
 * - BAD: In-memory sessions fail on restarts; always use external store
 * - GOOD: Device tracking enables anomaly detection (e.g., new login alerts)
 * - BAD: Redis adds ~50ms latency; optimize with local cache fallback
 *
 * @see OAuth2 Session Management Best Practices
 * @see OWASP Session Management Cheatsheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import type Redis from 'ioredis';

// ============================================================================
// TYPES
// ============================================================================

export interface SessionData {
  userId: string;
  deviceInfo: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  mfaVerified: boolean;
  createdAt: number;
  lastActive: number;
  expiresAt: number;
}

export interface SessionConfig {
  /** Session TTL in milliseconds (default: 30 minutes) */
  ttlMs: number;
  /** Sliding window: refresh session on activity */
  slidingWindow: boolean;
  /** Maximum concurrent sessions per user */
  maxSessionsPerUser: number;
  /** Redis key prefix */
  keyPrefix: string;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
  shouldRefresh?: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

// Default configuration
const DEFAULT_SESSION_CONFIG: SessionConfig = {
  ttlMs: 30 * 60 * 1000, // 30 minutes
  slidingWindow: true,
  maxSessionsPerUser: 5,
  keyPrefix: 'session',
};

// ============================================================================
// SESSION STORE (Redis-backed)
// ============================================================================

/**
 * Create Redis session key
 */
function sessionKey(userId: string, sessionId: string, prefix: string = 'session'): string {
  return `${prefix}:${userId}:${sessionId}`;
}

/**
 * Create user sessions index key
 */
function userSessionsKey(userId: string, prefix: string = 'session'): string {
  return `${prefix}:user:${userId}`;
}

/**
 * Create a new session
 */
export async function createSession(
  redis: Redis,
  userId: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  config: Partial<SessionConfig> = {}
): Promise<{ sessionId: string; token: string }> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
  const sessionId = randomUUID();
  const now = Date.now();

  const sessionData: SessionData = {
    userId,
    deviceInfo: JSON.stringify(deviceInfo),
    deviceId: deviceInfo.deviceId,
    ipAddress,
    userAgent: deviceInfo.userAgent,
    mfaVerified: false,
    createdAt: now,
    lastActive: now,
    expiresAt: now + mergedConfig.ttlMs,
  };

  const key = sessionKey(userId, sessionId, mergedConfig.keyPrefix);
  const userKey = userSessionsKey(userId, mergedConfig.keyPrefix);

  try {
    // Store session data
    await redis.set(key, JSON.stringify(sessionData), 'PX', mergedConfig.ttlMs);

    // Add to user's session list
    await redis.sadd(userKey, sessionId);

    // Enforce max sessions per user
    await enforceMaxSessions(redis, userId, mergedConfig);

    console.log(`[Session] Created session ${sessionId} for user ${userId}`);

    // Generate session token (userId:sessionId format)
    const token = `${userId}:${sessionId}`;

    return { sessionId, token };
  } catch (error) {
    console.error('[Session] Create failed:', error);
    throw new Error('Session creation error');
  }
}

/**
 * Validate and optionally refresh a session
 */
export async function validateSession(
  redis: Redis,
  token: string,
  config: Partial<SessionConfig> = {}
): Promise<SessionValidationResult> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    // Parse token
    const [userId, sessionId] = token.split(':');
    if (!userId || !sessionId) {
      return { valid: false, error: 'Invalid session token format' };
    }

    const key = sessionKey(userId, sessionId, mergedConfig.keyPrefix);
    const sessionJson = await redis.get(key);

    if (!sessionJson) {
      return { valid: false, error: 'Session not found or expired' };
    }

    const session: SessionData = JSON.parse(sessionJson);

    // Check expiration
    if (Date.now() > session.expiresAt) {
      await revokeSession(redis, userId, sessionId, mergedConfig);
      return { valid: false, error: 'Session expired' };
    }

    // Sliding window: refresh on activity
    if (mergedConfig.slidingWindow) {
      const now = Date.now();
      session.lastActive = now;
      session.expiresAt = now + mergedConfig.ttlMs;

      await redis.set(key, JSON.stringify(session), 'PX', mergedConfig.ttlMs);
    }

    return { valid: true, session, shouldRefresh: mergedConfig.slidingWindow };
  } catch (error) {
    console.error('[Session] Validation failed:', error);
    return { valid: false, error: 'Session validation error' };
  }
}

/**
 * Revoke a single session
 */
export async function revokeSession(
  redis: Redis,
  userId: string,
  sessionId: string,
  config: Partial<SessionConfig> = {}
): Promise<boolean> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    const key = sessionKey(userId, sessionId, mergedConfig.keyPrefix);
    const userKey = userSessionsKey(userId, mergedConfig.keyPrefix);

    await redis.del(key);
    await redis.srem(userKey, sessionId);

    console.log(`[Session] Revoked session ${sessionId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[Session] Revocation failed:', error);
    return false;
  }
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllSessions(
  redis: Redis,
  userId: string,
  config: Partial<SessionConfig> = {}
): Promise<number> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    const userKey = userSessionsKey(userId, mergedConfig.keyPrefix);
    const sessionIds = await redis.smembers(userKey);

    if (sessionIds.length === 0) {
      return 0;
    }

    // Delete all session data
    const keys = sessionIds.map(sid => sessionKey(userId, sid, mergedConfig.keyPrefix));
    await redis.del(...keys);

    // Clear user's session list
    await redis.del(userKey);

    console.log(`[Session] Revoked ${sessionIds.length} sessions for user ${userId}`);
    return sessionIds.length;
  } catch (error) {
    console.error('[Session] Revoke all failed:', error);
    throw new Error('Session revocation error');
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(
  redis: Redis,
  userId: string,
  currentSessionId: string,
  config: Partial<SessionConfig> = {}
): Promise<number> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    const userKey = userSessionsKey(userId, mergedConfig.keyPrefix);
    const sessionIds = await redis.smembers(userKey);

    const otherSessions = sessionIds.filter(sid => sid !== currentSessionId);

    if (otherSessions.length === 0) {
      return 0;
    }

    const keys = otherSessions.map(sid => sessionKey(userId, sid, mergedConfig.keyPrefix));
    await redis.del(...keys);

    // Update user's session list
    for (const sid of otherSessions) {
      await redis.srem(userKey, sid);
    }

    console.log(`[Session] Revoked ${otherSessions.length} other sessions for user ${userId}`);
    return otherSessions.length;
  } catch (error) {
    console.error('[Session] Revoke others failed:', error);
    throw new Error('Session revocation error');
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  redis: Redis,
  userId: string,
  config: Partial<SessionConfig> = {}
): Promise<Array<SessionData & { sessionId: string }>> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    const userKey = userSessionsKey(userId, mergedConfig.keyPrefix);
    const sessionIds = await redis.smembers(userKey);

    const sessions: Array<SessionData & { sessionId: string }> = [];

    for (const sessionId of sessionIds) {
      const key = sessionKey(userId, sessionId, mergedConfig.keyPrefix);
      const sessionJson = await redis.get(key);

      if (sessionJson) {
        const session: SessionData = JSON.parse(sessionJson);

        // Only include non-expired sessions
        if (Date.now() <= session.expiresAt) {
          sessions.push({ ...session, sessionId });
        } else {
          // Cleanup expired session
          await revokeSession(redis, userId, sessionId, mergedConfig);
        }
      } else {
        // Cleanup orphaned session ID
        await redis.srem(userKey, sessionId);
      }
    }

    return sessions;
  } catch (error) {
    console.error('[Session] Get user sessions failed:', error);
    return [];
  }
}

/**
 * Mark session as MFA verified
 */
export async function markSessionMfaVerified(
  redis: Redis,
  token: string,
  config: Partial<SessionConfig> = {}
): Promise<boolean> {
  const mergedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

  try {
    const [userId, sessionId] = token.split(':');
    if (!userId || !sessionId) {
      return false;
    }

    const key = sessionKey(userId, sessionId, mergedConfig.keyPrefix);
    const sessionJson = await redis.get(key);

    if (!sessionJson) {
      return false;
    }

    const session: SessionData = JSON.parse(sessionJson);
    session.mfaVerified = true;
    session.lastActive = Date.now();

    const ttl = await redis.pttl(key);
    await redis.set(key, JSON.stringify(session), 'PX', ttl > 0 ? ttl : mergedConfig.ttlMs);

    console.log(`[Session] Marked MFA verified for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[Session] MFA mark failed:', error);
    return false;
  }
}

// ============================================================================
// DEVICE TRACKING
// ============================================================================

/**
 * Parse device info from User-Agent
 */
export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect device type
  let deviceType: DeviceInfo['deviceType'] = 'unknown';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
    deviceType = 'desktop';
  }

  // Generate deterministic device ID from user agent
  const deviceId = createHash('sha256')
    .update(userAgent)
    .digest('hex')
    .slice(0, 16);

  return {
    deviceId,
    userAgent,
    browser,
    os,
    deviceType,
  };
}

/**
 * Check if device is new for user
 */
export async function isNewDevice(
  redis: Redis,
  userId: string,
  deviceId: string,
  config: Partial<SessionConfig> = {}
): Promise<boolean> {
  const sessions = await getUserSessions(redis, userId, config);
  return !sessions.some(s => s.deviceId === deviceId);
}

/**
 * Detect suspicious session activity
 */
export interface SessionAnomalyResult {
  suspicious: boolean;
  reasons: string[];
}

export function detectSessionAnomaly(
  currentSession: SessionData,
  newIp: string,
  newDeviceInfo: DeviceInfo
): SessionAnomalyResult {
  const reasons: string[] = [];

  // Check IP change
  if (currentSession.ipAddress !== newIp) {
    reasons.push('IP address changed during session');
  }

  // Check device change
  if (currentSession.deviceId !== newDeviceInfo.deviceId) {
    reasons.push('Device fingerprint changed during session');
  }

  // Check for session hijacking indicators
  const timeSinceLastActive = Date.now() - currentSession.lastActive;
  if (timeSinceLastActive < 1000 && currentSession.ipAddress !== newIp) {
    reasons.push('Rapid location change detected');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

// ============================================================================
// SESSION MIDDLEWARE HELPERS
// ============================================================================

/**
 * Extract session token from request
 */
export function getSessionFromRequest(request: NextRequest): string | null {
  // Check cookie first
  const cookieToken = request.cookies.get('session')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions(secure: boolean = true) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 60, // 30 minutes in seconds
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Enforce maximum sessions per user
 */
async function enforceMaxSessions(
  redis: Redis,
  userId: string,
  config: SessionConfig
): Promise<void> {
  const sessions = await getUserSessions(redis, userId, config);

  if (sessions.length > config.maxSessionsPerUser) {
    // Sort by lastActive (oldest first)
    sessions.sort((a, b) => a.lastActive - b.lastActive);

    // Revoke oldest sessions beyond limit
    const toRevoke = sessions.slice(0, sessions.length - config.maxSessionsPerUser);

    for (const session of toRevoke) {
      await revokeSession(redis, userId, session.sessionId, config);
      console.log(`[Session] Revoked oldest session due to max limit`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_SESSION_CONFIG };
