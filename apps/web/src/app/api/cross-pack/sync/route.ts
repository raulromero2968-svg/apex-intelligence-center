/**
 * Cross-Pack Sync API Routes
 *
 * Resilient mobile-defense synchronization endpoints.
 * Implements cross-pack integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  resilientMobileSync,
  checkConnectionStatus,
  detectDdilCondition,
  getSyncHealthStatus,
  getPendingOperations,
  processQueue,
  type SyncDelta,
  type SyncConfig,
  DEFAULT_SYNC_CONFIG,
} from '@/lib/cross-pack';

/**
 * POST /api/cross-pack/sync
 * Execute sync operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync': {
        const { delta, config } = body as {
          delta: SyncDelta;
          config?: Partial<SyncConfig>;
        };

        if (!delta || !delta.table || !delta.operations) {
          return NextResponse.json(
            { error: 'Valid delta required with table and operations' },
            { status: 400 }
          );
        }

        const result = await resilientMobileSync(delta, {
          ...DEFAULT_SYNC_CONFIG,
          ...config,
        });

        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'process-queue': {
        const { config } = body as { config?: Partial<SyncConfig> };

        const result = await processQueue({
          ...DEFAULT_SYNC_CONFIG,
          ...config,
        });

        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'check-connection': {
        const status = await checkConnectionStatus();
        const ddilCondition = detectDdilCondition(status);

        return NextResponse.json({
          success: true,
          connection: status,
          ddil: ddilCondition,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sync, process-queue, or check-connection' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing sync request:', error);
    return NextResponse.json(
      { error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cross-pack/sync
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'health': {
        const health = getSyncHealthStatus();
        return NextResponse.json({
          success: true,
          health,
        });
      }

      case 'pending': {
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const pending = getPendingOperations(limit);

        return NextResponse.json({
          success: true,
          count: pending.length,
          operations: pending,
        });
      }

      case 'connection': {
        const status = await checkConnectionStatus();
        const ddilCondition = detectDdilCondition(status);

        return NextResponse.json({
          success: true,
          connection: status,
          ddil: ddilCondition,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: health, pending, or connection' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
