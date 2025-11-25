/**
 * Individual Volumetric Scene API
 *
 * Endpoints for managing a single volumetric scene.
 * Implements pack-lfd-001 §4.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { volumetricScenes } from '@/db/schema/lightfield';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ sceneId: string }>;
}

/**
 * GET /api/lightfield/scenes/[sceneId]
 *
 * Get a single volumetric scene
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sceneId } = await params;

    const [scene] = await db
      .select()
      .from(volumetricScenes)
      .where(eq(volumetricScenes.id, sceneId))
      .limit(1)
      .execute();

    if (!scene) {
      return NextResponse.json(
        { error: 'Volumetric scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Error fetching volumetric scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volumetric scene' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lightfield/scenes/[sceneId]
 *
 * Update a volumetric scene
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sceneId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(volumetricScenes)
      .set({
        name: body.name,
        description: body.description,
        isPublic: body.isPublic,
        sceneType: body.sceneType,
        sceneConfig: body.sceneConfig,
        objects: body.objects,
        dataBindings: body.dataBindings,
        interactions: body.interactions,
        updatedAt: new Date(),
      })
      .where(eq(volumetricScenes.id, sceneId))
      .returning()
      .execute();

    if (!updated) {
      return NextResponse.json(
        { error: 'Volumetric scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scene: updated });
  } catch (error) {
    console.error('Error updating volumetric scene:', error);
    return NextResponse.json(
      { error: 'Failed to update volumetric scene' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lightfield/scenes/[sceneId]
 *
 * Delete a volumetric scene
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sceneId } = await params;

    const [deleted] = await db
      .delete(volumetricScenes)
      .where(eq(volumetricScenes.id, sceneId))
      .returning()
      .execute();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Volumetric scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting volumetric scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete volumetric scene' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/scenes/[sceneId]
 *
 * Perform actions on a scene (add object, update bindings, etc.)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sceneId } = await params;
    const body = await request.json();
    const action = body.action ?? 'add-object';

    // Get current scene
    const [scene] = await db
      .select()
      .from(volumetricScenes)
      .where(eq(volumetricScenes.id, sceneId))
      .limit(1)
      .execute();

    if (!scene) {
      return NextResponse.json(
        { error: 'Volumetric scene not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'add-object': {
        // Add an object to the scene
        if (!body.object) {
          return NextResponse.json(
            { error: 'Missing required field: object' },
            { status: 400 }
          );
        }

        const currentObjects = (scene.objects as any[]) ?? [];
        const newObject = {
          id: body.object.id ?? crypto.randomUUID(),
          type: body.object.type ?? 'model',
          assetId: body.object.assetId,
          modelUrl: body.object.modelUrl,
          position: body.object.position ?? [0, 0, 0],
          rotation: body.object.rotation ?? [0, 0, 0],
          scale: body.object.scale ?? [1, 1, 1],
          metadata: body.object.metadata ?? {},
        };

        const [updated] = await db
          .update(volumetricScenes)
          .set({
            objects: [...currentObjects, newObject],
            updatedAt: new Date(),
          })
          .where(eq(volumetricScenes.id, sceneId))
          .returning()
          .execute();

        return NextResponse.json({ scene: updated, addedObject: newObject });
      }

      case 'remove-object': {
        // Remove an object from the scene
        if (!body.objectId) {
          return NextResponse.json(
            { error: 'Missing required field: objectId' },
            { status: 400 }
          );
        }

        const currentObjects = (scene.objects as any[]) ?? [];
        const filteredObjects = currentObjects.filter((o) => o.id !== body.objectId);

        if (filteredObjects.length === currentObjects.length) {
          return NextResponse.json(
            { error: 'Object not found in scene' },
            { status: 404 }
          );
        }

        const [updated] = await db
          .update(volumetricScenes)
          .set({
            objects: filteredObjects,
            updatedAt: new Date(),
          })
          .where(eq(volumetricScenes.id, sceneId))
          .returning()
          .execute();

        return NextResponse.json({ scene: updated });
      }

      case 'update-object': {
        // Update an object in the scene
        if (!body.objectId) {
          return NextResponse.json(
            { error: 'Missing required field: objectId' },
            { status: 400 }
          );
        }

        const currentObjects = (scene.objects as any[]) ?? [];
        const objectIndex = currentObjects.findIndex((o) => o.id === body.objectId);

        if (objectIndex === -1) {
          return NextResponse.json(
            { error: 'Object not found in scene' },
            { status: 404 }
          );
        }

        const updatedObject = {
          ...currentObjects[objectIndex],
          ...body.updates,
          id: body.objectId, // Ensure ID doesn't change
        };

        currentObjects[objectIndex] = updatedObject;

        const [updated] = await db
          .update(volumetricScenes)
          .set({
            objects: currentObjects,
            updatedAt: new Date(),
          })
          .where(eq(volumetricScenes.id, sceneId))
          .returning()
          .execute();

        return NextResponse.json({ scene: updated, updatedObject });
      }

      case 'add-binding': {
        // Add a data binding
        if (!body.binding) {
          return NextResponse.json(
            { error: 'Missing required field: binding' },
            { status: 400 }
          );
        }

        const currentBindings = (scene.dataBindings as any[]) ?? [];
        const newBinding = {
          objectId: body.binding.objectId,
          dataSource: body.binding.dataSource,
          property: body.binding.property,
          transform: body.binding.transform,
        };

        const [updated] = await db
          .update(volumetricScenes)
          .set({
            dataBindings: [...currentBindings, newBinding],
            updatedAt: new Date(),
          })
          .where(eq(volumetricScenes.id, sceneId))
          .returning()
          .execute();

        return NextResponse.json({ scene: updated, addedBinding: newBinding });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: add-object, remove-object, update-object, add-binding` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing scene action:', error);
    return NextResponse.json(
      { error: 'Failed to process scene action' },
      { status: 500 }
    );
  }
}
