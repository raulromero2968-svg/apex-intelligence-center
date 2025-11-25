/**
 * XR Hybrid Integration
 *
 * Unified XR experience across WebXR, visionOS, and Light Field displays.
 * Integrates pack-webxr-001, pack-visionos-001, and pack-lfd-001.
 *
 * Features:
 * - Device capability detection
 * - Automatic render mode selection
 * - Cross-platform hand tracking
 * - Graceful degradation
 */

// ============================================================================
// TYPES
// ============================================================================

export type XrPlatform = 'webxr' | 'visionos' | 'lightfield' | 'mobile-ar' | '2d';
export type RenderMode = 'immersive-vr' | 'immersive-ar' | 'inline' | 'quilt' | '2d';
export type HandTrackingSupport = 'full' | 'basic' | 'none';

export interface DeviceCapabilities {
  platform: XrPlatform;
  renderMode: RenderMode;
  handTracking: HandTrackingSupport;
  spatialAudio: boolean;
  passthrough: boolean;
  eyeTracking: boolean;
  displayType: 'hmd' | 'holographic' | 'mobile' | 'desktop';
  maxResolution: { width: number; height: number };
  refreshRate: number;
}

export interface XrSessionConfig {
  preferredPlatform?: XrPlatform;
  fallbackChain: XrPlatform[];
  handTrackingRequired: boolean;
  passthroughPreferred: boolean;
  performanceMode: 'quality' | 'balanced' | 'performance';
}

export interface XrSession {
  id: string;
  platform: XrPlatform;
  renderMode: RenderMode;
  capabilities: DeviceCapabilities;
  startedAt: Date;
  isActive: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_XR_CONFIG: XrSessionConfig = {
  fallbackChain: ['visionos', 'webxr', 'mobile-ar', 'lightfield', '2d'],
  handTrackingRequired: false,
  passthroughPreferred: true,
  performanceMode: 'balanced',
};

export const PLATFORM_CAPABILITIES: Record<XrPlatform, Partial<DeviceCapabilities>> = {
  visionos: {
    handTracking: 'full',
    spatialAudio: true,
    passthrough: true,
    eyeTracking: true,
    displayType: 'hmd',
    refreshRate: 90,
  },
  webxr: {
    handTracking: 'basic',
    spatialAudio: true,
    passthrough: true,
    eyeTracking: false,
    displayType: 'hmd',
    refreshRate: 72,
  },
  lightfield: {
    handTracking: 'none',
    spatialAudio: false,
    passthrough: false,
    eyeTracking: false,
    displayType: 'holographic',
    refreshRate: 60,
  },
  'mobile-ar': {
    handTracking: 'none',
    spatialAudio: false,
    passthrough: true,
    eyeTracking: false,
    displayType: 'mobile',
    refreshRate: 60,
  },
  '2d': {
    handTracking: 'none',
    spatialAudio: false,
    passthrough: false,
    eyeTracking: false,
    displayType: 'desktop',
    refreshRate: 60,
  },
};

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Detect device XR capabilities
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  // Check for visionOS
  if (isVisionOS()) {
    return {
      platform: 'visionos',
      renderMode: 'immersive-ar',
      ...PLATFORM_CAPABILITIES.visionos,
      maxResolution: { width: 3660, height: 3200 },
    } as DeviceCapabilities;
  }

  // Check for WebXR support
  if (typeof navigator !== 'undefined' && 'xr' in navigator) {
    const xr = (navigator as any).xr;

    const supportsVR = await xr.isSessionSupported?.('immersive-vr').catch(() => false);
    const supportsAR = await xr.isSessionSupported?.('immersive-ar').catch(() => false);

    if (supportsVR || supportsAR) {
      return {
        platform: 'webxr',
        renderMode: supportsAR ? 'immersive-ar' : 'immersive-vr',
        ...PLATFORM_CAPABILITIES.webxr,
        maxResolution: { width: 2048, height: 2048 },
      } as DeviceCapabilities;
    }
  }

