/**
 * Device Tuner Service
 *
 * Implements knowledge-08-mobile-performance device-specific optimization.
 * Provides configurations for iOS/Android devices and offline resilience.
 *
 * Features:
 * - Device-specific performance configurations
 * - Platform-optimized settings
 * - Offline mode configuration
 * - Hermes engine tuning
 *
 * @see knowledge-08-mobile-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
  deviceConfigs,
  offlineConfigs,
  type DeviceConfig,
  type NewDeviceConfig,
  type OfflineConfig,
  type NewOfflineConfig,
} from '@/db/schema/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceTier = 'low_end' | 'mid_range' | 'high_end' | 'flagship';
export type Platform = 'ios' | 'android' | 'both';

export interface DeviceSpecs {
  ramGb: number;
  cpuCores: number;
  gpuTier: 'integrated' | 'dedicated' | 'high_performance';
  screenDensity: number;
  refreshRate: number;
}

export interface RecommendedSettings {
  targetFps: number;
  maxMemoryMb: number;
  imageQuality: 'low' | 'medium' | 'high';
  animationComplexity: 'simple' | 'standard' | 'complex';
  shadowsEnabled: boolean;
  blurEnabled: boolean;
  particleCount: number;
}

export interface HermesConfig {
  gcConfig: {
    minHeapSize: number;
    maxHeapSize: number;
    occupancyTarget: number;
  };
  enableES6Proxy: boolean;
  enableIntl: boolean;
}

export interface CacheConfig {
  maxSizeMb: number;
  expirationMs: number;
  priorityLevels: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface OfflineDataPolicies {
  criticalData: string[];
  cacheableEndpoints: string[];
  syncOnReconnect: boolean;
  conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
    exponentialBackoff: boolean;
  };
}

// ============================================================================
// BUILT-IN DEVICE CONFIGS
// ============================================================================

export const BUILT_IN_DEVICE_CONFIGS: Array<
  Omit<NewDeviceConfig, 'id' | 'createdAt' | 'updatedAt'>
> = [
  // iOS Devices
  {
    name: 'iPhone 15 Pro / Pro Max',
    description: 'Latest flagship iOS devices with A17 Pro chip',
    platform: 'ios',
    deviceTier: 'flagship',
    deviceModels: ['iPhone16,1', 'iPhone16,2'],
    minOsVersion: '17.0',
    specs: {
      ramGb: 8,
      cpuCores: 6,
      gpuTier: 'high_performance',
      screenDensity: 3,
      refreshRate: 120,
    },
    recommendedSettings: {
      targetFps: 120,
      maxMemoryMb: 512,
      imageQuality: 'high',
      animationComplexity: 'complex',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 1000,
    },
    listOverrides: {
      windowSize: 21,
      maxToRenderPerBatch: 15,
      initialNumToRender: 15,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 32,
        maxHeapSize: 512,
        occupancyTarget: 0.7,
      },
      enableES6Proxy: true,
      enableIntl: true,
    },
    isBuiltIn: true,
  },
  {
    name: 'iPhone 13/14 Series',
    description: 'High-end iOS devices with A15/A16 chips',
    platform: 'ios',
    deviceTier: 'high_end',
    deviceModels: ['iPhone14,2', 'iPhone14,3', 'iPhone15,2', 'iPhone15,3'],
    minOsVersion: '15.0',
    specs: {
      ramGb: 6,
      cpuCores: 6,
      gpuTier: 'high_performance',
      screenDensity: 3,
      refreshRate: 60,
    },
    recommendedSettings: {
      targetFps: 60,
      maxMemoryMb: 384,
      imageQuality: 'high',
      animationComplexity: 'complex',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 500,
    },
    listOverrides: {
      windowSize: 21,
      maxToRenderPerBatch: 10,
      initialNumToRender: 10,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 32,
        maxHeapSize: 384,
        occupancyTarget: 0.7,
      },
      enableES6Proxy: true,
      enableIntl: true,
    },
    isBuiltIn: true,
  },
  {
    name: 'iPhone SE / Older Models',
    description: 'Budget and older iOS devices',
    platform: 'ios',
    deviceTier: 'mid_range',
    deviceModels: ['iPhone12,8', 'iPhone14,6'],
    minOsVersion: '14.0',
    specs: {
      ramGb: 3,
      cpuCores: 6,
      gpuTier: 'integrated',
      screenDensity: 2,
      refreshRate: 60,
    },
    recommendedSettings: {
      targetFps: 60,
      maxMemoryMb: 192,
      imageQuality: 'medium',
      animationComplexity: 'standard',
      shadowsEnabled: false,
      blurEnabled: false,
      particleCount: 100,
    },
    listOverrides: {
      windowSize: 11,
      maxToRenderPerBatch: 5,
      initialNumToRender: 8,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 16,
        maxHeapSize: 192,
        occupancyTarget: 0.8,
      },
      enableES6Proxy: false,
      enableIntl: false,
    },
    isBuiltIn: true,
  },
  // Android Devices
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android with Snapdragon 8 Gen 3',
    platform: 'android',
    deviceTier: 'flagship',
    deviceModels: ['SM-S928'],
    minOsVersion: '14',
    specs: {
      ramGb: 12,
      cpuCores: 8,
      gpuTier: 'high_performance',
      screenDensity: 3.5,
      refreshRate: 120,
    },
    recommendedSettings: {
      targetFps: 120,
      maxMemoryMb: 512,
      imageQuality: 'high',
      animationComplexity: 'complex',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 1000,
    },
    listOverrides: {
      windowSize: 21,
      maxToRenderPerBatch: 15,
      initialNumToRender: 15,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 32,
        maxHeapSize: 512,
        occupancyTarget: 0.7,
      },
      enableES6Proxy: true,
      enableIntl: true,
    },
    isBuiltIn: true,
  },
  {
    name: 'Samsung Galaxy S23 / A54',
    description: 'High-end Android devices',
    platform: 'android',
    deviceTier: 'high_end',
    deviceModels: ['SM-S911', 'SM-A546'],
    minOsVersion: '13',
    specs: {
      ramGb: 8,
      cpuCores: 8,
      gpuTier: 'dedicated',
      screenDensity: 3,
      refreshRate: 120,
    },
    recommendedSettings: {
      targetFps: 90,
      maxMemoryMb: 384,
      imageQuality: 'high',
      animationComplexity: 'standard',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 500,
    },
    listOverrides: {
      windowSize: 15,
      maxToRenderPerBatch: 10,
      initialNumToRender: 10,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 32,
        maxHeapSize: 384,
        occupancyTarget: 0.7,
      },
      enableES6Proxy: true,
      enableIntl: true,
    },
    isBuiltIn: true,
  },
  {
    name: 'Mid-Range Android',
    description: 'Budget Android devices with 4-6GB RAM',
    platform: 'android',
    deviceTier: 'mid_range',
    deviceModels: [],
    minOsVersion: '11',
    specs: {
      ramGb: 4,
      cpuCores: 8,
      gpuTier: 'integrated',
      screenDensity: 2.5,
      refreshRate: 60,
    },
    recommendedSettings: {
      targetFps: 60,
      maxMemoryMb: 256,
      imageQuality: 'medium',
      animationComplexity: 'standard',
      shadowsEnabled: false,
      blurEnabled: false,
      particleCount: 200,
    },
    listOverrides: {
      windowSize: 11,
      maxToRenderPerBatch: 5,
      initialNumToRender: 8,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 16,
        maxHeapSize: 256,
        occupancyTarget: 0.75,
      },
      enableES6Proxy: false,
      enableIntl: false,
    },
    isBuiltIn: true,
  },
  {
    name: 'Low-End Android',
    description: 'Entry-level Android devices with 2-3GB RAM',
    platform: 'android',
    deviceTier: 'low_end',
    deviceModels: [],
    minOsVersion: '10',
    specs: {
      ramGb: 2,
      cpuCores: 4,
      gpuTier: 'integrated',
      screenDensity: 2,
      refreshRate: 60,
    },
    recommendedSettings: {
      targetFps: 30,
      maxMemoryMb: 128,
      imageQuality: 'low',
      animationComplexity: 'simple',
      shadowsEnabled: false,
      blurEnabled: false,
      particleCount: 50,
    },
    listOverrides: {
      windowSize: 7,
      maxToRenderPerBatch: 3,
      initialNumToRender: 5,
    },
    hermesConfig: {
      gcConfig: {
        minHeapSize: 8,
        maxHeapSize: 128,
        occupancyTarget: 0.85,
      },
      enableES6Proxy: false,
      enableIntl: false,
    },
    isBuiltIn: true,
  },
];

// ============================================================================
// DEVICE CONFIG MANAGEMENT
// ============================================================================

/**
 * Get all device configurations
 */
