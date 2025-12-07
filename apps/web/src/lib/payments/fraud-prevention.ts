/**
 * Fraud Prevention Utilities
 *
 * Implements fraud detection and prevention for payments and RC economy:
 * - Stripe Radar integration for chargebacks
 * - Device fingerprinting
 * - Velocity checks for suspicious patterns
 * - Manual review queue for high-risk transactions
 *
 * References:
 * - Payment Infrastructure Plan Section 4: Fraud Prevention
 * - Ethical Safeguards Framework (transparency)
 */

import { redis } from '@/server/redis/client';
import { db } from '@/lib/db';
import { auditLogs } from '@apex/db/schema';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FRAUD_CONFIG = {
  /** Redis key prefix */
  KEY_PREFIX: 'fraud:',
  /** Velocity window in seconds */
  VELOCITY_WINDOW: 3600, // 1 hour
  /** Max transactions per hour per user */
  MAX_TRANSACTIONS_PER_HOUR: 10,
  /** Max RC earned per hour */
  MAX_RC_PER_HOUR: 50,
  /** Max failed payment attempts per hour */
  MAX_FAILED_PAYMENTS_PER_HOUR: 3,
  /** IP reputation cache TTL */
  IP_CACHE_TTL: 86400, // 24 hours
  /** Device fingerprint cache TTL */
  DEVICE_CACHE_TTL: 604800, // 7 days
  /** Minimum time between signups from same IP */
  MIN_SIGNUP_INTERVAL_MINUTES: 5,
  /** RC threshold for manual review */
  RC_MANUAL_REVIEW_THRESHOLD: 100,
};

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  factors: RiskFactor[];
  requiresReview: boolean;
  blocked: boolean;
  recommendations: string[];
}

export interface RiskFactor {
  type: string;
  description: string;
  weight: number; // Contribution to risk score
}

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  colorDepth?: number;
  hardwareConcurrency?: number;
  hash: string;
}