  // Check for mobile AR (ARKit/ARCore via WebXR or native)
  if (isMobileDevice() && hasCameraAccess()) {
    return {
      platform: 'mobile-ar',
      renderMode: 'immersive-ar',
      ...PLATFORM_CAPABILITIES['mobile-ar'],
      maxResolution: { width: 1920, height: 1080 },
    } as DeviceCapabilities;
  }

  // Check for holographic display
  if (isHolographicDisplay()) {
    return {
      platform: 'lightfield',
      renderMode: 'quilt',
      ...PLATFORM_CAPABILITIES.lightfield,
      maxResolution: { width: 4096, height: 4096 },
    } as DeviceCapabilities;
  }

  // Fallback to 2D
  return {
    platform: '2d',
    renderMode: '2d',
    ...PLATFORM_CAPABILITIES['2d'],
    maxResolution: { width: 1920, height: 1080 },
  } as DeviceCapabilities;
}

function isVisionOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('visionOS') || navigator.userAgent.includes('RealityKit');
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function hasCameraAccess(): boolean {
  return typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
}

function isHolographicDisplay(): boolean {
  // Check for Looking Glass or similar displays
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('LookingGlass') || navigator.userAgent.includes('Holographic');
}

// ============================================================================
// PLATFORM SELECTION
// ============================================================================

/**
 * Select best platform based on capabilities and config
 */
