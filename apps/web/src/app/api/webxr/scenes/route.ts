/**
 * WebXR Scenes API
 *
 * Endpoints for managing XR scenes and objects.
 * Implements pack-webxr-001 §3.2 (3D Scene Builder).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createScene,
  createSceneFromTemplate,
  getScene,
  getSceneWithObjects,
  getUserScenes,
  updateScene,
  deleteScene,
  incrementSceneViews,
  createSceneObject,
  getSceneObject,
  updateSceneObject,
  updateObjectTransform,
  deleteSceneObject,
  reorderSceneObjects,
  createInteraction,
  getSceneInteractions,
  getObjectInteractions,
  updateInteraction,
  deleteInteraction,
  generateThreeJsSceneCode,
  SCENE_TEMPLATES,
} from '@/lib/webxr';

/**
 * GET /api/webxr/scenes
 *
 * Get scenes, objects, or interactions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const sceneId = searchParams.get('sceneId');
    const objectId = searchParams.get('objectId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing required parameter: userId' },
            { status: 400 }
          );
        }

        const scenes = await getUserScenes(userId, { limit });
        return NextResponse.json({ scenes });
      }

      case 'get': {
        if (!sceneId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sceneId' },
            { status: 400 }
          );
        }

        const scene = await getScene(sceneId);
        if (!scene) {
          return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
        }

        return NextResponse.json({ scene });
      }

      case 'get-with-objects': {
        if (!sceneId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sceneId' },
            { status: 400 }
          );
        }

        const result = await getSceneWithObjects(sceneId);
        if (!result) {
          return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
        }

        return NextResponse.json(result);
      }

      case 'get-object': {
        if (!objectId) {
          return NextResponse.json(
            { error: 'Missing required parameter: objectId' },
            { status: 400 }
          );
        }

        const object = await getSceneObject(objectId);
        if (!object) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }

        return NextResponse.json({ object });
      }

      case 'interactions': {
        if (objectId) {
          const interactions = await getObjectInteractions(objectId);
          return NextResponse.json({ interactions });
        } else if (sceneId) {
          const interactions = await getSceneInteractions(sceneId);
          return NextResponse.json({ interactions });
        } else {
          return NextResponse.json(
            { error: 'Missing required parameter: sceneId or objectId' },
            { status: 400 }
          );
        }
      }

      case 'templates': {
        const templates = Object.entries(SCENE_TEMPLATES).map(([id, template]) => ({
          id,
          name: template.name,
          description: template.description,
          sceneType: template.sceneType,
        }));
        return NextResponse.json({ templates });
      }

      case 'generate-code': {
        if (!sceneId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sceneId' },
            { status: 400 }
          );
        }

        const result = await getSceneWithObjects(sceneId);
        if (!result) {
          return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
        }

        const code = generateThreeJsSceneCode(result.scene, result.objects);
        return NextResponse.json({ code });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, get-with-objects, get-object, interactions, templates, generate-code`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 });
  }
}

/**
 * POST /api/webxr/scenes
 *
 * Create scenes, objects, or interactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create-scene';

    switch (action) {
      case 'create-scene': {
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const scene = await createScene({
          name: body.name,
          description: body.description,
          userId: body.userId,
          sceneType: body.sceneType ?? 'environment',
          engine: body.engine ?? 'threejs',
          supportedModes: body.supportedModes ?? ['inline'],
          settings: body.settings,
          cameraConfig: body.cameraConfig,
          lightingConfig: body.lightingConfig,
          performanceConfig: body.performanceConfig,
        });

        return NextResponse.json({ scene }, { status: 201 });
      }

      case 'create-from-template': {
        if (!body.templateId || !body.name) {
          return NextResponse.json(
            { error: 'Missing required fields: templateId, name' },
            { status: 400 }
          );
        }

        const scene = await createSceneFromTemplate(body.templateId, {
          name: body.name,
          userId: body.userId,
          description: body.description,
        });

        return NextResponse.json({ scene }, { status: 201 });
      }

      case 'create-object': {
        if (!body.sceneId || !body.name || !body.objectType) {
          return NextResponse.json(
            { error: 'Missing required fields: sceneId, name, objectType' },
            { status: 400 }
          );
        }

        const object = await createSceneObject({
          sceneId: body.sceneId,
          assetId: body.assetId,
          name: body.name,
          objectType: body.objectType,
          position: body.position ?? [0, 0, 0],
          rotation: body.rotation ?? [0, 0, 0],
          scale: body.scale ?? [1, 1, 1],
          visible: body.visible ?? true,
          isInteractable: body.isInteractable ?? false,
          interactionConfig: body.interactionConfig,
          physicsEnabled: body.physicsEnabled ?? false,
          physicsConfig: body.physicsConfig,
          materialConfig: body.materialConfig,
          animations: body.animations,
          userData: body.userData,
        });

        return NextResponse.json({ object }, { status: 201 });
      }

      case 'create-interaction': {
        if (!body.name || !body.inputType || !body.actionType) {
          return NextResponse.json(
            { error: 'Missing required fields: name, inputType, actionType' },
            { status: 400 }
          );
        }

        const interaction = await createInteraction({
          sceneId: body.sceneId,
          objectId: body.objectId,
          name: body.name,
          description: body.description,
          inputType: body.inputType,
          inputConfig: body.inputConfig,
          actionType: body.actionType,
          actionConfig: body.actionConfig,
          feedbackConfig: body.feedbackConfig,
          conditions: body.conditions,
          priority: body.priority ?? 0,
          isEnabled: body.isEnabled ?? true,
        });

        return NextResponse.json({ interaction }, { status: 201 });
      }

      case 'increment-views': {
        if (!body.sceneId) {
          return NextResponse.json(
            { error: 'Missing required field: sceneId' },
            { status: 400 }
          );
        }

        await incrementSceneViews(body.sceneId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: create-scene, create-from-template, create-object, create-interaction, increment-views`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating scene/object:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

/**
 * PATCH /api/webxr/scenes
 *
 * Update scenes, objects, or interactions
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updateType = body.updateType ?? 'scene';

    switch (updateType) {
      case 'scene': {
        if (!body.sceneId) {
          return NextResponse.json(
            { error: 'Missing required field: sceneId' },
            { status: 400 }
          );
        }

        const scene = await updateScene(body.sceneId, {
          name: body.name,
          description: body.description,
          sceneType: body.sceneType,
          supportedModes: body.supportedModes,
          settings: body.settings,
          cameraConfig: body.cameraConfig,
          lightingConfig: body.lightingConfig,
          performanceConfig: body.performanceConfig,
          isPublished: body.isPublished,
        });

        if (!scene) {
          return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
        }

        return NextResponse.json({ scene });
      }

      case 'object': {
        if (!body.objectId) {
          return NextResponse.json(
            { error: 'Missing required field: objectId' },
            { status: 400 }
          );
        }

        const object = await updateSceneObject(body.objectId, {
          name: body.name,
          visible: body.visible,
          isInteractable: body.isInteractable,
          interactionConfig: body.interactionConfig,
          physicsEnabled: body.physicsEnabled,
          physicsConfig: body.physicsConfig,
          materialConfig: body.materialConfig,
          animations: body.animations,
          userData: body.userData,
        });

        if (!object) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }

        return NextResponse.json({ object });
      }

      case 'object-transform': {
        if (!body.objectId) {
          return NextResponse.json(
            { error: 'Missing required field: objectId' },
            { status: 400 }
          );
        }

        const object = await updateObjectTransform(body.objectId, {
          position: body.position,
          rotation: body.rotation,
          scale: body.scale,
        });

        if (!object) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }

        return NextResponse.json({ object });
      }

      case 'reorder-objects': {
        if (!body.sceneId || !body.objectIds) {
          return NextResponse.json(
            { error: 'Missing required fields: sceneId, objectIds' },
            { status: 400 }
          );
        }

        await reorderSceneObjects(body.sceneId, body.objectIds);
        return NextResponse.json({ success: true });
      }

      case 'interaction': {
        if (!body.interactionId) {
          return NextResponse.json(
            { error: 'Missing required field: interactionId' },
            { status: 400 }
          );
        }

        const interaction = await updateInteraction(body.interactionId, {
          name: body.name,
          description: body.description,
          inputType: body.inputType,
          inputConfig: body.inputConfig,
          actionType: body.actionType,
          actionConfig: body.actionConfig,
          feedbackConfig: body.feedbackConfig,
          conditions: body.conditions,
          priority: body.priority,
          isEnabled: body.isEnabled,
        });

        if (!interaction) {
          return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
        }

        return NextResponse.json({ interaction });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid updateType: ${updateType}. Valid types: scene, object, object-transform, reorder-objects, interaction`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * DELETE /api/webxr/scenes
 *
 * Delete scenes, objects, or interactions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteType = searchParams.get('type') ?? 'scene';
    const sceneId = searchParams.get('sceneId');
    const objectId = searchParams.get('objectId');
    const interactionId = searchParams.get('interactionId');

    switch (deleteType) {
      case 'scene': {
        if (!sceneId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sceneId' },
            { status: 400 }
          );
        }

        const deleted = await deleteScene(sceneId);
        if (!deleted) {
          return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
      }

      case 'object': {
        if (!objectId) {
          return NextResponse.json(
            { error: 'Missing required parameter: objectId' },
            { status: 400 }
          );
        }

        const deleted = await deleteSceneObject(objectId);
        if (!deleted) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
      }

      case 'interaction': {
        if (!interactionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: interactionId' },
            { status: 400 }
          );
        }

        const deleted = await deleteInteraction(interactionId);
        if (!deleted) {
          return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Invalid type: ${deleteType}. Valid types: scene, object, interaction` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
