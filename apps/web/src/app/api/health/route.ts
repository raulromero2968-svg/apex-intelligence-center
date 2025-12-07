/**
 * Health Check API Endpoint
 *
 * Provides comprehensive health checks for load balancers and monitoring.
 *
 * GET /api/health - Basic health check (fast, for load balancers)
 * GET /api/health?detailed=true - Detailed health with all metrics
 *
 * @see API Infrastructure Blueprint v1.0
 */

import { NextRequest } from 'next/server';
import {
  healthCheckHandler,
  livenessHandler,
  readinessHandler,
} from '@/lib/api-infrastructure/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Main health check endpoint
 *
 * Returns:
 * - 200: System is healthy or degraded (can still serve traffic)
 * - 503: System is unhealthy (should not receive traffic)
 */
export async function GET(req: NextRequest) {
  return healthCheckHandler(req);
}

/**
 * HEAD request for quick liveness check
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}