export interface FraudEvent {
  id: string;
  userId?: string;
  ipAddress: string;
  eventType: 'payment_failed' | 'chargeback' | 'suspicious_rc' | 'velocity_exceeded' | 'new_device';
  riskLevel: RiskLevel;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

// ============================================================================
// VELOCITY CHECKS
// ============================================================================

/**
 * Check transaction velocity for a user
 */
export async function checkTransactionVelocity(
  userId: string,
  transactionType: 'payment' | 'rc_earn' | 'rc_spend' | 'rc_transfer'
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const key = `${FRAUD_CONFIG.KEY_PREFIX}velocity:${userId}:${transactionType}`;

  try {
    const count = (await redis.get<number>(key)) || 0;
    const limit = transactionType === 'payment'
      ? FRAUD_CONFIG.MAX_TRANSACTIONS_PER_HOUR
      : FRAUD_CONFIG.MAX_RC_PER_HOUR;

    if (count >= limit) {
      // Log velocity exceeded
      await logFraudEvent({
        userId,
        eventType: 'velocity_exceeded',
        riskLevel: 'medium',
        details: { transactionType, count, limit },
      });

      return { allowed: false, count, limit };
    }

    // Increment counter
    await redis.incr(key);
    await redis.expire(key, FRAUD_CONFIG.VELOCITY_WINDOW);

    return { allowed: true, count: count + 1, limit };
  } catch (error) {
    console.error('[FRAUD] Error checking velocity:', error);
    // Fail open for UX
    return { allowed: true, count: 0, limit: FRAUD_CONFIG.MAX_TRANSACTIONS_PER_HOUR };
  }
}

/**
 * Check failed payment velocity
 */
export async function checkFailedPaymentVelocity(
  userId: string,
  ipAddress: string
): Promise<{ allowed: boolean; userAttempts: number; ipAttempts: number }> {
  const userKey = `${FRAUD_CONFIG.KEY_PREFIX}failed:user:${userId}`;
  const ipKey = `${FRAUD_CONFIG.KEY_PREFIX}failed:ip:${ipAddress}`;

  try {
    const [userAttempts, ipAttempts] = await Promise.all([
      redis.get<number>(userKey) || 0,
      redis.get<number>(ipKey) || 0,
    ]);

    const userLimit = FRAUD_CONFIG.MAX_FAILED_PAYMENTS_PER_HOUR;
    const ipLimit = FRAUD_CONFIG.MAX_FAILED_PAYMENTS_PER_HOUR * 2; // More lenient for IP

    if (userAttempts >= userLimit || ipAttempts >= ipLimit) {
      return { allowed: false, userAttempts, ipAttempts };
    }

    return { allowed: true, userAttempts, ipAttempts };
  } catch (error) {
    console.error('[FRAUD] Error checking failed payment velocity:', error);
    return { allowed: true, userAttempts: 0, ipAttempts: 0 };
  }
}

/**
 * Record a failed payment attempt
 */
export async function recordFailedPayment(
  userId: string,
  ipAddress: string,
  reason: string
): Promise<void> {
  const userKey = `${FRAUD_CONFIG.KEY_PREFIX}failed:user:${userId}`;
  const ipKey = `${FRAUD_CONFIG.KEY_PREFIX}failed:ip:${ipAddress}`;

  try {
    await Promise.all([
      redis.incr(userKey),
      redis.expire(userKey, FRAUD_CONFIG.VELOCITY_WINDOW),
      redis.incr(ipKey),
      redis.expire(ipKey, FRAUD_CONFIG.VELOCITY_WINDOW),
    ]);

    await logFraudEvent({
      userId,
      ipAddress,
      eventType: 'payment_failed',
      riskLevel: 'low',
      details: { reason },
    });
  } catch (error) {
    console.error('[FRAUD] Error recording failed payment:', error);
  }
}

// ============================================================================
// DEVICE FINGERPRINTING
// ============================================================================

/**
 * Generate device fingerprint hash
 */
export function generateFingerprintHash(fingerprint: Omit<DeviceFingerprint, 'hash'>): string {
  const data = JSON.stringify({
    ua: fingerprint.userAgent,
    sr: fingerprint.screenResolution,
    tz: fingerprint.timezone,
    lang: fingerprint.language,
    cd: fingerprint.colorDepth,
    hc: fingerprint.hardwareConcurrency,
  });

  // Simple hash (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if device is known for user
 */
export async function checkKnownDevice(
  userId: string,
  fingerprint: DeviceFingerprint
): Promise<{ isKnown: boolean; isNew: boolean; deviceCount: number }> {
  const key = `${FRAUD_CONFIG.KEY_PREFIX}devices:${userId}`;

  try {
    const knownDevices = await redis.smembers(key);
    const isKnown = knownDevices.includes(fingerprint.hash);

    if (!isKnown) {
      // Add new device
      await redis.sadd(key, fingerprint.hash);
      await redis.expire(key, FRAUD_CONFIG.DEVICE_CACHE_TTL);

      // Log new device (for first-time setup, this is normal)
      if (knownDevices.length > 0) {
        await logFraudEvent({
          userId,
          eventType: 'new_device',
          riskLevel: 'low',
          details: {
            fingerprintHash: fingerprint.hash,
            deviceCount: knownDevices.length + 1,
          },
        });
      }
    }

    return {
      isKnown,
      isNew: !isKnown,
      deviceCount: knownDevices.length + (isKnown ? 0 : 1),
    };
  } catch (error) {
    console.error('[FRAUD] Error checking device:', error);
    return { isKnown: true, isNew: false, deviceCount: 1 };
  }
}

// ============================================================================
// IP REPUTATION
// ============================================================================

interface IpReputation {
  score: number; // 0-100 (higher = more trustworthy)
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  country: string;
  risk: RiskLevel;
}

/**
 * Check IP reputation (cached)
 */
export async function checkIpReputation(ipAddress: string): Promise<IpReputation> {
  const cacheKey = `${FRAUD_CONFIG.KEY_PREFIX}ip:${ipAddress}`;

  try {
    // Check cache first
    const cached = await redis.get<IpReputation>(cacheKey);
    if (cached) {
      return cached;
    }

    // In production, call external IP reputation service
    // For now, return a basic assessment
    const reputation: IpReputation = {
      score: 70,
      isProxy: false,
      isVpn: false,
      isTor: false,
      isDatacenter: false,
      country: 'US',
      risk: 'low',
    };

    // Cache result
    await redis.set(cacheKey, reputation, { ex: FRAUD_CONFIG.IP_CACHE_TTL });

    return reputation;
  } catch (error) {
    console.error('[FRAUD] Error checking IP reputation:', error);
    return {
      score: 50,
      isProxy: false,
      isVpn: false,
      isTor: false,
      isDatacenter: false,
      country: 'unknown',
      risk: 'medium',
    };
  }
}

/**
 * Check for multiple signups from same IP
 */
export async function checkSignupVelocity(ipAddress: string): Promise<{
  allowed: boolean;
  recentSignups: number;
}> {
  const key = `${FRAUD_CONFIG.KEY_PREFIX}signups:${ipAddress}`;

  try {
    const recentSignups = (await redis.get<number>(key)) || 0;
    const ttl = FRAUD_CONFIG.MIN_SIGNUP_INTERVAL_MINUTES * 60;

    if (recentSignups > 0) {
      return { allowed: false, recentSignups };
    }

    // Record this signup
    await redis.set(key, 1, { ex: ttl });

    return { allowed: true, recentSignups: 0 };
  } catch (error) {
    console.error('[FRAUD] Error checking signup velocity:', error);
    return { allowed: true, recentSignups: 0 };
  }
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Perform comprehensive risk assessment
 */
export async function assessRisk(
  userId: string,
  ipAddress: string,
  transactionType: string,
  amount: number,
  fingerprint?: DeviceFingerprint
): Promise<RiskAssessment> {
  const factors: RiskFactor[] = [];
  let score = 0;

  try {
    // Check IP reputation
    const ipRep = await checkIpReputation(ipAddress);
    if (ipRep.isProxy || ipRep.isVpn) {
      factors.push({
        type: 'proxy_vpn',
        description: 'Connection through proxy or VPN detected',
        weight: 15,
      });
      score += 15;
    }
    if (ipRep.isTor) {
      factors.push({
        type: 'tor',
        description: 'Connection through Tor network',
        weight: 25,
      });
      score += 25;
    }
    if (ipRep.isDatacenter) {
      factors.push({
        type: 'datacenter',
        description: 'Connection from datacenter IP',
        weight: 10,
      });
      score += 10;
    }

    // Check velocity
    const velocity = await checkTransactionVelocity(userId, transactionType as any);
    if (velocity.count > velocity.limit * 0.5) {
      factors.push({
        type: 'high_velocity',
        description: `High transaction frequency: ${velocity.count}/${velocity.limit}`,
        weight: 20,
      });
      score += 20;
    }

    // Check device
    if (fingerprint) {
      const device = await checkKnownDevice(userId, fingerprint);
      if (device.isNew && device.deviceCount > 3) {
        factors.push({
          type: 'many_devices',
          description: `User has ${device.deviceCount} devices registered`,
          weight: 15,
        });
        score += 15;
      }
    }

    // Check amount thresholds
    if (transactionType.includes('rc') && amount > FRAUD_CONFIG.RC_MANUAL_REVIEW_THRESHOLD) {
      factors.push({
        type: 'high_amount',
        description: `Transaction amount ${amount} exceeds review threshold`,
        weight: 10,
      });
      score += 10;
    }

    // Determine risk level
    let level: RiskLevel;
    if (score >= 60) level = 'critical';
    else if (score >= 40) level = 'high';
    else if (score >= 20) level = 'medium';
    else level = 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    if (level === 'high' || level === 'critical') {
      recommendations.push('Manual review recommended');
      recommendations.push('Consider additional verification');
    }
    if (factors.some(f => f.type === 'proxy_vpn' || f.type === 'tor')) {
      recommendations.push('Request 2FA verification');
    }

    return {
      level,
      score,
      factors,
      requiresReview: score >= 40,
      blocked: score >= 80,
      recommendations,
    };
  } catch (error) {
    console.error('[FRAUD] Error assessing risk:', error);
    Sentry.captureException(error, {
      tags: { component: 'fraud-prevention' },
    });

    return {
      level: 'low',
      score: 0,
      factors: [],
      requiresReview: false,
      blocked: false,
      recommendations: [],
    };
  }
}

// ============================================================================
// FRAUD EVENT LOGGING
// ============================================================================

interface LogFraudEventParams {
  userId?: string;
  ipAddress?: string;
  eventType: FraudEvent['eventType'];
  riskLevel: RiskLevel;
  details: Record<string, unknown>;
}

/**
 * Log fraud event for audit and analysis
 */
async function logFraudEvent(params: LogFraudEventParams): Promise<void> {
  try {
    // Log to audit table
    await db.insert(auditLogs).values({
      actionType: 'fraud_event',
      severity: params.riskLevel === 'critical' ? 'critical' : params.riskLevel === 'high' ? 'high' : 'medium',
      userId: params.userId,
      metadata: {
        eventType: params.eventType,
        riskLevel: params.riskLevel,
        ipAddress: params.ipAddress,
        ...params.details,
        timestamp: new Date().toISOString(),
      },
    });

    // Log to Sentry for high-risk events
    if (params.riskLevel === 'high' || params.riskLevel === 'critical') {
      Sentry.captureMessage(`Fraud event: ${params.eventType}`, {
        level: params.riskLevel === 'critical' ? 'error' : 'warning',
        tags: {
          component: 'fraud-prevention',
          eventType: params.eventType,
          riskLevel: params.riskLevel,
        },
        extra: params.details,
      });
    }

    console.log(`[FRAUD_EVENT] ${params.eventType}:`, {
      userId: params.userId,
      riskLevel: params.riskLevel,
      ...params.details,
    });
  } catch (error) {
    console.error('[FRAUD] Error logging fraud event:', error);
  }
}

/**
 * Record chargeback event (from Stripe webhook)
 */
export async function recordChargeback(
  userId: string,
  paymentId: string,
  amount: number,
  reason?: string
): Promise<void> {
  await logFraudEvent({
    userId,
    eventType: 'chargeback',
    riskLevel: 'high',
    details: {
      paymentId,
      amount,
      reason,
    },
  });

  // Additional actions for chargebacks could go here:
  // - Flag account for review
  // - Adjust RC balance
  // - Notify support team
}

// ============================================================================
// MANUAL REVIEW QUEUE
// ============================================================================

/**
 * Add transaction to manual review queue
 */
export async function addToReviewQueue(
  transactionId: string,
  transactionType: string,
  userId: string,
  risk: RiskAssessment
): Promise<void> {
  const key = `${FRAUD_CONFIG.KEY_PREFIX}review:queue`;

  const reviewItem = {
    transactionId,
    transactionType,
    userId,
    riskLevel: risk.level,
    riskScore: risk.score,
    factors: risk.factors.map(f => f.type),
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  try {
    await redis.lpush(key, JSON.stringify(reviewItem));
    console.log(`[FRAUD] Added to review queue: ${transactionId}`);
  } catch (error) {
    console.error('[FRAUD] Error adding to review queue:', error);
  }
}

/**
 * Get pending review items
 */
export async function getReviewQueue(limit: number = 50): Promise<Array<Record<string, unknown>>> {
  const key = `${FRAUD_CONFIG.KEY_PREFIX}review:queue`;

  try {
    const items = await redis.lrange(key, 0, limit - 1);
    return items.map(item => JSON.parse(item as string));
  } catch (error) {
    console.error('[FRAUD] Error getting review queue:', error);
    return [];
  }
}
