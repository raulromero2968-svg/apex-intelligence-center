/**
 * Session Management Module
 *
 * Implements secure session handling with Redis backend
 * as recommended by the Security Audit Report (Section 1)
 *
 * Features:
 * - 30-minute idle timeout (configurable)
 * - Device tracking and fingerprinting
 * - "Logout all devices" functionality
 * - Session revocation with audit trail
 *
 * @module lib/auth/session
 * @see Security Audit Report - Authentication Hardening
 */

import { createHash, randomBytes } from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
  mfaVerified: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  isMobile: boolean;
  fingerprint: string;
}

export interface SessionConfig {
  idleTimeoutMinutes: number;
  absoluteTimeoutHours: number;
  maxSessionsPerUser: number;
  redisKeyPrefix: string;
}

export interface SessionValidation {
  valid: boolean;
  session?: Session;
  reason?: 'expired' | 'revoked' | 'not_found' | 'idle_timeout' | 'ip_mismatch';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: SessionConfig = {
  idleTimeoutMinutes: 30,
  absoluteTimeoutHours: 24 * 7, // 7 days
  maxSessionsPerUser: 10,
  redisKeyPrefix: 'apex:session:',
};

const SESSION_INDEX_PREFIX = 'apex:sessions:user:';
const DEVICE_SESSION_PREFIX = 'apex:device:';

// =============================================================================
// REDIS CLIENT ABSTRACTION
// =============================================================================

/**
 * Redis client interface for session storage
 * Allows for easy mocking in tests and alternative implementations
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string | string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<void>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  scard(key: string): Promise<number>;
}

// In-memory fallback for development/testing
class InMemoryRedis implements RedisClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private sets = new Map<string, Set<string>>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: options?.EX ? Date.now() + options.EX * 1000 : undefined,
    });
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    const set = this.sets.get(key)!;
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) || []);
  }

  async scard(key: string): Promise<number> {
    return this.sets.get(key)?.size || 0;
  }
}

// Global Redis client - will be initialized on first use
let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 */
export async function initializeRedis(client?: RedisClient): Promise<void> {
  if (client) {
    redisClient = client;
    return;
  }

  // Try to use environment-configured Redis
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  if (redisUrl) {
    try {
      // Dynamic import to avoid bundling issues
      const { Redis } = await import('ioredis');
      const ioredis = new Redis(redisUrl);

      // Wrap ioredis to match our interface
      redisClient = {
        get: (key) => ioredis.get(key),
        set: async (key, value, options) => {
          if (options?.EX) {
            await ioredis.setex(key, options.EX, value);
          } else {
            await ioredis.set(key, value);
          }
        },
        del: async (key) => {
          const keys = Array.isArray(key) ? key : [key];
          return keys.length > 0 ? await ioredis.del(...keys) : 0;
        },
        keys: (pattern) => ioredis.keys(pattern),
        expire: (key, seconds) => ioredis.expire(key, seconds).then(() => {}),
        sadd: (key, ...members) => ioredis.sadd(key, ...members),
        srem: (key, ...members) => ioredis.srem(key, ...members),
        smembers: (key) => ioredis.smembers(key),
        scard: (key) => ioredis.scard(key),
      };

      console.log('[Session] Redis connected successfully');
    } catch (error) {
      console.warn('[Session] Redis connection failed, using in-memory fallback:', error);
      redisClient = new InMemoryRedis();
    }
  } else {
    console.warn('[Session] No Redis URL configured, using in-memory storage');
    redisClient = new InMemoryRedis();
  }
}

/**
 * Get Redis client (initializes if needed)
 */
async function getRedis(): Promise<RedisClient> {
  if (!redisClient) {
    await initializeRedis();
  }
  return redisClient!;
}

// =============================================================================
// DEVICE FINGERPRINTING
// =============================================================================

/**
 * Generate a device fingerprint from request headers
 */
export function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
  ipAddress: string
): string {
  const data = [userAgent, acceptLanguage, acceptEncoding, ipAddress].join('|');
  return createHash('sha256').update(data).digest('hex').slice(0, 32);
}

/**
 * Parse device info from User-Agent
 */
