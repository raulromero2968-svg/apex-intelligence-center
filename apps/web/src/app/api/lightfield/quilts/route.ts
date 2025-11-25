/**
 * Quilt Assets API
 *
 * Endpoints for managing quilt textures (multi-view light field assets).
 * Implements pack-lfd-001 §2.1 (Quilt Generator).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateQuiltConfig,
  generateQuilt,
  getUserQuiltAssets,
  type QuiltGenerationRequest,
} from '@/lib/lightfield';
import { db } from '@/lib/db';
import { quiltAssets } from '@/db/schema/lightfield';
import { eq, and, or, desc } from 'drizzle-orm';

/**
 * GET /api/lightfield/quilts
 *
 * List quilt assets for a user or public quilts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Build query conditions
    const conditions = [];

    if (userId) {
      // User's own quilts plus public quilts
      conditions.push(
        or(
          eq(quiltAssets.ownerId, userId),
          eq(quiltAssets.isPublic, true)
        )
      );
    } else {
      // Only public quilts
      conditions.push(eq(quiltAssets.isPublic, true));
    }

    if (category) {
      conditions.push(eq(quiltAssets.category, category as any));
    }

    if (status) {
      conditions.push(eq(quiltAssets.status, status as any));
    }

    const quilts = await db
      .select()
      .from(quiltAssets)
      .where(and(...conditions))
      .orderBy(desc(quiltAssets.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return NextResponse.json({ quilts, count: quilts.length });
  } catch (error) {
    console.error('Error fetching quilt assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quilt assets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/quilts
 *
 * Generate a new quilt asset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'generate';

    switch (action) {
      case 'config': {
        // Generate optimal quilt configuration
        const config = generateQuiltConfig({
          displayModel: body.displayModel ?? 'portrait',
          contentType: body.contentType ?? 'static',
          quality: body.quality ?? 'high',
          targetFps: body.targetFps,
        });

        return NextResponse.json({ config });
      }

      case 'generate': {
        // Generate a new quilt
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const request: QuiltGenerationRequest = {
          name: body.name,
          description: body.description,
          ownerId: body.ownerId,
          isPublic: body.isPublic ?? false,
          sourceModelUrl: body.sourceModelUrl,
          sourceModelType: body.sourceModelType,
          category: body.category ?? 'custom',
          tags: body.tags ?? [],
          displayModel: body.displayModel ?? 'portrait',
          contentType: body.contentType ?? 'static',
          quality: body.quality ?? 'high',
          customConfig: body.customConfig,
        };

        const result = await generateQuilt(request);

        return NextResponse.json({ quilt: result }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: config, generate` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating quilt asset:', error);
    return NextResponse.json(
      { error: 'Failed to create quilt asset' },
      { status: 500 }
    );
  }
}
