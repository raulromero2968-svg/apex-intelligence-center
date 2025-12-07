/**
 * DDoS Protection and Advanced Rate Limiting
 *
 * Self-hosted DDoS protection layer with:
 * - IP reputation tracking
 * - Request pattern analysis
 * - Adaptive rate limiting
 * - Fail2ban-style blocking
 *
 * @see API Infrastructure Blueprint v1.0
 */

import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * DDoS protection thresholds
 */
export const DDOS_THRESHOLDS = {
  /** Requests per second before triggering protection */
  requestsPerSecond: 100,
  /** Burst size allowed before adaptive limiting */
  burstSize: 50,
  /** Time window for pattern analysis (seconds) */
  analysisWindow: 60,
  /** Ban duration for bad actors (seconds) */
  banDuration: 3600, // 1 hour
  /** Temporary block duration (seconds) */
  tempBlockDuration: 300, // 5 minutes
  /** Maximum IP addresses to track in memory */
  maxTrackedIps: 10000,
  /** Threshold for suspicious request patterns */
  suspiciousPatternThreshold: 0.8,
} as const;

/**
 * IP reputation levels
 */
export type IpReputation = 'trusted' | 'normal' | 'suspicious' | 'blocked';

/**
 * IP tracking info
 */
interface IpTrackingInfo {
  requestCount: number;
  firstSeenAt: number;
  lastRequestAt: number;
  reputation: IpReputation;
  violations: number;
  blockedUntil?: number;
}

// =============================================================================
// IN-MEMORY TRACKING (for low-latency)
// =============================================================================

const ipTracking = new Map<string, IpTrackingInfo>();
let lastCleanup = Date.now();

/**
 * Clean up old IP tracking entries periodically
 */
function cleanupIpTracking(): void {
  const now = Date.now();
  const expiryTime = now - DDOS_THRESHOLDS.analysisWindow * 1000;

  // Only cleanup every 60 seconds
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  // Remove entries older than analysis window
  for (const [ip, info] of ipTracking.entries()) {
    if (info.lastRequestAt < expiryTime && info.reputation !== 'blocked') {
      ipTracking.delete(ip);
    }
  }

  // Trim to max size if needed (remove oldest entries)
  if (ipTracking.size > DDOS_THRESHOLDS.maxTrackedIps) {
    const entries = Array.from(ipTracking.entries())
      .sort((a, b) => a[1].lastRequestAt - b[1].lastRequestAt);

    const toRemove = entries.slice(0, ipTracking.size - DDOS_THRESHOLDS.maxTrackedIps);
    for (const [ip] of toRemove) {
      ipTracking.delete(ip);
    }
  }
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
      console.warn('Failed to initialize Redis for DDoS protection:', error);
      return null;
    }
  }

  return null;
}

// =============================================================================
// CORE PROTECTION FUNCTIONS
// =============================================================================

/**
 * DDoS check result
 */
export interface DdosCheckResult {
  allowed: boolean;
  reputation: IpReputation;
  reason?: string;
  retryAfter?: number;
  requestsInWindow: number;
  violations: number;
}

/**
 * Check if a request should be allowed based on DDoS protection rules
 *
 * @param ip - Client IP address
 * @param userAgent - User agent string (for bot detection)
 * @param path - Request path (for pattern analysis)
 * @returns DDoS check result
 */