export async function selectPlatform(config: XrSessionConfig = DEFAULT_XR_CONFIG): Promise<{
  platform: XrPlatform;
  capabilities: DeviceCapabilities;
  reason: string;
}> {
  const capabilities = await detectDeviceCapabilities();

  // Check preferred platform
  if (config.preferredPlatform) {
    if (capabilities.platform === config.preferredPlatform) {
      return {
        platform: config.preferredPlatform,
        capabilities,
        reason: 'Preferred platform available',
      };
    }
  }

  // Check hand tracking requirement
  if (config.handTrackingRequired && capabilities.handTracking === 'none') {
    // Try to find platform with hand tracking in fallback chain
    for (const platform of config.fallbackChain) {
      const platformCaps = PLATFORM_CAPABILITIES[platform];
      if (platformCaps.handTracking !== 'none') {
        return {
          platform,
          capabilities: { ...capabilities, ...platformCaps } as DeviceCapabilities,
          reason: 'Hand tracking required - selected compatible platform',
        };
      }
    }
  }

  // Check passthrough preference
  if (config.passthroughPreferred && !capabilities.passthrough) {
    for (const platform of config.fallbackChain) {
      const platformCaps = PLATFORM_CAPABILITIES[platform];
      if (platformCaps.passthrough) {
        return {
          platform,
          capabilities: { ...capabilities, ...platformCaps } as DeviceCapabilities,
          reason: 'Passthrough preferred - selected compatible platform',
        };
      }
    }
  }

  return {
    platform: capabilities.platform,
    capabilities,
    reason: 'Using detected platform',
  };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let activeSession: XrSession | null = null;

/**
 * Start XR session with automatic platform selection
 */
export async function startXrSession(
  config: XrSessionConfig = DEFAULT_XR_CONFIG
): Promise<XrSession> {
  if (activeSession?.isActive) {
    throw new Error('XR session already active');
  }

  const { platform, capabilities, reason } = await selectPlatform(config);

  const session: XrSession = {
    id: `xr-${Date.now()}`,
    platform,
    renderMode: capabilities.renderMode,
    capabilities,
    startedAt: new Date(),
    isActive: true,
  };

  activeSession = session;

  console.log(`Started XR session on ${platform}: ${reason}`);

  return session;
}

/**
 * End XR session
 */
export async function endXrSession(): Promise<void> {
  if (activeSession) {
    activeSession.isActive = false;
    console.log(`Ended XR session ${activeSession.id}`);
    activeSession = null;
  }
}

/**
 * Get active session
 */
export function getActiveSession(): XrSession | null {
  return activeSession;
}

// ============================================================================
// RENDER MODE SWITCHING
// ============================================================================

export interface RenderModeTransition {
  from: RenderMode;
  to: RenderMode;
  duration: number;
  easing: 'linear' | 'ease-in-out' | 'ease-in' | 'ease-out';
}

/**
 * Switch render mode with graceful transition
 */
export async function switchRenderMode(
  targetMode: RenderMode,
  options: Partial<RenderModeTransition> = {}
): Promise<void> {
  if (!activeSession) {
    throw new Error('No active XR session');
  }

  const transition: RenderModeTransition = {
    from: activeSession.renderMode,
    to: targetMode,
    duration: options.duration ?? 500,
    easing: options.easing ?? 'ease-in-out',
  };

  // Validate transition is supported
  if (!isTransitionSupported(transition.from, transition.to)) {
    throw new Error(`Transition from ${transition.from} to ${transition.to} not supported`);
  }

  console.log(`Switching render mode: ${transition.from} -> ${transition.to}`);

  // Apply transition
  await applyTransition(transition);

  activeSession.renderMode = targetMode;
}

function isTransitionSupported(from: RenderMode, to: RenderMode): boolean {
  // Define valid transitions
  const validTransitions: Record<RenderMode, RenderMode[]> = {
    'immersive-vr': ['immersive-ar', 'inline', '2d'],
    'immersive-ar': ['immersive-vr', 'inline', '2d'],
    inline: ['immersive-vr', 'immersive-ar', '2d'],
    quilt: ['2d'],
    '2d': ['inline', 'quilt', 'immersive-vr', 'immersive-ar'],
  };

  return validTransitions[from]?.includes(to) ?? false;
}

async function applyTransition(transition: RenderModeTransition): Promise<void> {
  // In production, this would animate the transition
  await new Promise((resolve) => setTimeout(resolve, transition.duration));
}

// ============================================================================
// HAND TRACKING ABSTRACTION
// ============================================================================

export interface HandPose {
  hand: 'left' | 'right';
  joints: Record<string, { position: [number, number, number]; rotation: [number, number, number, number] }>;
  gesture?: string;
  confidence: number;
}

/**
 * Get hand tracking data (platform-agnostic)
 */
export async function getHandTracking(): Promise<HandPose[]> {
  if (!activeSession) return [];

  const capabilities = activeSession.capabilities;

  if (capabilities.handTracking === 'none') {
    return [];
  }

  // Platform-specific implementations would go here
  switch (activeSession.platform) {
    case 'visionos':
      return getVisionOSHandTracking();
    case 'webxr':
      return getWebXRHandTracking();
    default:
      return [];
  }
}

async function getVisionOSHandTracking(): Promise<HandPose[]> {
  // In production, use ARKit hand tracking
  return [];
}

async function getWebXRHandTracking(): Promise<HandPose[]> {
  // In production, use WebXR Hand Tracking API
  return [];
}

// ============================================================================
// LIGHT FIELD FALLBACK
// ============================================================================

export interface QuiltConfig {
  columns: number;
  rows: number;
  totalViews: number;
  viewWidth: number;
  viewHeight: number;
}

/**
 * Generate quilt config for light field display
 */
export function getQuiltConfig(displayType: 'portrait' | 'landscape' | '8k'): QuiltConfig {
  switch (displayType) {
    case 'portrait':
      return { columns: 5, rows: 9, totalViews: 45, viewWidth: 420, viewHeight: 560 };
    case 'landscape':
      return { columns: 8, rows: 6, totalViews: 48, viewWidth: 512, viewHeight: 384 };
    case '8k':
      return { columns: 5, rows: 9, totalViews: 45, viewWidth: 819, viewHeight: 455 };
    default:
      return { columns: 5, rows: 9, totalViews: 45, viewWidth: 420, viewHeight: 560 };
  }
}

/**
 * Check if fallback to light field is needed
 */
export function shouldFallbackToLightField(capabilities: DeviceCapabilities): boolean {
  return (
    capabilities.displayType === 'holographic' ||
    (capabilities.platform === '2d' && isHolographicDisplay())
  );
}
