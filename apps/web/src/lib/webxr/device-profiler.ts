/**
 * WebXR Device Profiler
 *
 * Implements pack-webxr-001 §3.3 (Device Profile Service).
 * Manages device profiles and optimization recommendations.
 *
 * Features:
 * - Device detection and profiling
 * - Performance recommendations
 * - Cross-device optimization
 * - Capability mapping
 *
 * @see pack-webxr-001 for architecture details
 */

import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { xrDeviceProfiles, type XrDeviceProfile, type NewXrDeviceProfile } from '@/db/schema/webxr';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceType =
  | 'quest_2'
  | 'quest_3'
  | 'quest_pro'
  | 'vision_pro'
  | 'pico_4'
  | 'vive_xr_elite'
  | 'mobile_ar_ios'
  | 'mobile_ar_android'
  | 'desktop_vr'
  | 'desktop_ar'
  | 'generic_vr'
  | 'generic_ar';

export type GpuTier = 'low' | 'medium' | 'high' | 'ultra';
export type QualitySetting = 'off' | 'low' | 'medium' | 'high';
export type AntialiasingSetting = 'none' | 'fxaa' | 'msaa2x' | 'msaa4x';

export interface PerformanceSpec {
  gpuTier: GpuTier;
  maxTriangles: number;
  maxDrawCalls: number;
  maxTextureSize: number;
  maxLights: number;
  supportsInstancing: boolean;
  supportsCompute: boolean;
}

export interface RecommendedSettings {
  targetFps: number;
  renderScale: number;
  shadowQuality: QualitySetting;
  antialiasing: AntialiasingSetting;
  textureQuality: QualitySetting;
  lodBias: number;
}

export interface DisplayConfig {
  resolution: [number, number];
  refreshRates: number[];
  fov: number;
  ipd?: { min: number; max: number; default: number };
}