export async function checkDdosProtection(
  ip: string,
  userAgent?: string,
  path?: string
): Promise<DdosCheckResult> {
  cleanupIpTracking();

  const now = Date.now();

  // Get or create tracking info
  let info = ipTracking.get(ip);
  if (!info) {
    info = {
      requestCount: 0,
      firstSeenAt: now,
      lastRequestAt: now,
      reputation: 'normal',
      violations: 0,
    };
    ipTracking.set(ip, info);
  }

  // Check if currently blocked
  if (info.blockedUntil && info.blockedUntil > now) {
    return {
      allowed: false,
      reputation: 'blocked',
      reason: 'IP temporarily blocked due to excessive requests',
      retryAfter: Math.ceil((info.blockedUntil - now) / 1000),
      requestsInWindow: info.requestCount,
      violations: info.violations,
    };
  }

  // Clear expired block
  if (info.blockedUntil && info.blockedUntil <= now) {
    info.blockedUntil = undefined;
    info.reputation = 'suspicious'; // Downgrade but don't block
  }

  // Update request count (sliding window)
  const windowStart = now - DDOS_THRESHOLDS.analysisWindow * 1000;
  if (info.lastRequestAt < windowStart) {
    // Reset counter for new window
    info.requestCount = 1;
    info.firstSeenAt = now;
  } else {
    info.requestCount++;
  }
  info.lastRequestAt = now;

  // Check for suspicious patterns
  const isSuspicious = await analyzeRequestPattern(ip, userAgent, path);

  // Calculate requests per second
  const elapsedSeconds = Math.max(1, (now - info.firstSeenAt) / 1000);
  const requestsPerSecond = info.requestCount / elapsedSeconds;

  // Determine action based on thresholds
  if (requestsPerSecond > DDOS_THRESHOLDS.requestsPerSecond) {
    info.violations++;
    info.reputation = 'blocked';
    info.blockedUntil = now + DDOS_THRESHOLDS.banDuration * 1000;

    // Persist to Redis for cross-instance blocking
    await persistIpBlock(ip, info);

    Sentry.captureMessage('DDoS protection: IP blocked', {
      level: 'warning',
      tags: { ip: maskIp(ip), requestsPerSecond: String(Math.round(requestsPerSecond)) },
    });

    return {
      allowed: false,
      reputation: 'blocked',
      reason: 'Request rate exceeded threshold',
      retryAfter: DDOS_THRESHOLDS.banDuration,
      requestsInWindow: info.requestCount,
      violations: info.violations,
    };
  }

  if (info.requestCount > DDOS_THRESHOLDS.burstSize && info.reputation !== 'trusted') {
    info.violations++;
    info.reputation = 'suspicious';

    // Temporary block for repeated offenders
    if (info.violations >= 3) {
      info.blockedUntil = now + DDOS_THRESHOLDS.tempBlockDuration * 1000;
      await persistIpBlock(ip, info);

      return {
        allowed: false,
        reputation: 'suspicious',
        reason: 'Burst limit exceeded',
        retryAfter: DDOS_THRESHOLDS.tempBlockDuration,
        requestsInWindow: info.requestCount,
        violations: info.violations,
      };
    }
  }

  if (isSuspicious && info.reputation === 'normal') {
    info.reputation = 'suspicious';
    info.violations++;
  }

  // Allow with current status
  return {
    allowed: true,
    reputation: info.reputation,
    requestsInWindow: info.requestCount,
    violations: info.violations,
  };
}

/**
 * Persist IP block to Redis for cross-instance protection
 */
async function persistIpBlock(ip: string, info: IpTrackingInfo): Promise<void> {
  const redisClient = getRedis();
  if (!redisClient) return;

  try {
    await redisClient.set(
      `ddos:block:${hashIp(ip)}`,
      JSON.stringify({
        blockedUntil: info.blockedUntil,
        violations: info.violations,
        reason: 'DDoS protection triggered',
      }),
      {
        ex: Math.ceil(((info.blockedUntil || Date.now()) - Date.now()) / 1000),
      }
    );
  } catch (error) {
    console.error('Failed to persist IP block:', error);
  }
}

/**
 * Check if IP is blocked in Redis (cross-instance check)
 */
export async function isIpBlockedInRedis(ip: string): Promise<boolean> {
  const redisClient = getRedis();
  if (!redisClient) return false;

  try {
    const blocked = await redisClient.get(`ddos:block:${hashIp(ip)}`);
    return blocked !== null;
  } catch {
    return false;
  }
}

// =============================================================================
// PATTERN ANALYSIS
// =============================================================================

/**
 * Analyze request patterns for suspicious behavior
 */
