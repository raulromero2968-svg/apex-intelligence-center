/**
 * Liveness Probe Endpoint
 *
 * For Kubernetes/container orchestration liveness checks.
 * Returns 200 if the process is running.
 *
 * GET /api/health/live
 */

import { livenessHandler } from '@/lib/api-infrastructure/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return livenessHandler();
}
