/**
 * Individual Display Profile API
 *
 * Endpoints for managing a single display profile and calibration.
 * Implements pack-lfd-001 §3.4.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDisplayProfile,
  updateDisplayProfile,
  updateCalibration,
  adjustForViewerPosition,
  getOptimalQuality,
  type CalibrationData,
} from '@/lib/lightfield';
import { db } from '@/lib/db';
import { displayProfiles } from '@/db/schema/lightfield';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ profileId: string }>;
}

/**
 * GET /api/lightfield/profiles/[profileId]
 *
 * Get a single display profile
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { profileId } = await params;
    const profile = await getDisplayProfile(profileId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Display profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching display profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lightfield/profiles/[profileId]
 *
 * Update a display profile
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { profileId } = await params;
    const body = await request.json();

    const updated = await updateDisplayProfile(profileId, {
      name: body.name,
      hardwareSpecs: body.hardwareSpecs,
      renderParams: body.renderParams,
      qualityPresets: body.qualityPresets,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Display profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Error updating display profile:', error);
    return NextResponse.json(
      { error: 'Failed to update display profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lightfield/profiles/[profileId]
 *
 * Delete a display profile (non-default only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { profileId } = await params;

    // Check if profile exists and is not a default
    const profile = await getDisplayProfile(profileId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Display profile not found' },
        { status: 404 }
      );
    }

    if (profile.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default profiles' },
        { status: 400 }
      );
    }

    await db
      .delete(displayProfiles)
      .where(eq(displayProfiles.id, profileId))
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting display profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete display profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/profiles/[profileId]
 *
 * Perform actions on a profile (calibrate, optimize)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { profileId } = await params;
    const body = await request.json();
    const action = body.action ?? 'calibrate';

    const profile = await getDisplayProfile(profileId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Display profile not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'calibrate': {
        // Update calibration data
        const calibration: CalibrationData = {
          centerView: body.centerView ?? 0,
          viewOffset: body.viewOffset ?? 0,
          pitchCorrection: body.pitchCorrection ?? 0,
          slopeCorrection: body.slopeCorrection ?? 0,
        };

        const updated = await updateCalibration(profileId, calibration);

        if (!updated) {
          return NextResponse.json(
            { error: 'Failed to update calibration' },
            { status: 500 }
          );
        }

        return NextResponse.json({ profile: updated });
      }

      case 'adjust-viewer': {
        // Calculate adjusted render params for viewer position
        if (!profile.renderParams) {
          return NextResponse.json(
            { error: 'Profile has no render params' },
            { status: 400 }
          );
        }

        const viewerOffset = {
          x: body.viewerX ?? 0, // cm from center
          z: body.viewerZ ?? 0, // cm from optimal distance
        };

        const adjusted = adjustForViewerPosition(
          profile.renderParams as any,
          viewerOffset
        );

        return NextResponse.json({ adjustedParams: adjusted });
      }

      case 'optimize-quality': {
        // Get optimal quality preset based on performance
        if (!profile.qualityPresets) {
          return NextResponse.json(
            { error: 'Profile has no quality presets' },
            { status: 400 }
          );
        }

        const optimal = getOptimalQuality(
          body.targetFps ?? 30,
          body.currentFps ?? 30,
          body.currentQuality ?? 'medium',
          profile.qualityPresets as any
        );

        return NextResponse.json({ optimal });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: calibrate, adjust-viewer, optimize-quality` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing profile action:', error);
    return NextResponse.json(
      { error: 'Failed to process profile action' },
      { status: 500 }
    );
  }
}
