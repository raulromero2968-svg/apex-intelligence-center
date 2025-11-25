/**
 * WebXR Devices API
 *
 * Endpoints for device profiling and performance optimization.
 * Implements pack-webxr-001 §3.3 (Device Profiler).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDeviceProfile,
  getAllDeviceProfiles,
  createDeviceProfile,
  updateDeviceProfile,
  getOptimalSettings,
  getPerformanceBudget,
  analyzeScenePerformance,
  getCompatibilityMatrix,
  BUILT_IN_PROFILES,
} from '@/lib/webxr';

/**
 * GET /api/webxr/devices
 *
 * Get device profiles, performance settings, and compatibility info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const profileId = searchParams.get('profileId');
    const deviceType = searchParams.get('deviceType');
    const sceneId = searchParams.get('sceneId');

    switch (action) {
      case 'list': {
        const profiles = await getAllDeviceProfiles();
        return NextResponse.json({ profiles });
      }

      case 'get': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const profile = await getDeviceProfile(profileId);
        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ profile });
      }

      case 'built-in': {
        const profiles = Object.entries(BUILT_IN_PROFILES).map(([id, profile]) => ({
          id,
          name: profile.name,
          deviceType: profile.deviceType,
          gpuTier: profile.gpuTier,
        }));
        return NextResponse.json({ profiles });
      }

      case 'optimal-settings': {
        if (!deviceType) {
          return NextResponse.json(
            { error: 'Missing required parameter: deviceType' },
            { status: 400 }
          );
        }

        const settings = getOptimalSettings(deviceType);
        return NextResponse.json({ settings });
      }

      case 'performance-budget': {
        if (!deviceType) {
          return NextResponse.json(
            { error: 'Missing required parameter: deviceType' },
            { status: 400 }
          );
        }

        const targetFps = parseInt(searchParams.get('targetFps') ?? '72', 10);
        const budget = getPerformanceBudget(deviceType, targetFps);
        return NextResponse.json({ budget });
      }

      case 'analyze-scene': {
        if (!sceneId || !deviceType) {
          return NextResponse.json(
            { error: 'Missing required parameters: sceneId, deviceType' },
            { status: 400 }
          );
        }

        const analysis = await analyzeScenePerformance(sceneId, deviceType);
        return NextResponse.json({ analysis });
      }

      case 'compatibility-matrix': {
        const features = searchParams.get('features')?.split(',') ?? [];
        const matrix = getCompatibilityMatrix(features);
        return NextResponse.json({ matrix });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, built-in, optimal-settings, performance-budget, analyze-scene, compatibility-matrix`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching device profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch device profiles' }, { status: 500 });
  }
}

/**
 * POST /api/webxr/devices
 *
 * Create a custom device profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.deviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, deviceType' },
        { status: 400 }
      );
    }

    const profile = await createDeviceProfile({
      name: body.name,
      deviceType: body.deviceType,
      gpuTier: body.gpuTier ?? 'mid',
      performanceSpec: body.performanceSpec ?? {
        maxTriangles: 500000,
        maxDrawCalls: 100,
        maxTextureSize: 2048,
        maxLights: 4,
        targetFrameRate: 72,
        cpuBudgetMs: 11,
        gpuBudgetMs: 11,
      },
      recommendedSettings: body.recommendedSettings ?? {
        quality: 'medium',
        antialiasing: 'fxaa',
        shadowQuality: 'medium',
        postProcessing: ['fxaa'],
        lodBias: 1.0,
      },
      displayConfig: body.displayConfig ?? {
        resolution: [1920, 1080],
        refreshRate: 72,
        fov: 100,
        stereo: true,
      },
      inputCapabilities: body.inputCapabilities ?? {
        controllers: true,
        handTracking: false,
        eyeTracking: false,
        voiceInput: false,
        haptics: true,
      },
      isBuiltIn: false,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating device profile:', error);
    return NextResponse.json({ error: 'Failed to create device profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/webxr/devices
 *
 * Update a custom device profile
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

    const profile = await updateDeviceProfile(body.profileId, {
      name: body.name,
      gpuTier: body.gpuTier,
      performanceSpec: body.performanceSpec,
      recommendedSettings: body.recommendedSettings,
      displayConfig: body.displayConfig,
      inputCapabilities: body.inputCapabilities,
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating device profile:', error);
    return NextResponse.json({ error: 'Failed to update device profile' }, { status: 500 });
  }
}
