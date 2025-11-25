/**
 * Threat Detection API
 *
 * Endpoints for threat detection and management.
 * Implements pack-ai-defense-001 §3.4 (Cybersecurity patterns).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  detectThreats,
  recordThreatEvent,
  getActiveThreats,
  getThreatSummary,
  getNetworkGraph,
  type ThreatSeverity,
  type ThreatType,
} from '@/lib/defense';

/**
 * GET /api/defense/threats
 *
 * Get threats and threat analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'active';
    const severity = searchParams.get('severity') as ThreatSeverity | undefined;
    const threatType = searchParams.get('type') as ThreatType | undefined;
    const days = parseInt(searchParams.get('days') ?? '7', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'active': {
        const threats = await getActiveThreats({
          severity,
          threatType,
          limit,
        });

        return NextResponse.json({ threats });
      }

      case 'summary': {
        const summary = await getThreatSummary(days);
        return NextResponse.json({ summary });
      }

      case 'network': {
        const nodeTypes = searchParams.get('nodeTypes')?.split(',') as any[] | undefined;
        const threatLevels = searchParams.get('threatLevels')?.split(',') as any[] | undefined;

        const graph = await getNetworkGraph({
          nodeTypes,
          threatLevels,
          limit,
        });

        return NextResponse.json({ graph });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: active, summary, network` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in threat detection:', error);
    return NextResponse.json(
      { error: 'Failed to process threat detection request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/defense/threats
 *
 * Analyze data for threats and record detected threats
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'detect';

    switch (action) {
      case 'detect': {
        // Run threat detection on provided data
        const detections = await detectThreats({
          cardId: body.cardId,
          volumeData: body.volumeData,
          priceData: body.priceData,
          transactionData: body.transactionData,
          accountData: body.accountData,
        });

        // Optionally record detected threats
        if (body.record && detections.length > 0) {
          const recorded = [];
          for (const detection of detections) {
            const event = await recordThreatEvent(
              detection,
              body.affectedNodeIds ?? [],
              body.cardId ? [body.cardId] : []
            );
            recorded.push(event);
          }
          return NextResponse.json({ detections, recorded }, { status: 201 });
        }

        return NextResponse.json({ detections });
      }

      case 'record': {
        // Manually record a threat event
        if (!body.threatType || !body.description) {
          return NextResponse.json(
            { error: 'Missing required fields: threatType, description' },
            { status: 400 }
          );
        }

        const event = await recordThreatEvent(
          {
            threatType: body.threatType,
            confidence: body.confidence ?? 0.5,
            severity: body.severity ?? 'medium',
            description: body.description,
            indicators: body.indicators ?? {},
            suggestedActions: body.suggestedActions ?? [],
          },
          body.affectedNodeIds ?? [],
          body.affectedCardIds ?? []
        );

        return NextResponse.json({ event }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: detect, record` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in threat detection:', error);
    return NextResponse.json(
      { error: 'Failed to process threat detection request' },
      { status: 500 }
    );
  }
}
