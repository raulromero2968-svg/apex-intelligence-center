/**
 * Individual Quilt Asset API
 *
 * Endpoints for managing a single quilt asset.
 * Implements pack-lfd-001 §2.1.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getQuiltAsset,
  updateQuiltAsset,
  deleteQuiltAsset,
  generateQuiltPreview,
} from '@/lib/lightfield';

interface RouteParams {
  params: Promise<{ quiltId: string }>;
}

/**
 * GET /api/lightfield/quilts/[quiltId]
 *
 * Get a single quilt asset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { quiltId } = await params;
    const quilt = await getQuiltAsset(quiltId);

    if (!quilt) {
      return NextResponse.json(
        { error: 'Quilt asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quilt });
  } catch (error) {
    console.error('Error fetching quilt asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quilt asset' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lightfield/quilts/[quiltId]
 *
 * Update a quilt asset
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { quiltId } = await params;
    const body = await request.json();

    const updated = await updateQuiltAsset(quiltId, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic,
      category: body.category,
      tags: body.tags,
      quiltConfig: body.quiltConfig,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Quilt asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quilt: updated });
  } catch (error) {
    console.error('Error updating quilt asset:', error);
    return NextResponse.json(
      { error: 'Failed to update quilt asset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lightfield/quilts/[quiltId]
 *
 * Delete a quilt asset
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { quiltId } = await params;
    const deleted = await deleteQuiltAsset(quiltId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Quilt asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quilt asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete quilt asset' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/quilts/[quiltId]
 *
 * Perform actions on a quilt (e.g., generate preview)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { quiltId } = await params;
    const body = await request.json();
    const action = body.action ?? 'preview';

    switch (action) {
      case 'preview': {
        // Generate 2D preview from quilt
        const viewIndex = body.viewIndex; // Optional specific view
        const preview = await generateQuiltPreview(quiltId, viewIndex);

        if (!preview) {
          return NextResponse.json(
            { error: 'Failed to generate preview' },
            { status: 500 }
          );
        }

        return NextResponse.json({ preview });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: preview` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing quilt action:', error);
    return NextResponse.json(
      { error: 'Failed to process quilt action' },
      { status: 500 }
    );
  }
}
