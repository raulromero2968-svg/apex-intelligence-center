/**
 * Device Calibration Service
 *
 * Implements pack-visionos-001 §3.3 (Device Calibration Service).
 * Manages Vision Pro calibration profiles for optimal gaze/hand tracking.
 *
 * Features:
 * - Gaze accuracy calibration
 * - Hand tracking normalization
 * - Spatial awareness settings
 * - Performance optimization
 * - Accessibility configuration
 *
 * @see pack-visionos-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import {
  deviceCalibrations,
  type DeviceCalibration,
  type NewDeviceCalibration,
} from '@/db/schema/visionos';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceType = 'vision_pro' | 'vision_pro_dev' | 'simulator';

export interface GazeCalibration {
  horizontalOffset: number;
  verticalOffset: number;
  accuracy: number;
  dwellRadius: number;
  dwellTime: number;
  dwellFalloff: number;
  smoothingFactor: number;
  predictionHorizon: number;
}

export interface HandCalibration {
  leftHandScale: number;
  rightHandScale: number;
  pinchThreshold: number;
  pinchHysteresis: number;
  minConfidence: number;
  smoothingFactor: number;
  workspaceBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface SpatialCalibration {
  floorHeight: number;
  ceilingHeight: number;
  minViewDistance: number;
  maxViewDistance: number;
  preferredContentDistance: number;
  motionSensitivity: number;
  rotationSpeed: number;
}

export interface PerformanceProfile {
  targetFrameRate: 90 | 96 | 120;
  renderScale: number;
  foveatedRendering: boolean;
  foveationLevel: 'low' | 'medium' | 'high';
  dynamicResolution: boolean;
}

export interface AccessibilityConfig {
  dwellControl: boolean;
  voiceControl: boolean;
  headPointer: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  textScale: number;
}

export interface CalibrationTestResult {
  type: 'gaze' | 'hand' | 'spatial';
  score: number;
  details: Record<string, unknown>;
  recommendations: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default gaze calibration for Vision Pro
 */
export const DEFAULT_GAZE_CALIBRATION: GazeCalibration = {
  horizontalOffset: 0,
  verticalOffset: 0,
  accuracy: 0.85,
  dwellRadius: 2.0, // degrees
  dwellTime: 800, // ms
  dwellFalloff: 300, // ms
  smoothingFactor: 0.3,
  predictionHorizon: 50, // ms
};

/**
 * Default hand calibration for Vision Pro
 */
export const DEFAULT_HAND_CALIBRATION: HandCalibration = {
  leftHandScale: 1.0,
  rightHandScale: 1.0,
  pinchThreshold: 0.8,
  pinchHysteresis: 0.3,
  minConfidence: 0.7,
  smoothingFactor: 0.2,
  workspaceBounds: {
    minX: -0.5,
    maxX: 0.5,
    minY: -0.3,
    maxY: 0.5,
    minZ: 0.2,
    maxZ: 0.8,
  },
};

/**
 * Default spatial calibration
 */
export const DEFAULT_SPATIAL_CALIBRATION: SpatialCalibration = {
  floorHeight: -1.6, // meters relative to device
  ceilingHeight: 1.0,
  minViewDistance: 0.4,
  maxViewDistance: 10.0,
  preferredContentDistance: 1.5,
  motionSensitivity: 0.7,
  rotationSpeed: 1.0,
};

/**
 * Performance profiles per device type
 */
export const PERFORMANCE_PROFILES: Record<DeviceType, PerformanceProfile> = {
  vision_pro: {
    targetFrameRate: 90,
    renderScale: 1.0,
    foveatedRendering: true,
    foveationLevel: 'medium',
    dynamicResolution: true,
  },
  vision_pro_dev: {
    targetFrameRate: 90,
    renderScale: 0.9,
    foveatedRendering: true,
    foveationLevel: 'medium',
    dynamicResolution: true,
  },
  simulator: {
    targetFrameRate: 60 as any, // Simulator doesn't support 90
    renderScale: 0.75,
    foveatedRendering: false,
    foveationLevel: 'low',
    dynamicResolution: false,
  },
};

/**
 * Default accessibility config
 */
export const DEFAULT_ACCESSIBILITY: AccessibilityConfig = {
  dwellControl: false,
  voiceControl: false,
  headPointer: false,
  reducedMotion: false,
  highContrast: false,
  textScale: 1.0,
};

