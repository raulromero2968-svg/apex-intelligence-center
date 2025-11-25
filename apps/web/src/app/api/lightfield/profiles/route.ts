/**
 * Display Profiles API
 *
 * Endpoints for managing Looking Glass display calibration profiles.
 * Implements pack-lfd-001 §3.4 (Hardware Calibration).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateDefaultProfile,
  createDisplayProfile,
  getUserDisplayProfiles,
  calculateViewingZone,
  estimateGpuMemoryMB,
  detectDisplayFromUserAgent,
  inferDisplayFromResolution,
  DEFAULT_HARDWARE_SPECS,
  DEFAULT_RENDER_PARAMS,
  DEFAULT_QUALITY_PRESETS,
  type DisplayModel,
} from '@/lib/lightfield';

/**
 * GET /api/lightfield/profiles
 *
 * Get display profiles for a user or default profiles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const userId = searchParams.get('userId');
    const displayModel = searchParams.get('displayModel') as DisplayModel | undefined;

    switch (action) {
      case 'list': {
        if (userId) {
          const profiles = await getUserDisplayProfiles(userId);
          return NextResponse.json({ profiles });
        }

        // Return default profiles for all display models
        const defaultProfiles = await Promise.all(
          (['portrait', 'lg_16', 'lg_27', 'lg_32', 'lg_65', 'lg_86'] as DisplayModel[]).map(
            (model) => getOrCreateDefaultProfile(model)
          )
        );

        return NextResponse.json({ profiles: defaultProfiles });
      }

      case 'default': {
        if (!displayModel) {
          return NextResponse.json(
            { error: 'Missing required parameter: displayModel' },
            { status: 400 }
          );
        }

        const profile = await getOrCreateDefaultProfile(displayModel);
        return NextResponse.json({ profile });
      }

      case 'specs': {
        // Return hardware specifications for all or specific display
        if (displayModel) {
          const specs = DEFAULT_HARDWARE_SPECS[displayModel];
          const renderParams = DEFAULT_RENDER_PARAMS[displayModel];
          const qualityPresets = displayModel === 'portrait'
            ? DEFAULT_QUALITY_PRESETS.portrait
            : DEFAULT_QUALITY_PRESETS.landscape;

          return NextResponse.json({ specs, renderParams, qualityPresets });
        }

        return NextResponse.json({
          specs: DEFAULT_HARDWARE_SPECS,
          renderParams: DEFAULT_RENDER_PARAMS,
          qualityPresets: DEFAULT_QUALITY_PRESETS,
        });
      }

      case 'detect': {
        // Detect display from user agent or resolution
        const userAgent = request.headers.get('user-agent') ?? '';
        const width = parseInt(searchParams.get('width') ?? '0', 10);
        const height = parseInt(searchParams.get('height') ?? '0', 10);

        let detected: DisplayModel | null = null;

        // Try user agent first
        detected = detectDisplayFromUserAgent(userAgent);

        // Fall back to resolution detection
        if (!detected && width > 0 && height > 0) {
          detected = inferDisplayFromResolution(width, height);
        }

        if (detected) {
          const profile = await getOrCreateDefaultProfile(detected);
          return NextResponse.json({ detected, profile });
        }

        return NextResponse.json({
          detected: null,
          message: 'No Looking Glass display detected',
        });
      }

      case 'viewing-zone': {
        if (!displayModel) {
          return NextResponse.json(
            { error: 'Missing required parameter: displayModel' },
            { status: 400 }
          );
        }

        const specs = DEFAULT_HARDWARE_SPECS[displayModel];
        const params = DEFAULT_RENDER_PARAMS[displayModel];
        const zone = calculateViewingZone(specs, params);

        return NextResponse.json({ viewingZone: zone });
      }

      case 'memory-estimate': {
        if (!displayModel) {
          return NextResponse.json(
            { error: 'Missing required parameter: displayModel' },
            { status: 400 }
          );
        }

        const resolution = parseFloat(searchParams.get('resolution') ?? '1.0');
        const specs = DEFAULT_HARDWARE_SPECS[displayModel];
        const params = DEFAULT_RENDER_PARAMS[displayModel];
        const memoryMB = estimateGpuMemoryMB(specs, params, resolution);

        return NextResponse.json({ memoryMB, displayModel, resolution });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, default, specs, detect, viewing-zone, memory-estimate` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching display profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lightfield/profiles
 *
 * Create a new display profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.displayModel) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayModel' },
        { status: 400 }
      );
    }

    const displayModel = body.displayModel as DisplayModel;

    // Use defaults if not provided
    const hardwareSpecs = body.hardwareSpecs ?? DEFAULT_HARDWARE_SPECS[displayModel];
    const renderParams = body.renderParams ?? DEFAULT_RENDER_PARAMS[displayModel];
    const qualityPresets = body.qualityPresets ?? (
      displayModel === 'portrait'
        ? DEFAULT_QUALITY_PRESETS.portrait
        : DEFAULT_QUALITY_PRESETS.landscape
    );

    const profile = await createDisplayProfile({
      name: body.name,
      displayModel,
      ownerId: body.ownerId,
      isDefault: false,
      hardwareSpecs,
      renderParams,
      qualityPresets,
      calibrationData: body.calibrationData,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating display profile:', error);
    return NextResponse.json(
      { error: 'Failed to create display profile' },
      { status: 500 }
    );
  }
}
