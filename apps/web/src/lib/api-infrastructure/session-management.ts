/**
 * Session Management with Redis
 *
 * Provides distributed session management for horizontal scaling
 * with sticky session support and session sharing across instances.
 *
 * @see API Infrastructure Blueprint v1.0
 */

import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  /** Session TTL in seconds (1 hour default) */
  ttlSeconds: 3600,
  /** Session prefix in Redis */
  prefix: 'session:',
  /** Maximum sessions per user */
  maxSessionsPerUser: 5,
  /** Session renewal threshold (renew if less than this many seconds left) */
  renewThreshold: 600,
  /** Cookie name for session ID */
  cookieName: 'apex_session',
  /** Secure cookie settings */
  secureCookie: process.env.NODE_ENV === 'production',
} as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Session data structure
 */
export interface SessionData {
  /** User ID */
  userId: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivityAt: number;
  /** IP address of session creator */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Subscription tier */
  tier?: 'free' | 'pro' | 'enterprise';
  /** Custom session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session with ID
 */
export interface Session extends SessionData {
  id: string;
  expiresAt: number;
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  userId: string;
  ipAddress: string;
  userAgent: string;
  tier?: 'free' | 'pro' | 'enterprise';
  metadata?: Record<string, unknown>;
  ttlSeconds?: number;
}

// =============================================================================
// REDIS CLIENT
// =============================================================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redis;
    } catch (error) {
      console.warn('Failed to initialize Redis for session management:', error);
      return null;
    }
  }

  return null;
}

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

/**
 * Create a new session
 */
export async function createSession(
  options: CreateSessionOptions
): Promise<Session | null> {
  const redisClient = getRedis();
  if (!redisClient) {
    console.warn('Redis not available for session management');
    return null;
  }

  const now = Date.now();
  const ttl = options.ttlSeconds ?? SESSION_CONFIG.ttlSeconds;
  const sessionId = generateSessionId();

  const sessionData: SessionData = {
    userId: options.userId,
    createdAt: now,
    lastActivityAt: now,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    tier: options.tier,
    metadata: options.metadata,
  };

  try {
    // Enforce max sessions per user
    await enforceMaxSessions(options.userId);

    // Store session
    await redisClient.set(
      `${SESSION_CONFIG.prefix}${sessionId}`,
      JSON.stringify(sessionData),
      { ex: ttl }
    );

    // Add to user's session set
    await redisClient.sadd(`${SESSION_CONFIG.prefix}user:${options.userId}`, sessionId);
    await redisClient.expire(`${SESSION_CONFIG.prefix}user:${options.userId}`, ttl);

    const session: Session = {
      id: sessionId,
      ...sessionData,
      expiresAt: now + ttl * 1000,
    };

    Sentry.addBreadcrumb({
      category: 'session',
      message: 'Session created',
      level: 'info',
      data: { sessionId: sessionId.slice(0, 8), userId: options.userId.slice(0, 8) },
    });

    return session;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'session-management', action: 'create' },
    });
    return null;
  }
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const redisClient = getRedis();
  if (!redisClient) return null;

  try {
    const data = await redisClient.get<string>(`${SESSION_CONFIG.prefix}${sessionId}`);
    if (!data) return null;

    const sessionData: SessionData = typeof data === 'string' ? JSON.parse(data) : data;
    const ttl = await redisClient.ttl(`${SESSION_CONFIG.prefix}${sessionId}`);

    return {
      id: sessionId,
      ...sessionData,
      expiresAt: Date.now() + ttl * 1000,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'session-management', action: 'get' },
    });
    return null;
  }
}

/**
 * Update session activity timestamp
 */