// ============================================================================
// CALIBRATION PROFILE MANAGEMENT
// ============================================================================

/**
 * Create a new calibration profile
 */
export async function createCalibrationProfile(
  data: NewDeviceCalibration
): Promise<DeviceCalibration> {
  // Apply defaults if not provided
  const fullData: NewDeviceCalibration = {
    ...data,
    gazeCalibration: data.gazeCalibration ?? DEFAULT_GAZE_CALIBRATION,
    handCalibration: data.handCalibration ?? DEFAULT_HAND_CALIBRATION,
    spatialCalibration: data.spatialCalibration ?? DEFAULT_SPATIAL_CALIBRATION,
    performanceProfile:
      data.performanceProfile ?? PERFORMANCE_PROFILES[data.deviceType ?? 'vision_pro'],
    accessibilityConfig: data.accessibilityConfig ?? DEFAULT_ACCESSIBILITY,
  };

  const [profile] = await db
    .insert(deviceCalibrations)
    .values(fullData)
    .returning()
    .execute();

  return profile;
}

/**
 * Get calibration profile by ID
 */
export async function getCalibrationProfile(id: string): Promise<DeviceCalibration | null> {
  const [profile] = await db
    .select()
    .from(deviceCalibrations)
    .where(eq(deviceCalibrations.id, id))
    .limit(1)
    .execute();

  return profile ?? null;
}

/**
 * Get active calibration for a user
 */
export async function getActiveCalibration(
  userId: string
): Promise<DeviceCalibration | null> {
  const [profile] = await db
    .select()
    .from(deviceCalibrations)
    .where(
      and(eq(deviceCalibrations.userId, userId), eq(deviceCalibrations.isActive, true))
    )
    .limit(1)
    .execute();

  return profile ?? null;
}

/**
 * Get all calibration profiles for a user
 */
export async function getUserCalibrations(userId: string): Promise<DeviceCalibration[]> {
  return db
    .select()
    .from(deviceCalibrations)
    .where(eq(deviceCalibrations.userId, userId))
    .orderBy(desc(deviceCalibrations.updatedAt))
    .execute();
}

/**
 * Get or create default calibration for a device type
 */
export async function getOrCreateDefaultProfile(
  deviceType: DeviceType = 'vision_pro'
): Promise<DeviceCalibration> {
  // Check for existing default
  const [existing] = await db
    .select()
    .from(deviceCalibrations)
    .where(
      and(
        eq(deviceCalibrations.deviceType, deviceType),
        eq(deviceCalibrations.isDefault, true)
      )
    )
    .limit(1)
    .execute();

  if (existing) return existing;

  // Create default
  return createCalibrationProfile({
    name: `Default ${deviceType} Profile`,
    deviceType,
    isDefault: true,
    isActive: true,
  });
}

/**
 * Update calibration profile
 */
export async function updateCalibrationProfile(
  id: string,
  updates: Partial<NewDeviceCalibration>
): Promise<DeviceCalibration | null> {
  const [updated] = await db
    .update(deviceCalibrations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(deviceCalibrations.id, id))
    .returning()
    .execute();

  return updated ?? null;
}

/**
 * Set active calibration for user
 */
export async function setActiveCalibration(
  userId: string,
  profileId: string
): Promise<void> {
  // Deactivate all user's calibrations
  await db
    .update(deviceCalibrations)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(deviceCalibrations.userId, userId))
    .execute();

  // Activate selected profile
  await db
    .update(deviceCalibrations)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(deviceCalibrations.id, profileId))
    .execute();
}

/**
 * Delete calibration profile
 */
export async function deleteCalibrationProfile(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(deviceCalibrations)
    .where(eq(deviceCalibrations.id, id))
    .returning()
    .execute();

  return !!deleted;
}

// ============================================================================
// CALIBRATION ADJUSTMENTS
// ============================================================================

/**
 * Update gaze calibration
 */
export async function updateGazeCalibration(
  profileId: string,
  gazeCalibration: Partial<GazeCalibration>
): Promise<DeviceCalibration | null> {
  const profile = await getCalibrationProfile(profileId);
  if (!profile) return null;

  const currentGaze = (profile.gazeCalibration as GazeCalibration) ?? DEFAULT_GAZE_CALIBRATION;

  return updateCalibrationProfile(profileId, {
    gazeCalibration: { ...currentGaze, ...gazeCalibration },
    calibrationQuality: {
      ...(profile.calibrationQuality as Record<string, unknown>),
      lastCalibrationDate: new Date().toISOString(),
    },
  });
}

