/**
 * Edge Node API - Single Node Operations
 *
 * Endpoints for individual edge node management.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEdgeNodeWithEvents,
  updateEdgeNodeStatus,
  processHealthCheck,
  type NodeHealthCheck,
} from '@/lib/defense';

interface RouteParams {
  params: Promise<{ nodeId: string }>;
}

/**
 * GET /api/defense/edge-nodes/[nodeId]
 *
 * Get a single edge node with recent events
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { nodeId } = await params;
    const { searchParams } = new URL(request.url);
    const eventLimit = parseInt(searchParams.get('eventLimit') ?? '10', 10);

    const node = await getEdgeNodeWithEvents(nodeId, eventLimit);

    if (!node) {
      return NextResponse.json(
        { error: 'Edge node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Error fetching edge node:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edge node' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/defense/edge-nodes/[nodeId]
 *
 * Update edge node status and metrics
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();

    const update: Partial<{
      status: string;
      load: number;
      latencyMs: number;
      errorRate: number;
      anomalyScore: number;
    }> = {};

    if (body.status) update.status = body.status;
    if (typeof body.load === 'number') update.load = body.load;
    if (typeof body.latencyMs === 'number') update.latencyMs = body.latencyMs;
    if (typeof body.errorRate === 'number') update.errorRate = body.errorRate;
    if (typeof body.anomalyScore === 'number') update.anomalyScore = body.anomalyScore;

    const node = await updateEdgeNodeStatus(nodeId, update as any);

    if (!node) {
      return NextResponse.json(
        { error: 'Edge node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Error updating edge node:', error);
    return NextResponse.json(
      { error: 'Failed to update edge node' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/defense/edge-nodes/[nodeId]
 *
 * Submit a health check for the node
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();

    // Validate required health check fields
    if (
      typeof body.latencyMs !== 'number' ||
      typeof body.errorRate !== 'number' ||
      typeof body.load !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: latencyMs, errorRate, load' },
        { status: 400 }
      );
    }

    const healthCheck: NodeHealthCheck = {
      nodeId,
      status: body.status ?? 'online',
      latencyMs: body.latencyMs,
      errorRate: body.errorRate,
      load: body.load,
      timestamp: new Date(),
    };

    const node = await processHealthCheck(healthCheck);

    if (!node) {
      return NextResponse.json(
        { error: 'Edge node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Error processing health check:', error);
    return NextResponse.json(
      { error: 'Failed to process health check' },
      { status: 500 }
    );
  }
}
