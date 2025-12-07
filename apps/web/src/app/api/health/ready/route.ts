/**
 * Readiness Probe Endpoint
 *
 * For Kubernetes/container orchestration readiness checks.
 * Returns 200 if the service can accept traffic.
 *
 * GET /api/health/ready
 */

import { readinessHandler } from '@/lib/api-infrastructure/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return readinessHandler();
}