async function analyzeRequestPattern(
  ip: string,
  userAgent?: string,
  path?: string
): Promise<boolean> {
  // Check for missing or suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  // Check for known bot patterns (not exhaustive)
  const botPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /go-http-client/i,
    /java\//i,
    /libwww/i,
  ];

  // Note: These are not malicious, but may indicate automated access
  // Real detection would be more sophisticated
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return false; // Bots are fine, not suspicious per se
    }
  }

  // Check for path patterns (rapid access to same endpoint)
  const redisClient = getRedis();
  if (redisClient && path) {
    try {
      const key = `ddos:path:${hashIp(ip)}:${hashPath(path)}`;
      const count = await redisClient.incr(key);
      await redisClient.expire(key, 10); // 10 second window

      // If same path accessed more than 20 times in 10 seconds, suspicious
      if (count > 20) {
        return true;
      }
    } catch {
      // Ignore Redis errors
    }
  }

  return false;
}

// =============================================================================
// IP MANAGEMENT
// =============================================================================

/**
 * Mark an IP as trusted (e.g., after authentication)
 */
export function markIpAsTrusted(ip: string): void {
  const info = ipTracking.get(ip);
  if (info) {
    info.reputation = 'trusted';
    info.violations = 0;
  } else {
    ipTracking.set(ip, {
      requestCount: 0,
      firstSeenAt: Date.now(),
      lastRequestAt: Date.now(),
      reputation: 'trusted',
      violations: 0,
    });
  }
}

/**
 * Manually block an IP (admin action)
 */
export async function blockIp(
  ip: string,
  durationSeconds: number = DDOS_THRESHOLDS.banDuration,
  reason: string = 'Manual block'
): Promise<void> {
  const now = Date.now();
  const info: IpTrackingInfo = {
    requestCount: 0,
    firstSeenAt: now,
    lastRequestAt: now,
    reputation: 'blocked',
    violations: 1,
    blockedUntil: now + durationSeconds * 1000,
  };

  ipTracking.set(ip, info);
  await persistIpBlock(ip, info);

  Sentry.captureMessage('IP manually blocked', {
    level: 'info',
    tags: { ip: maskIp(ip), reason },
  });
}

/**
 * Unblock an IP (admin action)
 */
export async function unblockIp(ip: string): Promise<void> {
  ipTracking.delete(ip);

  const redisClient = getRedis();
  if (redisClient) {
    try {
      await redisClient.del(`ddos:block:${hashIp(ip)}`);
    } catch {
      // Ignore
    }
  }
}

/**
 * Get current protection stats
 */
export function getProtectionStats(): {
  trackedIps: number;
  blockedIps: number;
  suspiciousIps: number;
} {
  let blocked = 0;
  let suspicious = 0;

  for (const info of ipTracking.values()) {
    if (info.reputation === 'blocked') blocked++;
    else if (info.reputation === 'suspicious') suspicious++;
  }

  return {
    trackedIps: ipTracking.size,
    blockedIps: blocked,
    suspiciousIps: suspicious,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Hash IP for storage (privacy)
 */
function hashIp(ip: string): string {
  // Simple hash for demo - use proper crypto in production
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Hash path for storage
 */
function hashPath(path: string): string {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Mask IP for logging (privacy)
 */
function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.substring(0, Math.min(ip.length, 10)) + '...';
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * DDoS protection middleware for API routes
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const ddosResponse = await ddosProtectionMiddleware(req);
 *   if (ddosResponse) return ddosResponse;
 *
 *   // Process request...
 * }
 * ```
 */
export async function ddosProtectionMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = req.headers.get('user-agent') || undefined;
  const path = req.nextUrl.pathname;

  // Check Redis for cross-instance blocks first
  if (await isIpBlockedInRedis(ip)) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Your IP has been temporarily blocked. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(DDOS_THRESHOLDS.tempBlockDuration),
          'X-DDoS-Protection': 'active',
        },
      }
    );
  }

  // Run local protection check
  const result = await checkDdosProtection(ip, userAgent, path);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: result.reason || 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter || 60),
          'X-DDoS-Protection': 'active',
          'X-IP-Reputation': result.reputation,
        },
      }
    );
  }

  // Add reputation header for debugging
  const response = NextResponse.next();
  response.headers.set('X-IP-Reputation', result.reputation);

  return null;
}
