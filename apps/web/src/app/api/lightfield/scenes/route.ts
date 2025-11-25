/**
 * Volumetric Scenes API
 *
 * Endpoints for managing 3D holographic scenes.
 * Implements pack-lfd-001 §4 (Scene Composition).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { volumetricScenes, type VolumetricScene, type NewVolumetricScene } from '@/db/schema/lightfield';
import { eq, and, or, desc } from 'drizzle-orm';

/**
 * GET /api/lightfield/scenes
 *
 * List volumetric scenes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sceneType = searchParams.get('sceneType');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(
        or(
          eq(volumetricScenes.ownerId, userId),
          eq(volumetricScenes.isPublic, true)
        )
      );
    } else {
      conditions.push(eq(volumetricScenes.isPublic, true));
    }

    if (sceneType) {
      conditions.push(eq(volumetricScenes.sceneType, sceneType as any));
    }

    const scenes = await db
      .select()
      .from(volumetricScenes)
      .where(and(...conditions))
      .orderBy(desc(volumetricScenes.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({ scenes, count: scenes.length });
  } catch (error) {
    console.error('Error fetching volumetric scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volumetric scenes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/scenes
 *
 * Create a new volumetric scene
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.sceneType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sceneType' },
        { status: 400 }
      );
    }

    // Default scene configuration
    const defaultConfig = {
      backgroundColor: '#0a0a1a',
      ambientLight: { color: '#ffffff', intensity: 0.4 },
      directionalLight: { color: '#ffffff', intensity: 0.8, position: [5, 10, 5] as [number, number, number] },
      cameraPosition: [0, 0, 5] as [number, number, number],
      cameraTarget: [0, 0, 0] as [number, number, number],
      fov: 45,
      autoRotate: false,
      rotationSpeed: 0.5,
    };

    const defaultInteractions = {
      enableRotation: true,
      enableZoom: true,
      enablePan: false,
      enableObjectSelection: true,
    };

    const sceneData: NewVolumetricScene = {
      name: body.name,
      description: body.description,
      ownerId: body.ownerId,
      isPublic: body.isPublic ?? false,
      sceneType: body.sceneType,
      sceneConfig: body.sceneConfig ?? defaultConfig,
      objects: body.objects ?? [],
      dataBindings: body.dataBindings,
      interactions: body.interactions ?? defaultInteractions,
    };

    const [scene] = await db
      .insert(volumetricScenes)
      .values(sceneData)
      .returning()
      .execute();

    return NextResponse.json({ scene }, { status: 201 });
  } catch (error) {
    console.error('Error creating volumetric scene:', error);
    return NextResponse.json(
      { error: 'Failed to create volumetric scene' },
      { status: 500 }
    );
  }
}
