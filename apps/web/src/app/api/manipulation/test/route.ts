/**
 * Manipulation Test API
 *
 * POST /api/manipulation/test - Trigger test manipulation alert with mock data
 * For development and testing only
 */

import { NextRequest, NextResponse } from 'next/server';
import { activateManipulationShield, ManipulationAlert } from '@/services/manipulation-detector';
import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      );
    }

    // Get card info
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    console.log(`[ManipulationTest] Creating test alert for ${card.name}`);

    // Create mock manipulation alert with high combined score
    // LAMP score: 70 (bullish) + Contrarian score: 85 (low diversity 0.15) = 155
    const mockAlert: ManipulationAlert = {
      cardId: card.id,
      cardName: card.name,
      volumeSpikePct: 85.5,
      baselineVolume: 12.3,
      currentVolume: 142,
      hasOrganicDrivers: false,
      lampSentiment: 'bullish',
      contrarianDiversity: 0.15, // Low diversity = suspected coordination
      combinedScore: 155, // Way above threshold of 75
      detectedAt: new Date(),
      severity: 'critical',
    };

    // Activate manipulation shield
    await activateManipulationShield(mockAlert);

    console.log(`[ManipulationTest] ✅ Test alert created and shield activated for ${card.name}`);

    return NextResponse.json(
      {
        success: true,
        message: `Test manipulation alert created for ${card.name}`,
        alert: mockAlert,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ManipulationTest] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      endpoint: '/api/manipulation/test',
      method: 'POST',
      description: 'Creates a test manipulation alert with mock pump data',
      environment: 'development only',
      body: {
        cardId: 'string (required)',
      },
      example: {
        cardId: 'clxxx...',
      },
    },
    { status: 200 }
  );
}
