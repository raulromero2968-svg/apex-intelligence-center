/**
 * Mobile Performance Devices API
 *
 * Endpoints for device configurations and tuning.
 * Implements knowledge-08-mobile-performance device profiler.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDeviceConfigs,
  getDeviceConfig,
  getConfigForDevice,
  createDeviceConfig,
  updateDeviceConfig,
  initializeBuiltInConfigs,
  createOfflineConfig,
  getOfflineConfig,
  updateOfflineConfig,
  detectDeviceTier,
  getTunedSettings,
  generateAppConfig,
  generateOfflineSyncCode,
  BUILT_IN_DEVICE_CONFIGS,
} from '@/lib/mobile-perf';

/**
 * GET /api/mobile-perf/devices
 *
 * Get device configurations and settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const configId = searchParams.get('configId');
    const profileId = searchParams.get('profileId');
    const platform = searchParams.get('platform') as 'ios' | 'android' | 'both' | null;
    const tier = searchParams.get('tier') as 'low_end' | 'mid_range' | 'high_end' | 'flagship' | null;

    switch (action) {
      case 'list': {
        const configs = await getAllDeviceConfigs({
          platform: platform ?? undefined,
        });
        return NextResponse.json({ configs });
      }

      case 'get': {
        if (!configId) {
          return NextResponse.json(
            { error: 'Missing required parameter: configId' },
            { status: 400 }
          );
        }

        const config = await getDeviceConfig(configId);
        if (!config) {
          return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json({ config });
      }

      case 'get-for-device': {
        if (!platform || !tier) {
          return NextResponse.json(
            { error: 'Missing required parameters: platform, tier' },
            { status: 400 }
          );
        }

        const config = await getConfigForDevice(platform, tier);
        if (!config) {
          // Return default settings
          const settings = await getTunedSettings(platform, tier);
          return NextResponse.json({ settings, isDefault: true });
        }

        return NextResponse.json({ config });
      }

      case 'tuned-settings': {
        if (!platform || !tier) {
          return NextResponse.json(
            { error: 'Missing required parameters: platform, tier' },
            { status: 400 }
          );
        }

        const settings = await getTunedSettings(platform, tier);
        return NextResponse.json({ settings });
      }

      case 'detect-tier': {
        const ramGb = parseFloat(searchParams.get('ramGb') ?? '0');
        const cpuCores = parseInt(searchParams.get('cpuCores') ?? '0', 10);

        if (!platform) {
          return NextResponse.json(
            { error: 'Missing required parameter: platform' },
            { status: 400 }
          );
        }

        const detectedTier = detectDeviceTier(
          platform,
          ramGb || undefined,
          cpuCores || undefined
        );

        return NextResponse.json({ tier: detectedTier });
      }

      case 'built-in': {
        const configs = BUILT_IN_DEVICE_CONFIGS.map((config) => ({
          name: config.name,
          description: config.description,
          platform: config.platform,
          deviceTier: config.deviceTier,
        }));
        return NextResponse.json({ configs });
      }

      case 'offline-config': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'Missing required parameter: profileId' },
            { status: 400 }
          );
        }

        const config = await getOfflineConfig(profileId);
        return NextResponse.json({ config });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, get-for-device, tuned-settings, detect-tier, built-in, offline-config`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching device configs:', error);
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
  }
}

/**
 * POST /api/mobile-perf/devices
 *
 * Create device configs and generate code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create-config';

    switch (action) {
      case 'create-config': {
        if (!body.name || !body.platform || !body.deviceTier) {
          return NextResponse.json(
            { error: 'Missing required fields: name, platform, deviceTier' },
            { status: 400 }
          );
        }

        const config = await createDeviceConfig({
          name: body.name,
          description: body.description,
          platform: body.platform,
          deviceTier: body.deviceTier,
          deviceModels: body.deviceModels,
          minOsVersion: body.minOsVersion,
          specs: body.specs,
          recommendedSettings: body.recommendedSettings,
          listOverrides: body.listOverrides,
          hermesConfig: body.hermesConfig,
          isBuiltIn: false,
        });

        return NextResponse.json({ config }, { status: 201 });
      }

      case 'create-offline-config': {
        if (!body.name || !body.profileId) {
          return NextResponse.json(
            { error: 'Missing required fields: name, profileId' },
            { status: 400 }
          );
        }

        const config = await createOfflineConfig({
          name: body.name,
          description: body.description,
          profileId: body.profileId,
          syncStrategy: body.syncStrategy ?? 'lazy',
          cacheConfig: body.cacheConfig,
          dataPolicies: body.dataPolicies,
          queueConfig: body.queueConfig,
          fallbackUi: body.fallbackUi,
          isEnabled: body.isEnabled ?? true,
        });

        return NextResponse.json({ config }, { status: 201 });
      }

      case 'generate-app-config': {
        if (!body.platform || !body.settings) {
          return NextResponse.json(
            { error: 'Missing required fields: platform, settings' },
            { status: 400 }
          );
        }

        const appConfig = generateAppConfig(
          body.platform,
          body.settings,
          body.hermesConfig
        );

        return NextResponse.json({ config: appConfig });
      }

      case 'generate-offline-code': {
        if (!body.dataPolicies) {
          return NextResponse.json(
            { error: 'Missing required field: dataPolicies' },
            { status: 400 }
          );
        }

        const code = generateOfflineSyncCode(body.dataPolicies);
        return NextResponse.json({ code });
      }

      case 'initialize-configs': {
        const count = await initializeBuiltInConfigs();
        return NextResponse.json({
          success: true,
          configsInitialized: count,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: create-config, create-offline-config, generate-app-config, generate-offline-code, initialize-configs`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating device config:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

/**
 * PATCH /api/mobile-perf/devices
 *
 * Update device or offline configs
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updateType = body.updateType ?? 'device';

    switch (updateType) {
      case 'device': {
        if (!body.configId) {
          return NextResponse.json(
            { error: 'Missing required field: configId' },
            { status: 400 }
          );
        }

        const config = await updateDeviceConfig(body.configId, {
          name: body.name,
          description: body.description,
          deviceModels: body.deviceModels,
          minOsVersion: body.minOsVersion,
          specs: body.specs,
          recommendedSettings: body.recommendedSettings,
          listOverrides: body.listOverrides,
          hermesConfig: body.hermesConfig,
        });

        if (!config) {
          return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json({ config });
      }

      case 'offline': {
        if (!body.configId) {
          return NextResponse.json(
            { error: 'Missing required field: configId' },
            { status: 400 }
          );
        }

        const config = await updateOfflineConfig(body.configId, {
          name: body.name,
          description: body.description,
          syncStrategy: body.syncStrategy,
          cacheConfig: body.cacheConfig,
          dataPolicies: body.dataPolicies,
          queueConfig: body.queueConfig,
          fallbackUi: body.fallbackUi,
          isEnabled: body.isEnabled,
        });

        if (!config) {
          return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json({ config });
      }

      default:
        return NextResponse.json(
          { error: `Invalid updateType: ${updateType}. Valid types: device, offline` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
