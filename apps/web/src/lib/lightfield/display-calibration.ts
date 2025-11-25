/**
 * Display Calibration Service
 *
 * Implements hardware-specific calibration (pack-lfd-001 §3.4).
 * Manages Looking Glass display profiles and rendering parameters.
 *
 * Features:
 * - Pre-configured profiles for all Looking Glass models
 * - User calibration adjustments
 * - Quality presets for performance tuning
 * - Viewing zone optimization
 *
 * @see pack-lfd-001 for hardware specifications
 */

import { db } from '@/lib/db';
import { eq, and, or } from 'drizzle-orm';
import {
  displayProfiles,
  type DisplayProfile,
  type NewDisplayProfile,
} from '@/db/schema/lightfield';

// ============================================================================
// TYPES
// ============================================================================

export type DisplayModel = 'portrait' | 'lg_16' | 'lg_27' | 'lg_32' | 'lg_65' | 'lg_86' | 'custom';

export interface HardwareSpecs {
  screenWidth: number; // mm
  screenHeight: number; // mm
  resolution: { width: number; height: number };
  aspectRatio: number;
  subpixelLayout: 'rgb' | 'rbg' | 'bgr' | 'brg';
  lenticularPitch: number; // mm
  optimalViewingDistance: number; // cm
}

export interface RenderParams {
  viewCount: number;
  viewCone: number;
  depthFactor: number;
  focusDistance: number;
  nearClip: number;
  farClip: number;
  tilt: number;
}

export interface QualityPreset {
  viewCount: number;
  resolution: number; // multiplier
}

export interface CalibrationData {
  centerView: number;
  viewOffset: number;
  pitchCorrection: number;
  slopeCorrection: number;
  calibratedAt?: string;
}

// ============================================================================
// DEFAULT HARDWARE PROFILES
// ============================================================================

/**
 * Factory specifications for Looking Glass displays
 */
