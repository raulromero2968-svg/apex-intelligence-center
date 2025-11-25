/**
 * Device Calibration API
 *
 * Endpoints for managing Vision Pro calibration profiles.
 * Implements pack-visionos-001 §3.3 (Device Calibration Service).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCalibrationProfile,
  getCalibrationProfile,
  getActiveCalibration,
  getUserCalibrations,
  getOrCreateDefaultProfile,
  updateCalibrationProfile,
  setActiveCalibration,
  deleteCalibrationProfile,
  updateGazeCalibration,
  updateHandCalibration,
  updateSpatialCalibration,
  updatePerformanceProfile,
  updateAccessibilityConfig,
  runGazeCalibrationTest,
  runHandCalibrationTest,
  calculateCalibrationAdjustments,
  detectDeviceType,
  getOptimalPerformance,
  DEFAULT_GAZE_CALIBRATION,
  DEFAULT_HAND_CALIBRATION,
  DEFAULT_SPATIAL_CALIBRATION,
  PERFORMANCE_PROFILES,
  DEFAULT_ACCESSIBILITY,
  type DeviceType,
} from '@/lib/visionos';

/**
 * GET /api/visionos/calibration
 *
 * Get calibration profiles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const userId = searchParams.get('userId');
    const profileId = searchParams.get('profileId');
    const deviceType = searchParams.get('deviceType') as DeviceType | undefined;

    switch (action) {
      case 'list': {
        if (userId) {
          const profiles = await getUserCalibrations(userId);
          return NextResponse.json({ profiles });
        }

        // Return default profile for device type
        const device = deviceType ?? 'vision_pro';
        const profile = await getOrCreateDefaultProfile(device);
        return NextResponse.json({ profiles: [profile] });
      }

      case 'get': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const profile = await getCalibrationProfile(profileId);
        if (!profile) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ profile });
      }

      case 'active': {
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing required parameter: userId' },
            { status: 400 }
          );
        }

        const profile = await getActiveCalibration(userId);
        return NextResponse.json({ profile });
      }

      case 'default': {
        const device = deviceType ?? 'vision_pro';
        const profile = await getOrCreateDefaultProfile(device);
        return NextResponse.json({ profile });
      }

      case 'defaults': {
        // Return all default values
        return NextResponse.json({
          gazeCalibration: DEFAULT_GAZE_CALIBRATION,
          handCalibration: DEFAULT_HAND_CALIBRATION,
          spatialCalibration: DEFAULT_SPATIAL_CALIBRATION,
          performanceProfiles: PERFORMANCE_PROFILES,
          accessibilityConfig: DEFAULT_ACCESSIBILITY,
        });
      }

      case 'detect-device': {
        const userAgent = request.headers.get('user-agent') ?? '';
        const detectedType = detectDeviceType(userAgent);
        return NextResponse.json({ deviceType: detectedType });
      }

      case 'optimal-performance': {
        const device = deviceType ?? 'vision_pro';
        const batteryLevel = parseFloat(searchParams.get('batteryLevel') ?? '1.0');
        const thermalState = (searchParams.get('thermalState') ?? 'nominal') as
          | 'nominal'
          | 'fair'
          | 'serious'
          | 'critical';

        const optimal = getOptimalPerformance(device, batteryLevel, thermalState);
        return NextResponse.json({ performanceProfile: optimal });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, active, default, defaults, detect-device, optimal-performance`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching calibration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visionos/calibration
 *
 * Create calibration profile or run calibration tests
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

        const profile = await createCalibrationProfile({
          name: body.name,
          userId: body.userId,
          deviceId: body.deviceId,
          deviceType: body.deviceType ?? 'vision_pro',
          osVersion: body.osVersion,
          firmwareVersion: body.firmwareVersion,
          gazeCalibration: body.gazeCalibration,
          handCalibration: body.handCalibration,
          spatialCalibration: body.spatialCalibration,
          performanceProfile: body.performanceProfile,
          accessibilityConfig: body.accessibilityConfig,
          isDefault: false,
          isActive: body.isActive ?? true,
        });

        return NextResponse.json({ profile }, { status: 201 });
      }

      case 'set-active': {
        if (!body.userId || !body.profileId) {
          return NextResponse.json(
            { error: 'Missing required fields: userId, profileId' },
            { status: 400 }
          );
        }

        await setActiveCalibration(body.userId, body.profileId);
        return NextResponse.json({ success: true });
      }

      case 'test-gaze': {
        if (!body.calibration || !body.testPoints) {
          return NextResponse.json(
            { error: 'Missing required fields: calibration, testPoints' },
            { status: 400 }
          );
        }

        const result = runGazeCalibrationTest(body.calibration, body.testPoints);
        return NextResponse.json({ result });
      }

      case 'test-hand': {
        if (!body.calibration || !body.testData) {
          return NextResponse.json(
            { error: 'Missing required fields: calibration, testData' },
            { status: 400 }
          );
        }

        const result = runHandCalibrationTest(body.calibration, body.testData);
        return NextResponse.json({ result });
      }

      case 'calculate-adjustments': {
        if (!body.testResults) {
          return NextResponse.json(
            { error: 'Missing required field: testResults' },
            { status: 400 }
          );
        }

        const adjustments = calculateCalibrationAdjustments(body.testResults);
        return NextResponse.json({ adjustments });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: create, set-active, test-gaze, test-hand, calculate-adjustments`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing calibration request:', error);
    return NextResponse.json(
      { error: 'Failed to process calibration request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/visionos/calibration
 *
 * Update calibration profile or specific calibration data
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.profileId) {
      return NextResponse.json(
        { error: 'Missing required field: profileId' },
        { status: 400 }
      );
    }

    const updateType = body.updateType ?? 'profile';

    switch (updateType) {
      case 'profile': {
        const updated = await updateCalibrationProfile(body.profileId, {
          name: body.name,
          deviceId: body.deviceId,
          osVersion: body.osVersion,
          firmwareVersion: body.firmwareVersion,
        });

        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ profile: updated });
      }

      case 'gaze': {
        const updated = await updateGazeCalibration(body.profileId, body.gazeCalibration);
        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ profile: updated });
      }

      case 'hand': {
        const updated = await updateHandCalibration(body.profileId, body.handCalibration);
        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ profile: updated });
      }

      case 'spatial': {
        const updated = await updateSpatialCalibration(
          body.profileId,
          body.spatialCalibration
        );
        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ profile: updated });
      }

      case 'performance': {
        const updated = await updatePerformanceProfile(
          body.profileId,
          body.performanceProfile
        );
        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ profile: updated });
      }

      case 'accessibility': {
        const updated = await updateAccessibilityConfig(
          body.profileId,
          body.accessibilityConfig
        );
        if (!updated) {
          return NextResponse.json(
            { error: 'Calibration profile not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ profile: updated });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid updateType: ${updateType}. Valid types: profile, gaze, hand, spatial, performance, accessibility`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating calibration:', error);
    return NextResponse.json(
      { error: 'Failed to update calibration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/visionos/calibration
 *
 * Delete a calibration profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: profileId' },
        { status: 400 }
      );
    }

    const deleted = await deleteCalibrationProfile(profileId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Calibration profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calibration:', error);
    return NextResponse.json(
      { error: 'Failed to delete calibration' },
      { status: 500 }
    );
  }
}