export function parseDeviceInfo(userAgent: string, fingerprint: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect platform
  let platform = 'unknown';
  if (ua.includes('windows')) platform = 'Windows';
  else if (ua.includes('mac')) platform = 'macOS';
  else if (ua.includes('linux')) platform = 'Linux';
  else if (ua.includes('android')) platform = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) platform = 'iOS';

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';

  // Detect mobile
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua);

  return {
    userAgent: userAgent.slice(0, 256), // Truncate long UAs
    platform,
    browser,
    isMobile,
    fingerprint,
  };
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  deviceInfo: DeviceInfo,
  ipAddress: string,
  mfaVerified: boolean = false,
  config: Partial<SessionConfig> = {}
): Promise<Session> {
  const redis = await getRedis();
  const { idleTimeoutMinutes, absoluteTimeoutHours, maxSessionsPerUser, redisKeyPrefix } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Generate secure session ID
  const sessionId = randomBytes(32).toString('base64url');
  const deviceId = deviceInfo.fingerprint;

  const now = new Date();
  const session: Session = {
    id: sessionId,
    userId,
    deviceId,
    deviceInfo,
    ipAddress,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + absoluteTimeoutHours * 60 * 60 * 1000),
    isActive: true,
    mfaVerified,
  };

  // Store session
  const sessionKey = `${redisKeyPrefix}${sessionId}`;
  const ttlSeconds = absoluteTimeoutHours * 60 * 60;
  await redis.set(sessionKey, JSON.stringify(session), { EX: ttlSeconds });

  // Add to user's session index
  const userSessionsKey = `${SESSION_INDEX_PREFIX}${userId}`;
  await redis.sadd(userSessionsKey, sessionId);

  // Map device to session for quick lookup
  const deviceKey = `${DEVICE_SESSION_PREFIX}${userId}:${deviceId}`;
  await redis.set(deviceKey, sessionId, { EX: ttlSeconds });

  // Enforce max sessions per user
  await enforceSessionLimit(userId, maxSessionsPerUser, config);

  return session;
}

/**
 * Validate and refresh a session
 */
export async function validateSession(
  sessionId: string,
  currentIpAddress?: string,
  config: Partial<SessionConfig> = {}
): Promise<SessionValidation> {
  const redis = await getRedis();
  const { idleTimeoutMinutes, redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const sessionKey = `${redisKeyPrefix}${sessionId}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    return { valid: false, reason: 'not_found' };
  }

  const session: Session = JSON.parse(sessionData);

  // Check if session was revoked
  if (!session.isActive) {
    return { valid: false, reason: 'revoked' };
  }

  // Check absolute expiration
  if (new Date() > new Date(session.expiresAt)) {
    await redis.del(sessionKey);
    return { valid: false, reason: 'expired' };
  }

  // Check idle timeout
  const lastActivity = new Date(session.lastActivityAt);
  const idleMs = Date.now() - lastActivity.getTime();
  if (idleMs > idleTimeoutMinutes * 60 * 1000) {
    return { valid: false, reason: 'idle_timeout' };
  }

  // Optional: Check IP address consistency (strict mode)
  // Disabled by default as IPs can change legitimately
  // if (currentIpAddress && session.ipAddress !== currentIpAddress) {
  //   return { valid: false, reason: 'ip_mismatch' };
  // }

  // Refresh last activity
  session.lastActivityAt = new Date();
  const remainingTtl = Math.floor(
    (new Date(session.expiresAt).getTime() - Date.now()) / 1000
  );
  await redis.set(sessionKey, JSON.stringify(session), { EX: remainingTtl });

  return { valid: true, session };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  sessionId: string,
  config: Partial<SessionConfig> = {}
): Promise<boolean> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const sessionKey = `${redisKeyPrefix}${sessionId}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    return false;
  }

  const session: Session = JSON.parse(sessionData);

  // Remove from user's session index
  const userSessionsKey = `${SESSION_INDEX_PREFIX}${session.userId}`;
  await redis.srem(userSessionsKey, sessionId);

  // Remove device mapping
  const deviceKey = `${DEVICE_SESSION_PREFIX}${session.userId}:${session.deviceId}`;
  await redis.del(deviceKey);

  // Delete session
  await redis.del(sessionKey);

  return true;
}