export const DEFAULT_HARDWARE_SPECS: Record<DisplayModel, HardwareSpecs> = {
  portrait: {
    screenWidth: 158, // mm
    screenHeight: 210,
    resolution: { width: 1536, height: 2048 },
    aspectRatio: 0.75,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.152,
    optimalViewingDistance: 50, // cm
  },
  lg_16: {
    screenWidth: 354,
    screenHeight: 199,
    resolution: { width: 2560, height: 1440 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.168,
    optimalViewingDistance: 60,
  },
  lg_27: {
    screenWidth: 597,
    screenHeight: 336,
    resolution: { width: 3840, height: 2160 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.203,
    optimalViewingDistance: 80,
  },
  lg_32: {
    screenWidth: 697,
    screenHeight: 392,
    resolution: { width: 3840, height: 2160 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.236,
    optimalViewingDistance: 100,
  },
  lg_65: {
    screenWidth: 1428,
    screenHeight: 804,
    resolution: { width: 7680, height: 4320 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.5,
    optimalViewingDistance: 200,
  },
  lg_86: {
    screenWidth: 1895,
    screenHeight: 1067,
    resolution: { width: 7680, height: 4320 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.65,
    optimalViewingDistance: 300,
  },
  custom: {
    screenWidth: 300,
    screenHeight: 200,
    resolution: { width: 1920, height: 1080 },
    aspectRatio: 1.78,
    subpixelLayout: 'rgb',
    lenticularPitch: 0.2,
    optimalViewingDistance: 60,
  },
};

/**
 * Default render parameters per display
 */
export const DEFAULT_RENDER_PARAMS: Record<DisplayModel, RenderParams> = {
  portrait: {
    viewCount: 45,
    viewCone: 40,
    depthFactor: 1.0,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 100,
    tilt: 0,
  },
  lg_16: {
    viewCount: 48,
    viewCone: 50,
    depthFactor: 1.2,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 100,
    tilt: 0,
  },
  lg_27: {
    viewCount: 60,
    viewCone: 53,
    depthFactor: 1.2,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 100,
    tilt: 0,
  },
  lg_32: {
    viewCount: 60,
    viewCone: 53,
    depthFactor: 1.3,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 100,
    tilt: 0,
  },
  lg_65: {
    viewCount: 100,
    viewCone: 53,
    depthFactor: 1.5,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 200,
    tilt: 0,
  },
  lg_86: {
    viewCount: 100,
    viewCone: 53,
    depthFactor: 1.5,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 300,
    tilt: 0,
  },
  custom: {
    viewCount: 45,
    viewCone: 40,
    depthFactor: 1.0,
    focusDistance: 0,
    nearClip: 0.1,
    farClip: 100,
    tilt: 0,
  },
};

/**
 * Quality presets for performance tuning
 */
export const DEFAULT_QUALITY_PRESETS: Record<string, Record<string, QualityPreset>> = {
  portrait: {
    low: { viewCount: 32, resolution: 0.5 },
    medium: { viewCount: 45, resolution: 0.75 },
    high: { viewCount: 45, resolution: 1.0 },
    ultra: { viewCount: 100, resolution: 1.0 },
  },
  landscape: {
    low: { viewCount: 32, resolution: 0.5 },
    medium: { viewCount: 48, resolution: 0.75 },
    high: { viewCount: 60, resolution: 1.0 },
    ultra: { viewCount: 100, resolution: 1.0 },
  },
};

// ============================================================================
// DISPLAY PROFILE MANAGEMENT
// ============================================================================

/**
 * Get or create default profile for a display model
 */
export async function getOrCreateDefaultProfile(
  displayModel: DisplayModel
): Promise<DisplayProfile> {
  // Check for existing default
  const [existing] = await db
    .select()
    .from(displayProfiles)
    .where(
      and(
        eq(displayProfiles.displayModel, displayModel),
        eq(displayProfiles.isDefault, true),
        eq(displayProfiles.ownerId, '')
      )
    )
    .limit(1)
    .execute();

  if (existing) return existing;

  // Create default profile
  const profile = await createDisplayProfile({
    name: `${displayModel} Default`,
    displayModel,
    isDefault: true,
    hardwareSpecs: DEFAULT_HARDWARE_SPECS[displayModel],
    renderParams: DEFAULT_RENDER_PARAMS[displayModel],
    qualityPresets: displayModel === 'portrait'
      ? DEFAULT_QUALITY_PRESETS.portrait
      : DEFAULT_QUALITY_PRESETS.landscape,
  });

  return profile;
}

/**
 * Create a display profile
 */
export async function createDisplayProfile(
  data: Omit<NewDisplayProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DisplayProfile> {
  const [profile] = await db
    .insert(displayProfiles)
    .values(data)
    .returning()
    .execute();

  return profile;
}

/**
 * Get display profile by ID
 */
export async function getDisplayProfile(id: string): Promise<DisplayProfile | null> {
  const [profile] = await db
    .select()
    .from(displayProfiles)
    .where(eq(displayProfiles.id, id))
    .limit(1)
    .execute();

  return profile ?? null;
}

/**
 * Get user's display profiles
 */
export async function getUserDisplayProfiles(userId: string): Promise<DisplayProfile[]> {
  return db
    .select()
    .from(displayProfiles)
    .where(
      or(
        eq(displayProfiles.ownerId, userId),
        eq(displayProfiles.isDefault, true)
      )
    )
    .execute();
}

/**
 * Update display profile
 */
export async function updateDisplayProfile(
  id: string,
  data: Partial<Omit<DisplayProfile, 'id' | 'createdAt'>>
): Promise<DisplayProfile | null> {
  const [updated] = await db
    .update(displayProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(displayProfiles.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Update calibration data for a profile
 */
export async function updateCalibration(
  id: string,
  calibration: CalibrationData
): Promise<DisplayProfile | null> {
  return updateDisplayProfile(id, {
    calibrationData: {
      ...calibration,
      calibratedAt: new Date().toISOString(),
    },
  });
}

// ============================================================================
// CALIBRATION CALCULATIONS
// ============================================================================

/**
 * Calculate optimal viewing zone
 */
export function calculateViewingZone(specs: HardwareSpecs, params: RenderParams): {
  width: number; // cm
  depth: number; // cm
  optimalDistance: number; // cm
  maxViewers: number;
} {
  // Viewing zone width based on view cone
  const viewConeRad = (params.viewCone * Math.PI) / 180;
  const width = 2 * specs.optimalViewingDistance * Math.tan(viewConeRad / 2);

  // Depth is typically ±20% of optimal distance
  const depth = specs.optimalViewingDistance * 0.4;

  // Estimate max viewers (assume 50cm per person)
  const maxViewers = Math.max(1, Math.floor(width / 50));

  return {
    width: Math.round(width),
    depth: Math.round(depth),
    optimalDistance: specs.optimalViewingDistance,
    maxViewers,
  };
}

/**
 * Calculate adjusted render params for viewer position
 */
export function adjustForViewerPosition(
  params: RenderParams,
  viewerOffset: { x: number; z: number } // cm from optimal position
): RenderParams {
  // Adjust view cone center based on horizontal offset
  const adjustedCone = params.viewCone;
  const viewOffset = (viewerOffset.x / 100) * 10; // degrees

  // Adjust focus for depth offset
  const focusAdjust = viewerOffset.z * 0.01;

  return {
    ...params,
    focusDistance: params.focusDistance + focusAdjust,
    // Additional adjustments would be applied in shader
  };
}

/**
 * Calculate subpixel offset for interlacing
 */
export function calculateSubpixelOffset(
  specs: HardwareSpecs,
  params: RenderParams
): { pitch: number; slope: number; center: number } {
  // These values are typically provided by Looking Glass for each display
  // Here we estimate based on hardware specs
  const pitch = specs.lenticularPitch * params.viewCount / specs.screenWidth;
  const slope = specs.resolution.height / specs.resolution.width;
  const center = params.viewCount / 2;

  return { pitch, slope, center };
}

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Get optimal quality preset based on performance metrics
 */
export function getOptimalQuality(
  targetFps: number,
  currentFps: number,
  currentQuality: string,
  availablePresets: Record<string, QualityPreset>
): { preset: string; config: QualityPreset } {
  const qualities = ['low', 'medium', 'high', 'ultra'];
  const currentIndex = qualities.indexOf(currentQuality);

  if (currentFps < targetFps * 0.9 && currentIndex > 0) {
    // FPS too low, reduce quality
    const newQuality = qualities[currentIndex - 1];
    return { preset: newQuality, config: availablePresets[newQuality] };
  }

  if (currentFps > targetFps * 1.2 && currentIndex < qualities.length - 1) {
    // FPS too high, can increase quality
    const newQuality = qualities[currentIndex + 1];
    return { preset: newQuality, config: availablePresets[newQuality] };
  }

  return { preset: currentQuality, config: availablePresets[currentQuality] };
}

/**
 * Estimate GPU memory required for quilt rendering
 */
export function estimateGpuMemoryMB(
  specs: HardwareSpecs,
  params: RenderParams,
  resolution: number = 1.0
): number {
  const viewWidth = Math.round(specs.resolution.width * resolution);
  const viewHeight = Math.round(specs.resolution.height * resolution);
  const bytesPerPixel = 4; // RGBA

  // Quilt texture
  const quiltPixels = viewWidth * viewHeight * params.viewCount;
  const quiltMemory = quiltPixels * bytesPerPixel;

  // Framebuffer (double buffered)
  const framebufferMemory = specs.resolution.width * specs.resolution.height * bytesPerPixel * 2;

  // Depth buffer
  const depthMemory = specs.resolution.width * specs.resolution.height * 4;

  const totalBytes = quiltMemory + framebufferMemory + depthMemory;
  return Math.round(totalBytes / (1024 * 1024));
}

// ============================================================================
// DISPLAY DETECTION
// ============================================================================

/**
 * Attempt to detect connected Looking Glass display
 * (In browser context, this is limited - full detection requires native bridge)
 */
export function detectDisplayFromUserAgent(userAgent: string): DisplayModel | null {
  // Looking Glass Bridge injects info into user agent
  if (userAgent.includes('LookingGlass/Portrait')) return 'portrait';
  if (userAgent.includes('LookingGlass/16')) return 'lg_16';
  if (userAgent.includes('LookingGlass/27')) return 'lg_27';
  if (userAgent.includes('LookingGlass/32')) return 'lg_32';
  if (userAgent.includes('LookingGlass/65')) return 'lg_65';
  if (userAgent.includes('LookingGlass/86')) return 'lg_86';

  return null;
}

/**
 * Get display model from screen dimensions
 */
export function inferDisplayFromResolution(
  width: number,
  height: number
): DisplayModel | null {
  // Match against known resolutions
  const resolutions: Record<string, DisplayModel> = {
    '1536x2048': 'portrait',
    '2048x1536': 'portrait',
    '2560x1440': 'lg_16',
    '3840x2160_small': 'lg_27',
    '3840x2160_large': 'lg_32',
    '7680x4320': 'lg_65', // Could also be lg_86
  };

  const key = `${width}x${height}`;

  // Check exact matches
  if (key === '1536x2048' || key === '2048x1536') return 'portrait';
  if (key === '2560x1440') return 'lg_16';
  if (key === '7680x4320') return 'lg_65'; // Default to 65" for 8K

  // 4K could be 27" or 32"
  if (key === '3840x2160') return 'lg_27'; // Default to smaller

  return null;
}
