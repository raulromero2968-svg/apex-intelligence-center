/**
 * GET /api/cron/update-prices
 * Placeholder implementation until Redis + watchlist infrastructure lands.
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
    '[cron/update-prices] Skipping execution – price alert infrastructure not configured yet.'
  );

  return NextResponse.json({
    success: true,
    stats: {
      pricesChecked: 0,
      alertsTriggered: 0,
      pushNotificationsSent: 0,
      durationMs: 0,
    },
    message: 'Price update cron is disabled until Redis/watchlist plumbing is available.',
  });
}