export async function touchSession(sessionId: string): Promise<boolean> {
  const redisClient = getRedis();
  if (!redisClient) return false;

  try {
    const key = `${SESSION_CONFIG.prefix}${sessionId}`;
    const data = await redisClient.get<string>(key);
    if (!data) return false;

    const sessionData: SessionData = typeof data === 'string' ? JSON.parse(data) : data;
    sessionData.lastActivityAt = Date.now();

    // Get current TTL
    const ttl = await redisClient.ttl(key);

    // Renew if near expiration
    const newTtl =
      ttl < SESSION_CONFIG.renewThreshold
        ? SESSION_CONFIG.ttlSeconds
        : ttl;

    await redisClient.set(key, JSON.stringify(sessionData), { ex: newTtl });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const redisClient = getRedis();
  if (!redisClient) return false;

  try {
    // Get session to find user ID
    const session = await getSession(sessionId);
    if (session) {
      // Remove from user's session set
      await redisClient.srem(
        `${SESSION_CONFIG.prefix}user:${session.userId}`,
        sessionId
      );
    }

    // Delete session
    await redisClient.del(`${SESSION_CONFIG.prefix}${sessionId}`);

    Sentry.addBreadcrumb({
      category: 'session',
      message: 'Session deleted',
      level: 'info',
      data: { sessionId: sessionId.slice(0, 8) },
    });

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'session-management', action: 'delete' },
    });
    return false;
  }
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<number> {
  const redisClient = getRedis();
  if (!redisClient) return 0;

  try {
    // Get all session IDs for user
    const sessionIds = await redisClient.smembers(
      `${SESSION_CONFIG.prefix}user:${userId}`
    );

    // Delete each session
    for (const sessionId of sessionIds) {
      await redisClient.del(`${SESSION_CONFIG.prefix}${sessionId}`);
    }

    // Delete user session set
    await redisClient.del(`${SESSION_CONFIG.prefix}user:${userId}`);

    Sentry.addBreadcrumb({
      category: 'session',
      message: 'All user sessions deleted',
      level: 'info',
      data: { userId: userId.slice(0, 8), count: sessionIds.length },
    });

    return sessionIds.length;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'session-management', action: 'delete-user-sessions' },
    });
    return 0;
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const redisClient = getRedis();
  if (!redisClient) return [];

  try {
    const sessionIds = await redisClient.smembers(
      `${SESSION_CONFIG.prefix}user:${userId}`
    );

    const sessions: Session[] = [];

    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push(session);
      } else {
        // Clean up stale reference
        await redisClient.srem(`${SESSION_CONFIG.prefix}user:${userId}`, sessionId);
      }
    }

    return sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'session-management', action: 'get-user-sessions' },
    });
    return [];
  }
}

// =============================================================================
// SESSION VALIDATION
// =============================================================================

/**
 * Validate session and optionally update activity
 */
export async function validateSession(
  sessionId: string,
  options?: { touch?: boolean; requiredTier?: 'free' | 'pro' | 'enterprise' }
): Promise<{ valid: boolean; session?: Session; error?: string }> {
  const session = await getSession(sessionId);

  if (!session) {
    return { valid: false, error: 'Session not found or expired' };
  }

  // Check tier requirement
  if (options?.requiredTier) {
    const tierRanks = { free: 0, pro: 1, enterprise: 2 };
    const sessionTierRank = tierRanks[session.tier || 'free'];
    const requiredTierRank = tierRanks[options.requiredTier];

    if (sessionTierRank < requiredTierRank) {
      return {
        valid: false,
        session,
        error: `This action requires ${options.requiredTier} tier or higher`,
      };
    }
  }

  // Touch session to update activity
  if (options?.touch !== false) {
    await touchSession(sessionId);
  }

  return { valid: true, session };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a secure session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Enforce maximum sessions per user
 */
async function enforceMaxSessions(userId: string): Promise<void> {
  const sessions = await getUserSessions(userId);

  if (sessions.length >= SESSION_CONFIG.maxSessionsPerUser) {
    // Delete oldest sessions
    const sessionsToDelete = sessions
      .sort((a, b) => a.lastActivityAt - b.lastActivityAt)
      .slice(0, sessions.length - SESSION_CONFIG.maxSessionsPerUser + 1);

    for (const session of sessionsToDelete) {
      await deleteSession(session.id);
    }
  }
}

/**
 * Get session stats for monitoring
 */
export async function getSessionStats(): Promise<{
  activeSessions: number;
  activeUsers: number;
} | null> {
  const redisClient = getRedis();
  if (!redisClient) return null;

  try {
    // Count session keys
    const sessionKeys = await redisClient.keys(`${SESSION_CONFIG.prefix}[^u]*`);
    const userKeys = await redisClient.keys(`${SESSION_CONFIG.prefix}user:*`);

    return {
      activeSessions: sessionKeys.length,
      activeUsers: userKeys.length,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// COOKIE HELPERS
// =============================================================================

/**
 * Get session cookie options
 */
export function getSessionCookieOptions(): {
  name: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
  };
} {
  return {
    name: SESSION_CONFIG.cookieName,
    options: {
      httpOnly: true,
      secure: SESSION_CONFIG.secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_CONFIG.ttlSeconds,
    },
  };
}

/**
 * Parse session ID from request cookies
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_CONFIG.cookieName}=`)
  );

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}
