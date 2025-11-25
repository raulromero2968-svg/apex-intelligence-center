/**
 * Spatial Scenes API
 *
 * Endpoints for managing visionOS spatial scenes.
 * Implements pack-visionos-001 §2.1 (Spatial Preview Panel).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spatialScenes, spatialEntities, type NewSpatialScene } from '@/db/schema/visionos';
import { eq, and, or, desc } from 'drizzle-orm';

/**
 * GET /api/visionos/scenes
 *
 * List spatial scenes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sceneType = searchParams.get('sceneType');
    const spaceMode = searchParams.get('spaceMode');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(
        or(eq(spatialScenes.ownerId, userId), eq(spatialScenes.isPublic, true))
      );
    } else {
      conditions.push(eq(spatialScenes.isPublic, true));
    }

    if (sceneType) {
      conditions.push(eq(spatialScenes.sceneType, sceneType as any));
    }

    if (spaceMode) {
      conditions.push(eq(spatialScenes.spaceMode, spaceMode as any));
    }

    const scenes = await db
      .select()
      .from(spatialScenes)
      .where(and(...conditions))
      .orderBy(desc(spatialScenes.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({ scenes, count: scenes.length });
  } catch (error) {
    console.error('Error fetching spatial scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spatial scenes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visionos/scenes
 *
 * Create a new spatial scene
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Default scene configuration
    const defaultSceneConfig = {
      backgroundColor: '#0a0a1a',
      showFloor: true,
      ambientLight: { color: '#ffffff', intensity: 0.4 },
      directionalLights: [
        {
          color: '#ffffff',
          intensity: 0.8,
          direction: [0.5, -1, 0.5] as [number, number, number],
          castsShadow: true,
        },
      ],
      defaultViewpoint: {
        position: [0, 1.6, 2] as [number, number, number],
        target: [0, 1, 0] as [number, number, number],
      },
      enablePhysics: false,
    };

    const defaultInteractionConfig = {
      enableGaze: true,
      enablePinch: true,
      enableDrag: true,
      enableRotation: true,
      enableScale: true,
      gazeDwellTime: 800,
      pinchThreshold: 0.8,
    };

    const sceneData: NewSpatialScene = {
      name: body.name,
      description: body.description,
      ownerId: body.ownerId,
      isPublic: body.isPublic ?? false,
      sceneType: body.sceneType ?? 'custom',
      spaceMode: body.spaceMode ?? 'shared',
      sceneConfig: body.sceneConfig ?? defaultSceneConfig,
      anchorConfig: body.anchorConfig ?? { anchorType: 'world' },
      interactionConfig: body.interactionConfig ?? defaultInteractionConfig,
      multiUserConfig: body.multiUserConfig ?? { enabled: false },
      platforms: body.platforms ?? ['visionos'],
      minVisionOSVersion: body.minVisionOSVersion ?? '1.0',
      tags: body.tags ?? [],
      thumbnail: body.thumbnail,
    };

    const [scene] = await db
      .insert(spatialScenes)
      .values(sceneData)
      .returning()
      .execute();

    return NextResponse.json({ scene }, { status: 201 });
  } catch (error) {
    console.error('Error creating spatial scene:', error);
    return NextResponse.json(
      { error: 'Failed to create spatial scene' },
      { status: 500 }
    );
  }
}
