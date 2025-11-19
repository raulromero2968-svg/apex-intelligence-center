/**
 * GET /api/cron/push-receipts
 * Temporary stub so the integration branch can deploy without Expo wiring.
 * The real implementation will land once push tickets + Expo receipts are ready.
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.info(
    '[cron/push-receipts] Skipping processing – Expo receipt polling is not configured in this environment.'
  );

  return NextResponse.json({
    success: true,
    processed: 0,
    delivered: 0,
    message: 'Push receipt polling is disabled until the Expo integration ships.',
  });
}

