/**
 * CUA Agents API
 *
 * Endpoints for managing computer-using agents.
 * Implements pack-cua-001 §2.1 (Agent Preview Panel).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAgent,
  createAgentFromTemplate,
  getUserAgents,
  updateAgent,
  deleteAgent,
  mapGoalToActions,
  AGENT_TEMPLATES,
  DEFAULT_CAPABILITIES,
  DEFAULT_RUNTIME_CONFIG,
} from '@/lib/cua';
import { db } from '@/lib/db';
import { cuaAgents } from '@/db/schema/cua';
import { eq, or, desc } from 'drizzle-orm';

/**
 * GET /api/cua/agents
 *
 * List CUA agents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const userId = searchParams.get('userId');
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        if (userId) {
          const agents = await getUserAgents(userId);
          return NextResponse.json({ agents });
        }

        // Return public agents
        const agents = await db
          .select()
          .from(cuaAgents)
          .where(eq(cuaAgents.isPublic, true))
          .orderBy(desc(cuaAgents.createdAt))
          .limit(limit)
          .execute();

        return NextResponse.json({ agents });
      }

      case 'get': {
        if (!agentId) {
          return NextResponse.json(
            { error: 'Missing required parameter: agentId' },
            { status: 400 }
          );
        }

        const [agent] = await db
          .select()
          .from(cuaAgents)
          .where(eq(cuaAgents.id, agentId))
          .limit(1)
          .execute();

        if (!agent) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json({ agent });
      }

      case 'templates': {
        const templates = Object.entries(AGENT_TEMPLATES).map(([id, template]) => ({
          id,
          name: template.name,
          description: template.description,
          type: template.agentType,
          provider: template.modelProvider,
        }));

        return NextResponse.json({ templates });
      }

      case 'defaults': {
        return NextResponse.json({
          capabilities: DEFAULT_CAPABILITIES,
          runtimeConfig: DEFAULT_RUNTIME_CONFIG,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, get, templates, defaults` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

/**
 * POST /api/cua/agents
 *
 * Create a new agent or perform agent actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const agent = await createAgent({
          name: body.name,
          description: body.description,
          ownerId: body.ownerId,
          isPublic: body.isPublic ?? false,
          agentType: body.agentType ?? 'cloud',
          modelProvider: body.modelProvider ?? 'anthropic',
          modelId: body.modelId,
          capabilities: body.capabilities,
          runtimeConfig: body.runtimeConfig,
          privacyConfig: body.privacyConfig,
          tags: body.tags ?? [],
        });

        return NextResponse.json({ agent }, { status: 201 });
      }

      case 'from-template': {
        if (!body.templateId) {
          return NextResponse.json(
            { error: 'Missing required field: templateId' },
            { status: 400 }
          );
        }

        const agent = await createAgentFromTemplate(body.templateId, {
          name: body.name,
          ownerId: body.ownerId,
        });

        return NextResponse.json({ agent }, { status: 201 });
      }

      case 'map-goal': {
        // Map a user goal to agent actions
        if (!body.goal) {
          return NextResponse.json(
            { error: 'Missing required field: goal' },
            { status: 400 }
          );
        }

        const actions = mapGoalToActions(body.goal, {
          targetUrl: body.targetUrl,
          currentPage: body.currentPage,
          availableElements: body.availableElements,
        });

        return NextResponse.json({ actions, goal: body.goal });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, from-template, map-goal` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

/**
 * PATCH /api/cua/agents
 *
 * Update an agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updated = await updateAgent(body.id, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic,
      agentType: body.agentType,
      modelProvider: body.modelProvider,
      modelId: body.modelId,
      capabilities: body.capabilities,
      runtimeConfig: body.runtimeConfig,
      privacyConfig: body.privacyConfig,
      status: body.status,
      tags: body.tags,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

/**
 * DELETE /api/cua/agents
 *
 * Delete an agent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const deleted = await deleteAgent(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