export async function getAllDeviceConfigs(
  options: { platform?: Platform } = {}
): Promise<DeviceConfig[]> {
  const conditions = [];

  if (options.platform) {
    conditions.push(eq(deviceConfigs.platform, options.platform));
  }

  return db
    .select()
    .from(deviceConfigs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .execute();
}

/**
 * Get device config by ID
 */
export async function getDeviceConfig(configId: string): Promise<DeviceConfig | null> {
  const [config] = await db
    .select()
    .from(deviceConfigs)
    .where(eq(deviceConfigs.id, configId))
    .execute();

  return config ?? null;
}

/**
 * Get config for a specific device tier and platform
 */
export async function getConfigForDevice(
  platform: Platform,
  tier: DeviceTier
): Promise<DeviceConfig | null> {
  const [config] = await db
    .select()
    .from(deviceConfigs)
    .where(
      and(
        eq(deviceConfigs.platform, platform),
        eq(deviceConfigs.deviceTier, tier)
      )
    )
    .execute();

  return config ?? null;
}

/**
 * Create a custom device config
 */
export async function createDeviceConfig(
  data: Omit<NewDeviceConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DeviceConfig> {
  const [config] = await db.insert(deviceConfigs).values(data).returning();
  return config;
}

/**
 * Update a device config
 */
export async function updateDeviceConfig(
  configId: string,
  updates: Partial<NewDeviceConfig>
): Promise<DeviceConfig | null> {
  const [updated] = await db
    .update(deviceConfigs)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(deviceConfigs.id, configId))
    .returning();

  return updated ?? null;
}

/**
 * Initialize built-in device configs
 */
export async function initializeBuiltInConfigs(): Promise<number> {
  let count = 0;

  for (const config of BUILT_IN_DEVICE_CONFIGS) {
    const existing = await db
      .select()
      .from(deviceConfigs)
      .where(
        and(
          eq(deviceConfigs.name, config.name),
          eq(deviceConfigs.isBuiltIn, true)
        )
      )
      .execute();

    if (existing.length === 0) {
      await db.insert(deviceConfigs).values(config);
      count++;
    }
  }

  return count;
}

// ============================================================================
// OFFLINE CONFIG MANAGEMENT
// ============================================================================

/**
 * Create offline configuration
 */
export async function createOfflineConfig(
  data: Omit<NewOfflineConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OfflineConfig> {
  const [config] = await db.insert(offlineConfigs).values(data).returning();
  return config;
}

/**
 * Get offline config for a profile
 */
export async function getOfflineConfig(
  profileId: string
): Promise<OfflineConfig | null> {
  const [config] = await db
    .select()
    .from(offlineConfigs)
    .where(eq(offlineConfigs.profileId, profileId))
    .execute();

  return config ?? null;
}

/**
 * Update offline config
 */
export async function updateOfflineConfig(
  configId: string,
  updates: Partial<NewOfflineConfig>
): Promise<OfflineConfig | null> {
  const [updated] = await db
    .update(offlineConfigs)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(offlineConfigs.id, configId))
    .returning();

  return updated ?? null;
}

// ============================================================================
// DEVICE DETECTION & TUNING
// ============================================================================

/**
 * Detect device tier from user agent and specs
 */
export function detectDeviceTier(
  platform: Platform,
  ramGb?: number,
  cpuCores?: number
): DeviceTier {
  if (!ramGb || !cpuCores) {
    return 'mid_range';
  }

  if (platform === 'ios') {
    if (ramGb >= 6) return 'flagship';
    if (ramGb >= 4) return 'high_end';
    if (ramGb >= 3) return 'mid_range';
    return 'low_end';
  }

  // Android
  if (ramGb >= 8 && cpuCores >= 8) return 'flagship';
  if (ramGb >= 6 && cpuCores >= 6) return 'high_end';
  if (ramGb >= 4) return 'mid_range';
  return 'low_end';
}

/**
 * Get tuned settings for a device
 */
export async function getTunedSettings(
  platform: Platform,
  tier: DeviceTier
): Promise<RecommendedSettings> {
  const config = await getConfigForDevice(platform, tier);

  if (config?.recommendedSettings) {
    return config.recommendedSettings as RecommendedSettings;
  }

  // Fallback defaults
  const defaults: Record<DeviceTier, RecommendedSettings> = {
    flagship: {
      targetFps: 120,
      maxMemoryMb: 512,
      imageQuality: 'high',
      animationComplexity: 'complex',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 1000,
    },
    high_end: {
      targetFps: 60,
      maxMemoryMb: 384,
      imageQuality: 'high',
      animationComplexity: 'complex',
      shadowsEnabled: true,
      blurEnabled: true,
      particleCount: 500,
    },
    mid_range: {
      targetFps: 60,
      maxMemoryMb: 256,
      imageQuality: 'medium',
      animationComplexity: 'standard',
      shadowsEnabled: false,
      blurEnabled: false,
      particleCount: 200,
    },
    low_end: {
      targetFps: 30,
      maxMemoryMb: 128,
      imageQuality: 'low',
      animationComplexity: 'simple',
      shadowsEnabled: false,
      blurEnabled: false,
      particleCount: 50,
    },
  };

  return defaults[tier];
}

/**
 * Generate app.json config for device
 */
export function generateAppConfig(
  platform: Platform,
  settings: RecommendedSettings,
  hermesConfig?: HermesConfig
): string {
  const config = {
    expo: {
      jsEngine: 'hermes',
      android:
        platform !== 'ios'
          ? {
              jsEngine: 'hermes',
              enableHermes: true,
              hermesCommand: hermesConfig
                ? `./node_modules/react-native/sdks/hermesc/osx-bin/hermesc -O -emit-binary -output-source-map -max-heap-size=${hermesConfig.gcConfig.maxHeapSize}`
                : undefined,
            }
          : undefined,
      ios:
        platform !== 'android'
          ? {
              jsEngine: 'hermes',
            }
          : undefined,
      plugins: [
        [
          'expo-build-properties',
          {
            android: {
              enableProguardInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
            },
            ios: {
              flipper: false, // Disable Flipper in production for performance
            },
          },
        ],
      ],
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate offline sync code
 */
export function generateOfflineSyncCode(config: OfflineDataPolicies): string {
  return `import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineSyncManager {
  private queue: Array<{ endpoint: string; data: any; timestamp: number }> = [];
  private isOnline = true;

  constructor() {
    this.initNetworkListener();
    this.loadQueue();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline && ${config.syncOnReconnect}) {
        this.processQueue();
      }
    });
  }

  private async loadQueue() {
    try {
      const saved = await AsyncStorage.getItem('offline_queue');
      if (saved) this.queue = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load offline queue:', e);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  async syncData(endpoint: string, data: any) {
    if (this.isOnline) {
      return this.sendRequest(endpoint, data);
    }

    // Queue for later
    this.queue.push({ endpoint, data, timestamp: Date.now() });
    await this.saveQueue();
    return { queued: true };
  }

  private async sendRequest(endpoint: string, data: any, retries = 0) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      if (retries < ${config.retryConfig.maxRetries}) {
        const delay = ${config.retryConfig.exponentialBackoff}
          ? ${config.retryConfig.backoffMs} * Math.pow(2, retries)
          : ${config.retryConfig.backoffMs};
        await new Promise(r => setTimeout(r, delay));
        return this.sendRequest(endpoint, data, retries + 1);
      }
      throw error;
    }
  }

  private async processQueue() {
    const toProcess = [...this.queue];
    this.queue = [];

    for (const item of toProcess) {
      try {
        await this.sendRequest(item.endpoint, item.data);
      } catch (e) {
        this.queue.push(item); // Re-queue failed items
      }
    }

    await this.saveQueue();
  }
}

export const offlineSync = new OfflineSyncManager();
`;
}
