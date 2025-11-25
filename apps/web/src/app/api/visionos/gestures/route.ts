/**
 * Gesture Bindings API
 *
 * Endpoints for managing gesture-to-action bindings.
 * Implements pack-visionos-001 §2.2 (Gesture Binding) and §3.2 (Spatial Intent Tool).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createGestureBinding,
  getSceneBindings,
  getGlobalBindings,
  updateGestureBinding,
  deleteGestureBinding,
  initializeTCGBindings,
  interpretGestureIntent,
  type GestureInput,
} from '@/lib/visionos';
import { db } from '@/lib/db';
import { gestureBindings } from '@/db/schema/visionos';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/visionos/gestures
 *
 * List gesture bindings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const sceneId = searchParams.get('sceneId');
    const gestureType = searchParams.get('gestureType');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        let bindings;
        if (sceneId) {
          bindings = await getSceneBindings(sceneId);
        } else {
          bindings = await getGlobalBindings();
        }

        // Filter by gesture type if specified
        if (gestureType) {
          bindings = bindings.filter((b) => b.gestureType === gestureType);
        }

        return NextResponse.json({ bindings: bindings.slice(0, limit) });
      }

      case 'global': {
        const bindings = await getGlobalBindings();
        return NextResponse.json({ bindings });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, global` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching gesture bindings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gesture bindings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visionos/gestures
 *
 * Create gesture binding or interpret gesture intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        if (!body.name || !body.gestureType || !body.actionType) {
          return NextResponse.json(
            { error: 'Missing required fields: name, gestureType, actionType' },
            { status: 400 }
          );
        }

        const binding = await createGestureBinding({
          name: body.name,
          description: body.description,
          ownerId: body.ownerId,
          sceneId: body.sceneId,
          gestureType: body.gestureType,
          gestureParams: body.gestureParams,
          targetSpec: body.targetSpec,
          actionType: body.actionType,
          actionParams: body.actionParams,
          feedbackConfig: body.feedbackConfig,
          conditions: body.conditions,
          priority: body.priority ?? 0,
          isEnabled: body.isEnabled ?? true,
          isGlobal: body.isGlobal ?? false,
        });

        return NextResponse.json({ binding }, { status: 201 });
      }

      case 'init-tcg': {
        // Initialize default TCG bindings for a scene
        if (!body.sceneId) {
          return NextResponse.json(
            { error: 'Missing required field: sceneId' },
            { status: 400 }
          );
        }

        const bindings = await initializeTCGBindings(body.sceneId, body.ownerId);
        return NextResponse.json({
          bindings,
          message: `Initialized ${bindings.length} TCG gesture bindings`,
        });
      }

      case 'interpret': {
        // Interpret a gesture input to determine intent
        if (!body.gesture) {
          return NextResponse.json(
            { error: 'Missing required field: gesture' },
            { status: 400 }
          );
        }

        const gestureInput: GestureInput = {
          type: body.gesture.type,
          timestamp: body.gesture.timestamp ?? Date.now(),
          confidence: body.gesture.confidence ?? 1.0,
          gazeTarget: body.gesture.gazeTarget,
          gazeEntityId: body.gesture.gazeEntityId,
          gazeDuration: body.gesture.gazeDuration,
          hand: body.gesture.hand,
          handPosition: body.gesture.handPosition,
          pinchStrength: body.gesture.pinchStrength,
        };

        const intent = await interpretGestureIntent(
          gestureInput,
          body.sceneId,
          body.entityContext
        );

        if (intent) {
          return NextResponse.json({ intent });
        }

        return NextResponse.json({
          intent: null,
          message: 'No matching binding found for gesture',
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, init-tcg, interpret` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing gesture request:', error);
    return NextResponse.json(
      { error: 'Failed to process gesture request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/visionos/gestures
 *
 * Update a gesture binding
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

    const updated = await updateGestureBinding(body.id, {
      name: body.name,
      description: body.description,
      gestureType: body.gestureType,
      gestureParams: body.gestureParams,
      targetSpec: body.targetSpec,
      actionType: body.actionType,
      actionParams: body.actionParams,
      feedbackConfig: body.feedbackConfig,
      conditions: body.conditions,
      priority: body.priority,
      isEnabled: body.isEnabled,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Gesture binding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ binding: updated });
  } catch (error) {
    console.error('Error updating gesture binding:', error);
    return NextResponse.json(
      { error: 'Failed to update gesture binding' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/visionos/gestures
 *
 * Delete a gesture binding
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

    const deleted = await deleteGestureBinding(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Gesture binding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gesture binding:', error);
    return NextResponse.json(
      { error: 'Failed to delete gesture binding' },
      { status: 500 }
    );
  }
}
