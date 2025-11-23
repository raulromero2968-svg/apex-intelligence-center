/**
 * Push Receipt Validation Cron Job
 *
 * Vercel Cron endpoint - runs every 15 minutes
 * Validates push notification receipts and retries failed deliveries
 *
 * Configured via vercel.json crons array
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import { validateAndRetryReceipts } from '@/lib/push';
import * as Sentry from '@sentry/nextjs';

/**
 * GET /api/cron/push-receipts
 * Validates receipts and processes retry queue
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const transaction = Sentry.startTransaction({
    name: 'cron.push-receipts',
    op: 'cron',
  });

  try {
    console.log('[Cron] Starting push receipt validation...');

    const stats = await validateAndRetryReceipts();

    console.log('[Cron] Push receipt validation complete:', stats);

    transaction.setData('stats', stats);
    transaction.setStatus('ok');

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Push receipt validation failed:', error);

    Sentry.captureException(error, {
      tags: { cron: 'push-receipts' },
    });

    transaction.setStatus('internal_error');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    transaction.finish();
  }
}

// Allow manual triggers via POST (for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
