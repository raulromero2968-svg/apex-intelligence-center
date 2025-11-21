/**
 * Manipulation Scan API
 *
 * POST /api/manipulation/scan - Trigger manipulation detection scan
 * Can be called by cron jobs or manually for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanAllCardsForManipulation } from '@/services/manipulation-detector';
import { activateManipulationShield } from '@/services/manipulation-shield.service';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[ManipulationScan] Starting scan...');

    // Scan all cards for manipulation
    const detections = await scanAllCardsForManipulation();

    console.log(`[ManipulationScan] Found ${detections.length} manipulations`);

    // Activate shield for each detected manipulation
    const results = [];
    for (const detection of detections) {
      const shieldResult = await activateManipulationShield(detection.cardId);
      results.push({
        cardId: detection.cardId,
        cardName: detection.cardName,
        volumeSpikePct: detection.volumeSpikePct,
        severity: detection.severity,
        shieldActivated: shieldResult.success,
      });
    }

    return NextResponse.json(
      {
        success: true,
        detectionsCount: detections.length,
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ManipulationScan] Scan failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scan status
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      endpoint: '/api/manipulation/scan',
      method: 'POST',
      description: 'Triggers manipulation detection scan across all cards',
      auth: 'Bearer token required (CRON_SECRET)',
    },
    { status: 200 }
  );
}