export interface InputCapabilities {
  controllers: boolean;
  handTracking: boolean;
  eyeTracking: boolean;
  voiceInput: boolean;
  touchpad: boolean;
  gestures: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Built-in device profiles
 */
export const BUILT_IN_PROFILES: Record<DeviceType, Omit<NewXrDeviceProfile, 'id' | 'createdAt' | 'updatedAt'>> = {
  quest_2: {
    deviceType: 'quest_2',
    deviceName: 'Meta Quest 2',
    manufacturer: 'Meta',
    displayConfig: {
      resolution: [1832, 1920],
      refreshRates: [72, 90, 120],
      fov: 89,
      ipd: { min: 58, max: 68, default: 63 },
    },
    inputCapabilities: {
      controllers: true,
      handTracking: true,
      eyeTracking: false,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point'],
    },
    performanceSpec: {
      gpuTier: 'medium',
      maxTriangles: 750000,
      maxDrawCalls: 100,
      maxTextureSize: 2048,
      maxLights: 4,
      supportsInstancing: true,
      supportsCompute: false,
    },
    recommendedSettings: {
      targetFps: 72,
      renderScale: 1.0,
      shadowQuality: 'low',
      antialiasing: 'msaa2x',
      textureQuality: 'medium',
      lodBias: 1.0,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor'],
      optionalFeatures: ['hand-tracking', 'layers'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  quest_3: {
    deviceType: 'quest_3',
    deviceName: 'Meta Quest 3',
    manufacturer: 'Meta',
    displayConfig: {
      resolution: [2064, 2208],
      refreshRates: [72, 90, 120],
      fov: 110,
      ipd: { min: 53, max: 75, default: 63 },
    },
    inputCapabilities: {
      controllers: true,
      handTracking: true,
      eyeTracking: false,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point', 'poke'],
    },
    performanceSpec: {
      gpuTier: 'high',
      maxTriangles: 1500000,
      maxDrawCalls: 200,
      maxTextureSize: 4096,
      maxLights: 8,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 90,
      renderScale: 1.2,
      shadowQuality: 'medium',
      antialiasing: 'msaa4x',
      textureQuality: 'high',
      lodBias: 0.8,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor', 'unbounded'],
      optionalFeatures: ['hand-tracking', 'layers', 'plane-detection', 'mesh-detection', 'depth-sensing'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  quest_pro: {
    deviceType: 'quest_pro',
    deviceName: 'Meta Quest Pro',
    manufacturer: 'Meta',
    displayConfig: {
      resolution: [1800, 1920],
      refreshRates: [72, 90],
      fov: 106,
      ipd: { min: 55, max: 75, default: 63 },
    },
    inputCapabilities: {
      controllers: true,
      handTracking: true,
      eyeTracking: true,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point', 'gaze'],
    },
    performanceSpec: {
      gpuTier: 'high',
      maxTriangles: 1200000,
      maxDrawCalls: 150,
      maxTextureSize: 4096,
      maxLights: 8,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 90,
      renderScale: 1.0,
      shadowQuality: 'medium',
      antialiasing: 'msaa4x',
      textureQuality: 'high',
      lodBias: 0.8,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor', 'unbounded'],
      optionalFeatures: ['hand-tracking', 'layers', 'eye-tracking', 'plane-detection'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  vision_pro: {
    deviceType: 'vision_pro',
    deviceName: 'Apple Vision Pro',
    manufacturer: 'Apple',
    displayConfig: {
      resolution: [3660, 3200],
      refreshRates: [90, 96, 100],
      fov: 100,
    },
    inputCapabilities: {
      controllers: false,
      handTracking: true,
      eyeTracking: true,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point', 'gaze', 'double_pinch', 'drag'],
    },
    performanceSpec: {
      gpuTier: 'ultra',
      maxTriangles: 3000000,
      maxDrawCalls: 500,
      maxTextureSize: 8192,
      maxLights: 16,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 90,
      renderScale: 1.5,
      shadowQuality: 'high',
      antialiasing: 'msaa4x',
      textureQuality: 'high',
      lodBias: 0.5,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'unbounded'],
      optionalFeatures: ['hand-tracking', 'mesh-detection', 'plane-detection'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      minSafariVersion: 17,
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  pico_4: {
    deviceType: 'pico_4',
    deviceName: 'PICO 4',
    manufacturer: 'PICO',
    displayConfig: {
      resolution: [2160, 2160],
      refreshRates: [72, 90],
      fov: 105,
      ipd: { min: 58, max: 72, default: 64 },
    },
    inputCapabilities: {
      controllers: true,
      handTracking: true,
      eyeTracking: false,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point'],
    },
    performanceSpec: {
      gpuTier: 'medium',
      maxTriangles: 1000000,
      maxDrawCalls: 150,
      maxTextureSize: 4096,
      maxLights: 6,
      supportsInstancing: true,
      supportsCompute: false,
    },
    recommendedSettings: {
      targetFps: 72,
      renderScale: 1.0,
      shadowQuality: 'low',
      antialiasing: 'msaa2x',
      textureQuality: 'medium',
      lodBias: 1.0,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor'],
      optionalFeatures: ['hand-tracking'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  vive_xr_elite: {
    deviceType: 'vive_xr_elite',
    deviceName: 'HTC VIVE XR Elite',
    manufacturer: 'HTC',
    displayConfig: {
      resolution: [1920, 1920],
      refreshRates: [90],
      fov: 110,
      ipd: { min: 54, max: 73, default: 64 },
    },
    inputCapabilities: {
      controllers: true,
      handTracking: true,
      eyeTracking: false,
      voiceInput: true,
      touchpad: false,
      gestures: ['pinch', 'grab', 'point'],
    },
    performanceSpec: {
      gpuTier: 'high',
      maxTriangles: 1200000,
      maxDrawCalls: 150,
      maxTextureSize: 4096,
      maxLights: 8,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 90,
      renderScale: 1.0,
      shadowQuality: 'medium',
      antialiasing: 'msaa4x',
      textureQuality: 'high',
      lodBias: 0.8,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor'],
      optionalFeatures: ['hand-tracking', 'plane-detection'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  mobile_ar_ios: {
    deviceType: 'mobile_ar_ios',
    deviceName: 'iOS AR Device',
    manufacturer: 'Apple',
    displayConfig: {
      resolution: [1170, 2532],
      refreshRates: [60, 120],
      fov: 60,
    },
    inputCapabilities: {
      controllers: false,
      handTracking: false,
      eyeTracking: false,
      voiceInput: true,
      touchpad: true,
      gestures: ['tap', 'drag', 'pinch_zoom'],
    },
    performanceSpec: {
      gpuTier: 'medium',
      maxTriangles: 500000,
      maxDrawCalls: 100,
      maxTextureSize: 4096,
      maxLights: 4,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 60,
      renderScale: 1.0,
      shadowQuality: 'low',
      antialiasing: 'fxaa',
      textureQuality: 'medium',
      lodBias: 1.5,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'unbounded'],
      optionalFeatures: ['hit-test', 'plane-detection', 'anchors', 'light-estimation'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'mobile',
    browserRequirements: {
      minSafariVersion: 15,
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  mobile_ar_android: {
    deviceType: 'mobile_ar_android',
    deviceName: 'Android AR Device',
    manufacturer: 'Various',
    displayConfig: {
      resolution: [1080, 2400],
      refreshRates: [60, 90, 120],
      fov: 60,
    },
    inputCapabilities: {
      controllers: false,
      handTracking: false,
      eyeTracking: false,
      voiceInput: true,
      touchpad: true,
      gestures: ['tap', 'drag', 'pinch_zoom'],
    },
    performanceSpec: {
      gpuTier: 'medium',
      maxTriangles: 400000,
      maxDrawCalls: 80,
      maxTextureSize: 2048,
      maxLights: 4,
      supportsInstancing: true,
      supportsCompute: false,
    },
    recommendedSettings: {
      targetFps: 60,
      renderScale: 0.9,
      shadowQuality: 'low',
      antialiasing: 'fxaa',
      textureQuality: 'medium',
      lodBias: 1.5,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'unbounded'],
      optionalFeatures: ['hit-test', 'plane-detection', 'anchors', 'light-estimation', 'depth-sensing'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'mobile',
    browserRequirements: {
      minChromeVersion: 79,
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  desktop_vr: {
    deviceType: 'desktop_vr',
    deviceName: 'Desktop VR (PCVR)',
    manufacturer: 'Various',
    displayConfig: {
      resolution: [2160, 2160],
      refreshRates: [90, 120, 144],
      fov: 110,
    },
    inputCapabilities: {
      controllers: true,
      handTracking: false,
      eyeTracking: false,
      voiceInput: true,
      touchpad: true,
      gestures: ['grab', 'point'],
    },
    performanceSpec: {
      gpuTier: 'ultra',
      maxTriangles: 5000000,
      maxDrawCalls: 1000,
      maxTextureSize: 8192,
      maxLights: 32,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 90,
      renderScale: 1.5,
      shadowQuality: 'high',
      antialiasing: 'msaa4x',
      textureQuality: 'high',
      lodBias: 0.5,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor', 'bounded-floor'],
      optionalFeatures: ['layers'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'pcvr',
    browserRequirements: {
      minChromeVersion: 79,
      minFirefoxVersion: 98,
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  desktop_ar: {
    deviceType: 'desktop_ar',
    deviceName: 'Desktop AR (Webcam)',
    manufacturer: 'Various',
    displayConfig: {
      resolution: [1920, 1080],
      refreshRates: [60],
      fov: 60,
    },
    inputCapabilities: {
      controllers: false,
      handTracking: false,
      eyeTracking: false,
      voiceInput: true,
      touchpad: false,
      gestures: [],
    },
    performanceSpec: {
      gpuTier: 'high',
      maxTriangles: 2000000,
      maxDrawCalls: 500,
      maxTextureSize: 4096,
      maxLights: 16,
      supportsInstancing: true,
      supportsCompute: true,
    },
    recommendedSettings: {
      targetFps: 60,
      renderScale: 1.0,
      shadowQuality: 'medium',
      antialiasing: 'msaa2x',
      textureQuality: 'high',
      lodBias: 1.0,
    },
    webxrFeatures: {
      supportedSessionModes: ['inline'],
      supportedReferenceSpaces: ['viewer', 'local'],
      optionalFeatures: ['camera-access'],
      requiredFeatures: [],
    },
    platform: 'browser',
    browserRequirements: {
      minChromeVersion: 79,
      requiresSecureContext: true,
    },
    isDefault: false,
  },

  generic_vr: {
    deviceType: 'generic_vr',
    deviceName: 'Generic VR Device',
    manufacturer: 'Unknown',
    displayConfig: {
      resolution: [1440, 1600],
      refreshRates: [72],
      fov: 90,
    },
    inputCapabilities: {
      controllers: true,
      handTracking: false,
      eyeTracking: false,
      voiceInput: false,
      touchpad: false,
      gestures: ['grab'],
    },
    performanceSpec: {
      gpuTier: 'low',
      maxTriangles: 300000,
      maxDrawCalls: 50,
      maxTextureSize: 2048,
      maxLights: 2,
      supportsInstancing: false,
      supportsCompute: false,
    },
    recommendedSettings: {
      targetFps: 72,
      renderScale: 0.8,
      shadowQuality: 'off',
      antialiasing: 'none',
      textureQuality: 'low',
      lodBias: 2.0,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-vr', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor'],
      optionalFeatures: [],
      requiredFeatures: ['local-floor'],
    },
    platform: 'standalone',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: true,
  },

  generic_ar: {
    deviceType: 'generic_ar',
    deviceName: 'Generic AR Device',
    manufacturer: 'Unknown',
    displayConfig: {
      resolution: [1080, 1920],
      refreshRates: [60],
      fov: 60,
    },
    inputCapabilities: {
      controllers: false,
      handTracking: false,
      eyeTracking: false,
      voiceInput: false,
      touchpad: true,
      gestures: ['tap'],
    },
    performanceSpec: {
      gpuTier: 'low',
      maxTriangles: 200000,
      maxDrawCalls: 40,
      maxTextureSize: 1024,
      maxLights: 2,
      supportsInstancing: false,
      supportsCompute: false,
    },
    recommendedSettings: {
      targetFps: 30,
      renderScale: 0.7,
      shadowQuality: 'off',
      antialiasing: 'none',
      textureQuality: 'low',
      lodBias: 2.0,
    },
    webxrFeatures: {
      supportedSessionModes: ['immersive-ar', 'inline'],
      supportedReferenceSpaces: ['local', 'local-floor'],
      optionalFeatures: ['hit-test'],
      requiredFeatures: ['local-floor'],
    },
    platform: 'mobile',
    browserRequirements: {
      requiresSecureContext: true,
    },
    isDefault: true,
  },
};

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Get device profile by type
 */
export async function getDeviceProfile(deviceType: DeviceType): Promise<XrDeviceProfile | null> {
  // First check database
  const [profile] = await db
    .select()
    .from(xrDeviceProfiles)
    .where(eq(xrDeviceProfiles.deviceType, deviceType))
    .execute();

  if (profile) return profile;

  // Fall back to built-in
  const builtIn = BUILT_IN_PROFILES[deviceType];
  return builtIn ? ({ ...builtIn, id: `builtin-${deviceType}` } as XrDeviceProfile) : null;
}

/**
 * Get all device profiles
 */
export async function getAllDeviceProfiles(): Promise<XrDeviceProfile[]> {
  const dbProfiles = await db.select().from(xrDeviceProfiles).execute();

  // Merge with built-in profiles
  const dbDeviceTypes = new Set(dbProfiles.map((p) => p.deviceType));
  const builtInProfiles = Object.entries(BUILT_IN_PROFILES)
    .filter(([type]) => !dbDeviceTypes.has(type as DeviceType))
    .map(([type, profile]) => ({
      ...profile,
      id: `builtin-${type}`,
    })) as XrDeviceProfile[];

  return [...dbProfiles, ...builtInProfiles];
}

/**
 * Create custom device profile
 */
export async function createDeviceProfile(
  data: Omit<NewXrDeviceProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<XrDeviceProfile> {
  const [profile] = await db.insert(xrDeviceProfiles).values(data).returning();
  return profile;
}

/**
 * Update device profile
 */
export async function updateDeviceProfile(
  profileId: string,
  updates: Partial<Omit<XrDeviceProfile, 'id' | 'createdAt'>>
): Promise<XrDeviceProfile | null> {
  const [updated] = await db
    .update(xrDeviceProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(xrDeviceProfiles.id, profileId))
    .returning();

  return updated ?? null;
}

// ============================================================================
// OPTIMIZATION
// ============================================================================

/**
 * Get optimal settings for device and scene complexity
 */
export function getOptimalSettings(
  profile: XrDeviceProfile,
  sceneComplexity: {
    triangleCount: number;
    drawCalls: number;
    lightCount: number;
    textureMemoryMb: number;
  }
): RecommendedSettings {
  const perf = profile.performanceSpec as PerformanceSpec;
  const base = profile.recommendedSettings as RecommendedSettings;

  // Calculate complexity ratios
  const triangleRatio = sceneComplexity.triangleCount / perf.maxTriangles;
  const drawCallRatio = sceneComplexity.drawCalls / perf.maxDrawCalls;
  const lightRatio = sceneComplexity.lightCount / perf.maxLights;

  const maxRatio = Math.max(triangleRatio, drawCallRatio, lightRatio);

  // If scene is within budget, use base settings
  if (maxRatio <= 1.0) {
    return base;
  }

  // Otherwise, reduce quality to compensate
  const reduction = Math.min(maxRatio, 2.0);

  return {
    targetFps: base.targetFps,
    renderScale: Math.max(base.renderScale / reduction, 0.5),
    shadowQuality: reduction > 1.5 ? 'off' : reduction > 1.2 ? 'low' : base.shadowQuality,
    antialiasing: reduction > 1.3 ? 'none' : reduction > 1.1 ? 'fxaa' : base.antialiasing,
    textureQuality: reduction > 1.5 ? 'low' : base.textureQuality,
    lodBias: base.lodBias * reduction,
  };
}

/**
 * Get performance budget for device
 */
export function getPerformanceBudget(deviceType: DeviceType): {
  maxTriangles: number;
  maxDrawCalls: number;
  maxLights: number;
  maxTextureMemoryMb: number;
  targetFrameTimeMs: number;
} {
  const profile = BUILT_IN_PROFILES[deviceType] ?? BUILT_IN_PROFILES.generic_vr;
  const perf = profile.performanceSpec as PerformanceSpec;
  const settings = profile.recommendedSettings as RecommendedSettings;

  return {
    maxTriangles: perf.maxTriangles,
    maxDrawCalls: perf.maxDrawCalls,
    maxLights: perf.maxLights,
    maxTextureMemoryMb:
      (perf.maxTextureSize * perf.maxTextureSize * 4 * 10) / (1024 * 1024), // Rough estimate
    targetFrameTimeMs: 1000 / settings.targetFps,
  };
}

/**
 * Analyze scene for optimization opportunities
 */
export function analyzeScenePerformance(
  deviceType: DeviceType,
  sceneMetrics: {
    triangleCount: number;
    drawCalls: number;
    lightCount: number;
    textureMemoryMb: number;
    currentFps: number;
  }
): {
  status: 'optimal' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
} {
  const budget = getPerformanceBudget(deviceType);
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check triangle count
  if (sceneMetrics.triangleCount > budget.maxTriangles) {
    issues.push(`Triangle count (${sceneMetrics.triangleCount}) exceeds budget (${budget.maxTriangles})`);
    recommendations.push('Enable LOD (Level of Detail) for complex meshes');
    recommendations.push('Consider using imposters for distant objects');
  } else if (sceneMetrics.triangleCount > budget.maxTriangles * 0.8) {
    issues.push('Triangle count approaching budget limit');
    recommendations.push('Monitor triangle count as scene grows');
  }

  // Check draw calls
  if (sceneMetrics.drawCalls > budget.maxDrawCalls) {
    issues.push(`Draw calls (${sceneMetrics.drawCalls}) exceed budget (${budget.maxDrawCalls})`);
    recommendations.push('Enable mesh instancing for repeated objects');
    recommendations.push('Merge static meshes where possible');
    recommendations.push('Use texture atlases to reduce material count');
  }

  // Check lights
  if (sceneMetrics.lightCount > budget.maxLights) {
    issues.push(`Light count (${sceneMetrics.lightCount}) exceeds budget (${budget.maxLights})`);
    recommendations.push('Bake static lighting into lightmaps');
    recommendations.push('Use light probes instead of real-time lights');
  }

  // Check FPS
  const targetFps = (BUILT_IN_PROFILES[deviceType]?.recommendedSettings as RecommendedSettings)?.targetFps ?? 72;
  if (sceneMetrics.currentFps < targetFps * 0.9) {
    issues.push(`Current FPS (${sceneMetrics.currentFps}) below target (${targetFps})`);
    recommendations.push('Reduce render scale temporarily');
    recommendations.push('Disable shadows on mobile devices');
  }

  // Determine status
  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (issues.length > 2 || sceneMetrics.currentFps < targetFps * 0.7) {
    status = 'critical';
  } else if (issues.length > 0) {
    status = 'warning';
  }

  return { status, issues, recommendations };
}

/**
 * Get cross-platform compatibility matrix
 */
export function getCompatibilityMatrix(
  featureRequirements: string[]
): Record<DeviceType, { compatible: boolean; missingFeatures: string[] }> {
  const matrix: Record<DeviceType, { compatible: boolean; missingFeatures: string[] }> = {} as any;

  for (const [deviceType, profile] of Object.entries(BUILT_IN_PROFILES)) {
    const webxr = profile.webxrFeatures as {
      supportedSessionModes: string[];
      optionalFeatures: string[];
      requiredFeatures: string[];
    };
    const availableFeatures = [
      ...webxr.supportedSessionModes,
      ...webxr.optionalFeatures,
      ...webxr.requiredFeatures,
    ];

    const missingFeatures = featureRequirements.filter(
      (f) => !availableFeatures.includes(f)
    );

    matrix[deviceType as DeviceType] = {
      compatible: missingFeatures.length === 0,
      missingFeatures,
    };
  }

  return matrix;
}
