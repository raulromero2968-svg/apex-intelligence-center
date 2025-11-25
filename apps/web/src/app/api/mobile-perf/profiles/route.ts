/**
 * Mobile Performance Profiles API
 *
 * Endpoints for managing performance profiles and metrics.
 * Implements knowledge-08-mobile-performance profiling.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createProfile,
  getProfile,
  getUserProfiles,
  getProjectProfiles,
  updateProfile,
  deleteProfile,
  recordMetrics,
  getSessionMetrics,
  getProfileMetrics,
  getMetricsSummary,
  analyzePerformance,
  generateOptimizedConfig,
  generateFlatListCode,
  DEFAULT_PROFILE,
} from '@/lib/mobile-perf';

/**
 * GET /api/mobile-perf/profiles
 *
 * Get profiles or metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const profileId = searchParams.get('profileId');
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        if (projectId) {
          const profiles = await getProjectProfiles(projectId, { limit });
          return NextResponse.json({ profiles });
        } else if (userId) {
          const profiles = await getUserProfiles(userId, { limit });
          return NextResponse.json({ profiles });
        }
        return NextResponse.json(
          { error: 'Missing required parameter: userId or projectId' },
          { status: 400 }
        );
      }

      case 'get': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const profile = await getProfile(profileId);
        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ profile });
      }

      case 'metrics': {
        if (sessionId) {
          const metrics = await getSessionMetrics(sessionId);
          return NextResponse.json({ metrics });
        } else if (profileId) {
          const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : undefined;
          const endDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : undefined;

          const metrics = await getProfileMetrics(profileId, {
            startDate,
            endDate,
            limit,
          });
          return NextResponse.json({ metrics });
        }
        return NextResponse.json(
          { error: 'Missing required parameter: profileId or sessionId' },
          { status: 400 }
        );
      }

      case 'summary': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const summary = await getMetricsSummary(profileId);
        return NextResponse.json({ summary });
      }

      case 'analyze': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const metrics = await getProfileMetrics(profileId, { limit: 100 });
        const profile = await getProfile(profileId);

        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const analysis = analyzePerformance(metrics, profile.thresholds as any);
        return NextResponse.json({ analysis });
      }

      case 'defaults': {
        return NextResponse.json({ defaults: DEFAULT_PROFILE });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, metrics, summary, analyze, defaults`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

/**
 * POST /api/mobile-perf/profiles
 *
 * Create profiles or record metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create-profile';

    switch (action) {
      case 'create-profile': {
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const profile = await createProfile({
          name: body.name,
          description: body.description,
          userId: body.userId,
          projectId: body.projectId,
          platform: body.platform ?? 'both',
          targetFps: body.targetFps ?? 60,
          maxMemoryMb: body.maxMemoryMb ?? 256,
          maxBundleSizeKb: body.maxBundleSizeKb ?? 5000,
          enableHermes: body.enableHermes ?? true,
          enableNewArchitecture: body.enableNewArchitecture ?? false,
          listConfig: body.listConfig ?? DEFAULT_PROFILE.listConfig,
          imageConfig: body.imageConfig ?? DEFAULT_PROFILE.imageConfig,
          bridgeConfig: body.bridgeConfig ?? DEFAULT_PROFILE.bridgeConfig,
          thresholds: body.thresholds ?? DEFAULT_PROFILE.thresholds,
        });

        return NextResponse.json({ profile }, { status: 201 });
      }

      case 'record-metrics': {
        if (!body.platform) {
          return NextResponse.json(
            { error: 'Missing required field: platform' },
            { status: 400 }
          );
        }

        const metric = await recordMetrics({
          profileId: body.profileId,
          sessionId: body.sessionId,
          userId: body.userId,
          platform: body.platform,
          deviceModel: body.deviceModel,
          osVersion: body.osVersion,
          appVersion: body.appVersion,
          deviceTier: body.deviceTier,
          avgFps: body.avgFps,
          minFps: body.minFps,
          maxFps: body.maxFps,
          droppedFrames: body.droppedFrames,
          jankCount: body.jankCount,
          avgMemoryMb: body.avgMemoryMb,
          peakMemoryMb: body.peakMemoryMb,
          memoryLeakSuspected: body.memoryLeakSuspected,
          avgRenderTimeMs: body.avgRenderTimeMs,
          maxRenderTimeMs: body.maxRenderTimeMs,
          reRenderCount: body.reRenderCount,
          unnecessaryRenders: body.unnecessaryRenders,
          bridgeCallCount: body.bridgeCallCount,
          avgBridgeLatencyMs: body.avgBridgeLatencyMs,
          bridgeQueueDepth: body.bridgeQueueDepth,
          networkRequestCount: body.networkRequestCount,
          avgNetworkLatencyMs: body.avgNetworkLatencyMs,
          offlineTime: body.offlineTime,
          batteryDrainPercent: body.batteryDrainPercent,
          cpuUsagePercent: body.cpuUsagePercent,
          sessionDurationMs: body.sessionDurationMs,
          rawMetrics: body.rawMetrics,
        });

        return NextResponse.json({ metric }, { status: 201 });
      }

      case 'generate-optimized': {
        if (!body.profileId) {
          return NextResponse.json(
            { error: 'Missing required field: profileId' },
            { status: 400 }
          );
        }

        const profile = await getProfile(body.profileId);
        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const metrics = await getProfileMetrics(body.profileId, { limit: 100 });
        const optimizedConfig = generateOptimizedConfig(metrics, profile);

        return NextResponse.json({ optimizedConfig });
      }

      case 'generate-flatlist-code': {
        const config = body.listConfig ?? DEFAULT_PROFILE.listConfig;
        const code = generateFlatListCode(config, body.itemType ?? 'Item');

        return NextResponse.json({ code });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: create-profile, record-metrics, generate-optimized, generate-flatlist-code`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating profile/metrics:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

/**
 * PATCH /api/mobile-perf/profiles
 *
 * Update a profile
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

    const profile = await updateProfile(body.profileId, {
      name: body.name,
      description: body.description,
      platform: body.platform,
      targetFps: body.targetFps,
      maxMemoryMb: body.maxMemoryMb,
      maxBundleSizeKb: body.maxBundleSizeKb,
      enableHermes: body.enableHermes,
      enableNewArchitecture: body.enableNewArchitecture,
      enableFabric: body.enableFabric,
      enableTurboModules: body.enableTurboModules,
      listConfig: body.listConfig,
      imageConfig: body.imageConfig,
      bridgeConfig: body.bridgeConfig,
      thresholds: body.thresholds,
      isDefault: body.isDefault,
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

/**
 * DELETE /api/mobile-perf/profiles
 *
 * Delete a profile
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

    const deleted = await deleteProfile(profileId);
    if (!deleted) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
