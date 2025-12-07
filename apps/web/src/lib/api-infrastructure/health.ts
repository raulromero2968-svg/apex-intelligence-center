/**
 * Health Check Utilities
 *
 * Comprehensive health checks for API infrastructure including:
 * - Database connectivity and replication lag
 * - Redis connectivity
 * - External service health
 * - System resources
 *
 * @see API Infrastructure Blueprint v1.0
 */

import * as Sentry from '@sentry/nextjs';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import {
  checkDatabaseHealth,
  getConnectionPoolStats,
  type DatabaseHealth,
} from '../database-arch/antifragile';
import { getSessionStats } from './session-management';
import { getProtectionStats } from './ddos-protection';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Component health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Individual component health
 */
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  components: ComponentHealth[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

/**
 * Detailed health check result
 */
export interface DetailedHealthCheck extends SystemHealth {
  database: DatabaseHealth;
  redis: {
    connected: boolean;
    latencyMs: number;
  };
  sessions: {
    activeSessions: number;
    activeUsers: number;
  } | null;
  ddosProtection: {
    trackedIps: number;
    blockedIps: number;
    suspiciousIps: number;
  };
  connectionPool: {
    total: number;
    idle: number;
    waiting: number;
  };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'development';
const startTime = Date.now();

/**
 * Health check thresholds
 */
export const HEALTH_THRESHOLDS = {
  /** Database query latency warning threshold (ms) */
  dbLatencyWarning: 100,
  /** Database query latency critical threshold (ms) */
  dbLatencyCritical: 500,
  /** Redis latency warning threshold (ms) */
  redisLatencyWarning: 50,
  /** Redis latency critical threshold (ms) */
  redisLatencyCritical: 200,
  /** Replication lag warning threshold (bytes) */
  replicationLagWarning: 100 * 1024 * 1024, // 100MB
  /** Replication lag critical threshold (bytes) */
  replicationLagCritical: 1024 * 1024 * 1024, // 1GB
} as const;

// =============================================================================
// HEALTH CHECK FUNCTIONS
// =============================================================================

/**
 * Check database health
 */
async function checkDatabaseComponent(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Simple connectivity check
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - start;

    let status: HealthStatus = 'healthy';
    let message: string | undefined;

    if (latencyMs > HEALTH_THRESHOLDS.dbLatencyCritical) {
      status = 'unhealthy';
      message = `High latency: ${latencyMs}ms`;
    } else if (latencyMs > HEALTH_THRESHOLDS.dbLatencyWarning) {
      status = 'degraded';
      message = `Elevated latency: ${latencyMs}ms`;
    }

    return {
      name: 'database',
      status,
      latencyMs,
      message,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedisComponent(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return {
        name: 'redis',
        status: 'degraded',
        latencyMs: 0,
        message: 'Redis not configured',
      };
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    await redis.ping();
    const latencyMs = Date.now() - start;

    let status: HealthStatus = 'healthy';
    let message: string | undefined;

    if (latencyMs > HEALTH_THRESHOLDS.redisLatencyCritical) {
      status = 'unhealthy';
      message = `High latency: ${latencyMs}ms`;
    } else if (latencyMs > HEALTH_THRESHOLDS.redisLatencyWarning) {
      status = 'degraded';
      message = `Elevated latency: ${latencyMs}ms`;
    }

    return {
      name: 'redis',
      status,
      latencyMs,
      message,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

/**
 * Check database replication
 */
async function checkReplicationComponent(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    const dbHealth = await checkDatabaseHealth();
    const latencyMs = Date.now() - start;

    let status: HealthStatus = 'healthy';
    let message: string | undefined;
    const details: Record<string, unknown> = {};

    if (dbHealth.isInRecovery) {
      details.role = 'replica';
      if (dbHealth.replicationLag !== null) {
        details.lagBytes = dbHealth.replicationLag;
        if (dbHealth.replicationLag > HEALTH_THRESHOLDS.replicationLagCritical) {
          status = 'unhealthy';
          message = `Critical replication lag: ${formatBytes(dbHealth.replicationLag)}`;
        } else if (
          dbHealth.replicationLag > HEALTH_THRESHOLDS.replicationLagWarning
        ) {
          status = 'degraded';
          message = `Elevated replication lag: ${formatBytes(dbHealth.replicationLag)}`;
        }
      }
    } else {
      details.role = 'primary';
      details.replicaCount = dbHealth.replicas.length;

      // Check replica health
      for (const replica of dbHealth.replicas) {
        if (replica.state !== 'streaming') {
          status = 'degraded';
          message = `Replica ${replica.applicationName} not streaming`;
          break;
        }
      }
    }

    if (dbHealth.warnings.length > 0) {
      details.warnings = dbHealth.warnings;
    }

    return {
      name: 'replication',
      status,
      latencyMs,
      message,
      details,
    };
  } catch (error) {
    return {
      name: 'replication',
      status: 'degraded',
      latencyMs: Date.now() - start,
      message: 'Failed to check replication status',
    };
  }
}

// =============================================================================
// MAIN HEALTH CHECK
// =============================================================================

/**
 * Perform basic health check (fast, for load balancer)
 */
export async function checkBasicHealth(): Promise<{
  status: HealthStatus;
  latencyMs: number;
}> {
  const start = Date.now();

  try {
    // Quick database ping
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs < HEALTH_THRESHOLDS.dbLatencyCritical ? 'healthy' : 'degraded',
      latencyMs,
    };
  } catch {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function checkSystemHealth(): Promise<SystemHealth> {
  const components: ComponentHealth[] = await Promise.all([
    checkDatabaseComponent(),
    checkRedisComponent(),
    checkReplicationComponent(),
  ]);

  // Calculate summary
  const summary = {
    healthy: components.filter((c) => c.status === 'healthy').length,
    degraded: components.filter((c) => c.status === 'degraded').length,
    unhealthy: components.filter((c) => c.status === 'unhealthy').length,
  };

  // Determine overall status
  let status: HealthStatus = 'healthy';
  if (summary.unhealthy > 0) {
    status = 'unhealthy';
  } else if (summary.degraded > 0) {
    status = 'degraded';
  }

  // Log degraded/unhealthy to Sentry
  if (status !== 'healthy') {
    Sentry.addBreadcrumb({
      category: 'health',
      message: `System health: ${status}`,
      level: status === 'unhealthy' ? 'error' : 'warning',
      data: {
        summary,
        issues: components
          .filter((c) => c.status !== 'healthy')
          .map((c) => `${c.name}: ${c.message}`),
      },
    });
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    components,
    summary,
  };
}

/**
 * Perform detailed health check (includes all metrics)
 */
export async function checkDetailedHealth(): Promise<DetailedHealthCheck> {
  const [systemHealth, dbHealth, poolStats, sessionStats, ddosStats] =
    await Promise.all([
      checkSystemHealth(),
      checkDatabaseHealth(),
      getConnectionPoolStats(),
      getSessionStats(),
      Promise.resolve(getProtectionStats()),
    ]);

  // Check Redis connectivity separately for detailed info
  let redisLatency = 0;
  let redisConnected = false;
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const start = Date.now();
      await redis.ping();
      redisLatency = Date.now() - start;
      redisConnected = true;
    }
  } catch {
    redisConnected = false;
  }

  return {
    ...systemHealth,
    database: dbHealth,
    redis: {
      connected: redisConnected,
      latencyMs: redisLatency,
    },
    sessions: sessionStats,
    ddosProtection: ddosStats,
    connectionPool: poolStats,
  };
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check API handler
 *
 * GET /api/health - Basic health check
 * GET /api/health?detailed=true - Detailed health check
 */
export async function healthCheckHandler(
  req: NextRequest
): Promise<NextResponse> {
  const detailed = req.nextUrl.searchParams.get('detailed') === 'true';

  try {
    if (detailed) {
      const health = await checkDetailedHealth();
      return NextResponse.json(health, {
        status: health.status === 'unhealthy' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Health-Status': health.status,
        },
      });
    }

    const health = await checkSystemHealth();
    return NextResponse.json(health, {
      status: health.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Health-Status': health.status,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'health-check' },
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Health-Status': 'unhealthy',
        },
      }
    );
  }
}

/**
 * Liveness probe (for Kubernetes/container orchestration)
 */
export async function livenessHandler(): Promise<NextResponse> {
  // Just check if the process is running
  return NextResponse.json(
    { status: 'alive', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}

/**
 * Readiness probe (for Kubernetes/container orchestration)
 */
export async function readinessHandler(): Promise<NextResponse> {
  const { status, latencyMs } = await checkBasicHealth();

  return NextResponse.json(
    {
      status: status === 'healthy' ? 'ready' : 'not_ready',
      latencyMs,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === 'healthy' ? 200 : 503,
    }
  );
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
