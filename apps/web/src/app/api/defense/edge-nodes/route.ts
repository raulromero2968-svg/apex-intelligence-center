/**
 * Edge Nodes API
 *
 * Endpoints for managing and monitoring edge AI nodes.
 * Implements pack-ai-defense-001 §3.1 (Edge AI for DDIL resilience).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEdgeNodes,
  createEdgeNode,
  getNetworkHealthSummary,
  type NodeStatus,
} from '@/lib/defense';
import type { NewEdgeNode } from '@/db/schema/defense';

/**
 * GET /api/defense/edge-nodes
 *
 * Get all edge nodes with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as NodeStatus | null;
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      const healthSummary = await getNetworkHealthSummary();
      return NextResponse.json(healthSummary);
    }

    const nodes = await getEdgeNodes(status ?? undefined);
    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Error fetching edge nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edge nodes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/defense/edge-nodes
 *
 * Create a new edge node
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.region || !body.nodeType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, region, nodeType' },
        { status: 400 }
      );
    }

    const nodeData: NewEdgeNode = {
      name: body.name,
      region: body.region,
      nodeType: body.nodeType,
      endpoint: body.endpoint,
      status: body.status ?? 'offline',
      capabilities: body.capabilities ?? {},
    };

    const node = await createEdgeNode(nodeData);
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Error creating edge node:', error);
    return NextResponse.json(
      { error: 'Failed to create edge node' },
      { status: 500 }
    );
  }
}