/**
 * Update hand calibration
 */
export async function updateHandCalibration(
  profileId: string,
  handCalibration: Partial<HandCalibration>
): Promise<DeviceCalibration | null> {
  const profile = await getCalibrationProfile(profileId);
  if (!profile) return null;

  const currentHand = (profile.handCalibration as HandCalibration) ?? DEFAULT_HAND_CALIBRATION;

  return updateCalibrationProfile(profileId, {
    handCalibration: { ...currentHand, ...handCalibration },
    calibrationQuality: {
      ...(profile.calibrationQuality as Record<string, unknown>),
      lastCalibrationDate: new Date().toISOString(),
    },
  });
}

/**
 * Update spatial calibration
 */
export async function updateSpatialCalibration(
  profileId: string,
  spatialCalibration: Partial<SpatialCalibration>
): Promise<DeviceCalibration | null> {
  const profile = await getCalibrationProfile(profileId);
  if (!profile) return null;

  const currentSpatial =
    (profile.spatialCalibration as SpatialCalibration) ?? DEFAULT_SPATIAL_CALIBRATION;

  return updateCalibrationProfile(profileId, {
    spatialCalibration: { ...currentSpatial, ...spatialCalibration },
    calibrationQuality: {
      ...(profile.calibrationQuality as Record<string, unknown>),
      lastCalibrationDate: new Date().toISOString(),
    },
  });
}

/**
 * Update performance profile
 */
export async function updatePerformanceProfile(
  profileId: string,
  performanceProfile: Partial<PerformanceProfile>
): Promise<DeviceCalibration | null> {
  const profile = await getCalibrationProfile(profileId);
  if (!profile) return null;

  const currentPerf =
    (profile.performanceProfile as PerformanceProfile) ??
    PERFORMANCE_PROFILES[profile.deviceType as DeviceType];

  return updateCalibrationProfile(profileId, {
    performanceProfile: { ...currentPerf, ...performanceProfile },
  });
}

/**
 * Update accessibility config
 */
export async function updateAccessibilityConfig(
  profileId: string,
  accessibilityConfig: Partial<AccessibilityConfig>
): Promise<DeviceCalibration | null> {
  const profile = await getCalibrationProfile(profileId);
  if (!profile) return null;

  const currentAccess =
    (profile.accessibilityConfig as AccessibilityConfig) ?? DEFAULT_ACCESSIBILITY;

  return updateCalibrationProfile(profileId, {
    accessibilityConfig: { ...currentAccess, ...accessibilityConfig },
  });
}

// ============================================================================
// CALIBRATION TESTING & VALIDATION
// ============================================================================

/**
 * Run gaze calibration test
 */
export function runGazeCalibrationTest(
  calibration: GazeCalibration,
  testPoints: Array<{ target: [number, number]; actual: [number, number] }>
): CalibrationTestResult {
  if (testPoints.length === 0) {
    return {
      type: 'gaze',
      score: 0,
      details: { error: 'No test points provided' },
      recommendations: ['Perform gaze calibration with at least 9 points'],
    };
  }

  // Calculate accuracy
  let totalError = 0;
  for (const point of testPoints) {
    const dx = point.target[0] - point.actual[0];
    const dy = point.target[1] - point.actual[1];
    totalError += Math.sqrt(dx * dx + dy * dy);
  }
  const avgError = totalError / testPoints.length;
  const score = Math.max(0, 1 - avgError / 10); // 10 degrees = 0 score

  const recommendations: string[] = [];

  if (avgError > 5) {
    recommendations.push('Recalibrate gaze tracking - error exceeds 5 degrees');
  }
  if (avgError > 2 && calibration.smoothingFactor < 0.4) {
    recommendations.push('Consider increasing smoothing factor');
  }

  return {
    type: 'gaze',
    score,
    details: {
      averageError: avgError,
      pointCount: testPoints.length,
      maxError: Math.max(...testPoints.map((p) => {
        const dx = p.target[0] - p.actual[0];
        const dy = p.target[1] - p.actual[1];
        return Math.sqrt(dx * dx + dy * dy);
      })),
    },
    recommendations,
  };
}

/**
 * Run hand tracking calibration test
 */
