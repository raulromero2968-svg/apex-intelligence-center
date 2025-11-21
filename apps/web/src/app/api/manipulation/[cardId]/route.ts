/**
 * Manipulation Alert API
 *
 * GET /api/manipulation/[cardId] - Check for active manipulation alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { manipulationAlerts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const { cardId } = params;

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    // Get the most recent active manipulation alert for this card
    const activeAlert = await db.query.manipulationAlerts.findFirst({
      where: and(
        eq(manipulationAlerts.cardId, cardId),
        eq(manipulationAlerts.isActive, true)
      ),
      orderBy: desc(manipulationAlerts.detectedAt),
    });

    if (!activeAlert) {
      return NextResponse.json(
        { hasAlert: false, alert: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hasAlert: true,
        alert: activeAlert,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ManipulationAPI] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