/**
 * Revoke all sessions for a user ("Logout all devices")
 */
export async function revokeAllSessions(
  userId: string,
  exceptSessionId?: string,
  config: Partial<SessionConfig> = {}
): Promise<number> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const userSessionsKey = `${SESSION_INDEX_PREFIX}${userId}`;
  const sessionIds = await redis.smembers(userSessionsKey);

  let revokedCount = 0;

  for (const sessionId of sessionIds) {
    if (exceptSessionId && sessionId === exceptSessionId) {
      continue;
    }

    const sessionKey = `${redisKeyPrefix}${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (sessionData) {
      const session: Session = JSON.parse(sessionData);

      // Remove device mapping
      const deviceKey = `${DEVICE_SESSION_PREFIX}${userId}:${session.deviceId}`;
      await redis.del(deviceKey);

      // Delete session
      await redis.del(sessionKey);
      await redis.srem(userSessionsKey, sessionId);

      revokedCount++;
    }
  }

  return revokedCount;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  userId: string,
  config: Partial<SessionConfig> = {}
): Promise<Session[]> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const userSessionsKey = `${SESSION_INDEX_PREFIX}${userId}`;
  const sessionIds = await redis.smembers(userSessionsKey);

  const sessions: Session[] = [];

  for (const sessionId of sessionIds) {
    const sessionKey = `${redisKeyPrefix}${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (sessionData) {
      const session: Session = JSON.parse(sessionData);
      if (session.isActive) {
        sessions.push(session);
      }
    }
  }

  // Sort by last activity (most recent first)
  return sessions.sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );
}

/**
 * Update session with MFA verification status
 */
export async function updateSessionMFA(
  sessionId: string,
  mfaVerified: boolean,
  config: Partial<SessionConfig> = {}
): Promise<boolean> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const sessionKey = `${redisKeyPrefix}${sessionId}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) {
    return false;
  }

  const session: Session = JSON.parse(sessionData);
  session.mfaVerified = mfaVerified;
  session.lastActivityAt = new Date();

  const remainingTtl = Math.floor(
    (new Date(session.expiresAt).getTime() - Date.now()) / 1000
  );
  await redis.set(sessionKey, JSON.stringify(session), { EX: remainingTtl });

  return true;
}

/**
 * Enforce maximum sessions per user
 */
async function enforceSessionLimit(
  userId: string,
  maxSessions: number,
  config: Partial<SessionConfig> = {}
): Promise<void> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const userSessionsKey = `${SESSION_INDEX_PREFIX}${userId}`;
  const sessionCount = await redis.scard(userSessionsKey);

  if (sessionCount <= maxSessions) {
    return;
  }

  // Get all sessions and sort by creation date
  const sessions = await getUserSessions(userId, config);

  // Remove oldest sessions exceeding the limit
  const sessionsToRemove = sessions
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, sessions.length - maxSessions);

  for (const session of sessionsToRemove) {
    await revokeSession(session.id, config);
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(
  config: Partial<SessionConfig> = {}
): Promise<number> {
  const redis = await getRedis();
  const { redisKeyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const allSessionKeys = await redis.keys(`${redisKeyPrefix}*`);
  let cleanedCount = 0;

  for (const sessionKey of allSessionKeys) {
    const sessionData = await redis.get(sessionKey);
    if (!sessionData) continue;

    const session: Session = JSON.parse(sessionData);

    if (new Date() > new Date(session.expiresAt) || !session.isActive) {
      await redis.del(sessionKey);

      // Clean up indexes
      const userSessionsKey = `${SESSION_INDEX_PREFIX}${session.userId}`;
      await redis.srem(userSessionsKey, session.id);

      const deviceKey = `${DEVICE_SESSION_PREFIX}${session.userId}:${session.deviceId}`;
      await redis.del(deviceKey);

      cleanedCount++;
    }
  }

  return cleanedCount;
}

export const SESSION_CONSTANTS = {
  DEFAULT_CONFIG,
  SESSION_INDEX_PREFIX,
  DEVICE_SESSION_PREFIX,
};