export function runHandCalibrationTest(
  calibration: HandCalibration,
  testData: {
    pinchTests: Array<{ expected: boolean; detected: boolean; strength: number }>;
    positionTests: Array<{ expected: [number, number, number]; actual: [number, number, number] }>;
  }
): CalibrationTestResult {
  const recommendations: string[] = [];

  // Pinch accuracy
  let pinchCorrect = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const test of testData.pinchTests) {
    if (test.expected === test.detected) {
      pinchCorrect++;
    } else if (!test.expected && test.detected) {
      falsePositives++;
    } else {
      falseNegatives++;
    }
  }

  const pinchAccuracy =
    testData.pinchTests.length > 0 ? pinchCorrect / testData.pinchTests.length : 0;

  if (falsePositives > 2) {
    recommendations.push('Lower pinch threshold to reduce false triggers');
  }
  if (falseNegatives > 2) {
    recommendations.push('Raise pinch threshold for more reliable detection');
  }

  // Position accuracy
  let positionError = 0;
  for (const test of testData.positionTests) {
    const dx = test.expected[0] - test.actual[0];
    const dy = test.expected[1] - test.actual[1];
    const dz = test.expected[2] - test.actual[2];
    positionError += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const avgPositionError =
    testData.positionTests.length > 0 ? positionError / testData.positionTests.length : 0;

  if (avgPositionError > 0.05) {
    recommendations.push('Adjust hand scale factors for better spatial accuracy');
  }

  const score = (pinchAccuracy + (1 - Math.min(avgPositionError / 0.1, 1))) / 2;

  return {
    type: 'hand',
    score,
    details: {
      pinchAccuracy,
      falsePositives,
      falseNegatives,
      averagePositionError: avgPositionError,
    },
    recommendations,
  };
}

/**
 * Calculate recommended calibration adjustments
 */
export function calculateCalibrationAdjustments(
  testResults: CalibrationTestResult[]
): Record<string, Partial<GazeCalibration | HandCalibration | SpatialCalibration>> {
  const adjustments: Record<string, unknown> = {};

  for (const result of testResults) {
    if (result.score < 0.7) {
      switch (result.type) {
        case 'gaze': {
          const gazeAdj: Partial<GazeCalibration> = {};
          if ((result.details.averageError as number) > 3) {
            gazeAdj.smoothingFactor = Math.min(0.5, DEFAULT_GAZE_CALIBRATION.smoothingFactor + 0.1);
          }
          adjustments.gazeCalibration = gazeAdj;
          break;
        }
        case 'hand': {
          const handAdj: Partial<HandCalibration> = {};
          if ((result.details.falsePositives as number) > 2) {
            handAdj.pinchThreshold = Math.min(0.95, DEFAULT_HAND_CALIBRATION.pinchThreshold + 0.05);
          }
          if ((result.details.falseNegatives as number) > 2) {
            handAdj.pinchThreshold = Math.max(0.6, DEFAULT_HAND_CALIBRATION.pinchThreshold - 0.05);
          }
          adjustments.handCalibration = handAdj;
          break;
        }
      }
    }
  }

  return adjustments;
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Detect device type from user agent or hardware info
 */
export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  if (ua.includes('visionos') || ua.includes('reality')) {
    if (ua.includes('simulator')) {
      return 'simulator';
    }
    return 'vision_pro';
  }

  // Default to simulator for non-visionOS
  return 'simulator';
}

/**
 * Get optimal performance settings for current conditions
 */
export function getOptimalPerformance(
  deviceType: DeviceType,
  batteryLevel: number,
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical'
): PerformanceProfile {
  const base = PERFORMANCE_PROFILES[deviceType];

  // Reduce performance under thermal/battery pressure
  if (thermalState === 'critical' || batteryLevel < 0.1) {
    return {
      ...base,
      targetFrameRate: 90,
      renderScale: 0.7,
      foveationLevel: 'high',
      dynamicResolution: true,
    };
  }

  if (thermalState === 'serious' || batteryLevel < 0.2) {
    return {
      ...base,
      renderScale: Math.min(base.renderScale, 0.85),
      foveationLevel: 'high',
    };
  }

  if (thermalState === 'fair' || batteryLevel < 0.3) {
    return {
      ...base,
      renderScale: Math.min(base.renderScale, 0.95),
      foveationLevel: 'medium',
    };
  }

  return base;
}
