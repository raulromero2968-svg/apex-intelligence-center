/**
 * WebXR Session Manager
 *
 * Implements pack-webxr-001 §3.1 (Immersive Session Engine).
 * Manages XR session lifecycle, mode switching, and feature detection.
 *
 * Features:
 * - Session initialization and teardown
 * - VR/AR mode switching
 * - Reference space management
 * - Feature detection and capability queries
 *
 * @see pack-webxr-001 for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  xrSessions,
  xrAnalytics,
  type XrSession,
  type NewXrSession,
  type XrAnalyticEvent,
  type NewXrAnalyticEvent,
} from '@/db/schema/webxr';

// ============================================================================
// TYPES
// ============================================================================

export type SessionType = 'immersive-vr' | 'immersive-ar' | 'inline';
export type ReferenceSpace = 'local' | 'local-floor' | 'bounded-floor' | 'unbounded' | 'viewer';
export type SessionStatus = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface SessionConfig {
  sessionType: SessionType;
  referenceSpace?: ReferenceSpace;
  requiredFeatures?: string[];
  optionalFeatures?: string[];
}

export interface SessionCapabilities {
  supportedSessionTypes: SessionType[];
  supportedReferenceSpaces: ReferenceSpace[];
  features: {
    handTracking: boolean;
    eyeTracking: boolean;
    planeDetection: boolean;
    meshDetection: boolean;
    hitTest: boolean;
    anchors: boolean;
    depthSensing: boolean;
    lightEstimation: boolean;
  };
}

export interface SessionMetrics {
  avgFps?: number;
  minFps?: number;
  maxFps?: number;
  frameDrops?: number;
  latencyMs?: number;
  memoryUsageMb?: number;
}

export interface DeviceInfo {
  deviceType: string;
  deviceName?: string;
  userAgent: string;
  platform: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionType: 'inline',
  referenceSpace: 'local-floor',
  requiredFeatures: [],
  optionalFeatures: ['hand-tracking', 'local-floor'],
};

/**
 * WebXR feature sets by session type
 */
export const SESSION_FEATURES: Record<SessionType, string[]> = {
  'immersive-vr': [
    'local-floor',
    'bounded-floor',
    'hand-tracking',
    'layers',
  ],
  'immersive-ar': [
    'local-floor',
    'hit-test',
    'plane-detection',
    'anchors',
    'light-estimation',
    'depth-sensing',
    'camera-access',
    'hand-tracking',
  ],
  inline: [
    'viewer',
    'local',
  ],
};

/**
 * Reference space characteristics
 */
export const REFERENCE_SPACE_INFO: Record<
  ReferenceSpace,
  { description: string; useCase: string; requirements: string[] }
> = {
  local: {
    description: 'Seated or standing experience with limited movement',
    useCase: 'Desktop VR, simple interactions',
    requirements: [],
  },
  'local-floor': {
    description: 'Standing experience with floor-level origin',
    useCase: 'Room-scale VR, most common',
    requirements: ['floor detection'],
  },
  'bounded-floor': {
    description: 'Room-scale with defined play area boundaries',
    useCase: 'Guardian/boundary-aware experiences',
    requirements: ['floor detection', 'boundary system'],
  },
  unbounded: {
    description: 'Large-scale tracking beyond room boundaries',
    useCase: 'AR experiences, world-scale',
    requirements: ['inside-out tracking', 'relocalization'],
  },
  viewer: {
    description: 'Head-locked content, no positional tracking',
    useCase: '360 video, inline preview',
    requirements: [],
  },
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new XR session record
 */
export async function createSession(
  config: SessionConfig,
  options: {
    userId?: string;
    sceneId?: string;
    deviceInfo?: DeviceInfo;
  } = {}
): Promise<XrSession> {
  const [session] = await db
    .insert(xrSessions)
    .values({
      userId: options.userId,
      sceneId: options.sceneId,
      sessionType: config.sessionType,
      referenceSpace: config.referenceSpace ?? 'local-floor',
      deviceType: options.deviceInfo?.deviceType,
      deviceName: options.deviceInfo?.deviceName,
      userAgent: options.deviceInfo?.userAgent,
      status: 'initializing',
      featuresUsed: [...(config.requiredFeatures ?? []), ...(config.optionalFeatures ?? [])],
    })
    .returning();

  // Log session start event
  await logAnalyticEvent({
    sessionId: session.id,
    sceneId: options.sceneId,
    userId: options.userId,
    eventType: 'session_start',
    eventData: {
      sessionType: config.sessionType,
      referenceSpace: config.referenceSpace,
    },
    deviceInfo: {
      deviceType: options.deviceInfo?.deviceType ?? 'unknown',
      sessionType: config.sessionType,
    },
  });

  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<XrSession | null> {
  const [session] = await db
    .select()
    .from(xrSessions)
    .where(eq(xrSessions.id, sessionId))
    .execute();

  return session ?? null;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  options: {
    metrics?: SessionMetrics;
    errorMessage?: string;
    errorCode?: string;
  } = {}
): Promise<XrSession | null> {
  const updates: Partial<XrSession> = {
    status,
    updatedAt: new Date(),
  };

  if (options.metrics) {
    updates.metrics = options.metrics;
  }

  if (options.errorMessage) {
    updates.errorMessage = options.errorMessage;
    updates.errorCode = options.errorCode;
  }

  // Set timing based on status
  if (status === 'active') {
    updates.startedAt = new Date();
  } else if (status === 'ended' || status === 'error') {
    updates.endedAt = new Date();

    // Calculate duration if we have a start time
    const session = await getSession(sessionId);
    if (session?.startedAt) {
      const duration = Date.now() - new Date(session.startedAt).getTime();
      updates.totalDurationMs = duration;
    }
  }

  const [updated] = await db
    .update(xrSessions)
    .set(updates)
    .where(eq(xrSessions.id, sessionId))
    .returning();

  return updated ?? null;
}

/**
 * End session
 */
export async function endSession(
  sessionId: string,
  metrics?: SessionMetrics
): Promise<XrSession | null> {
  const session = await updateSessionStatus(sessionId, 'ended', { metrics });

  if (session) {
    await logAnalyticEvent({
      sessionId,
      sceneId: session.sceneId ?? undefined,
      userId: session.userId ?? undefined,
      eventType: 'session_end',
      eventData: {
        duration: session.totalDurationMs,
        metrics,
      },
      performanceSnapshot: metrics
        ? {
            fps: metrics.avgFps ?? 0,
            frameTime: metrics.avgFps ? 1000 / metrics.avgFps : 0,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: metrics.memoryUsageMb ?? 0,
          }
        : undefined,
    });
  }

  return session;
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(
  options: {
    userId?: string;
    sceneId?: string;
    sessionType?: SessionType;
    status?: SessionStatus;
    limit?: number;
  } = {}
): Promise<XrSession[]> {
  const { userId, sceneId, sessionType, status, limit = 50 } = options;

  const conditions = [];

  if (userId) {
    conditions.push(eq(xrSessions.userId, userId));
  }
  if (sceneId) {
    conditions.push(eq(xrSessions.sceneId, sceneId));
  }
  if (sessionType) {
    conditions.push(eq(xrSessions.sessionType, sessionType));
  }
  if (status) {
    conditions.push(eq(xrSessions.status, status));
  }

  return db
    .select()
    .from(xrSessions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(xrSessions.createdAt))
    .limit(limit)
    .execute();
}

/**
 * Get active sessions count
 */
export async function getActiveSessionsCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(xrSessions)
    .where(eq(xrSessions.status, 'active'))
    .execute();

  return result?.count ?? 0;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Log an analytics event
 */
export async function logAnalyticEvent(
  event: Omit<NewXrAnalyticEvent, 'id' | 'createdAt'>
): Promise<XrAnalyticEvent> {
  const [logged] = await db.insert(xrAnalytics).values(event).returning();
  return logged;
}

/**
 * Get analytics for a session
 */
export async function getSessionAnalytics(sessionId: string): Promise<XrAnalyticEvent[]> {
  return db
    .select()
    .from(xrAnalytics)
    .where(eq(xrAnalytics.sessionId, sessionId))
    .orderBy(xrAnalytics.timestamp)
    .execute();
}

/**
 * Get analytics summary for a scene
 */
export async function getSceneAnalyticsSummary(
  sceneId: string
): Promise<{
  totalSessions: number;
  avgDuration: number;
  avgFps: number;
  eventCounts: Record<string, number>;
}> {
  // Get session stats
  const sessions = await db
    .select()
    .from(xrSessions)
    .where(eq(xrSessions.sceneId, sceneId))
    .execute();

  const totalSessions = sessions.length;
  const avgDuration =
    sessions.reduce((sum, s) => sum + (s.totalDurationMs ?? 0), 0) / (totalSessions || 1);

  // Get average FPS from sessions with metrics
  const sessionsWithMetrics = sessions.filter((s) => s.metrics?.avgFps);
  const avgFps =
    sessionsWithMetrics.reduce((sum, s) => sum + ((s.metrics as SessionMetrics)?.avgFps ?? 0), 0) /
    (sessionsWithMetrics.length || 1);

  // Get event counts
  const events = await db
    .select()
    .from(xrAnalytics)
    .where(eq(xrAnalytics.sceneId, sceneId))
    .execute();

  const eventCounts: Record<string, number> = {};
  for (const event of events) {
    eventCounts[event.eventType] = (eventCounts[event.eventType] ?? 0) + 1;
  }

  return {
    totalSessions,
    avgDuration,
    avgFps,
    eventCounts,
  };
}

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Check WebXR support (client-side helper info)
 */
export function getWebXRSupportInfo(): {
  checkScript: string;
  fallbackMessage: string;
} {
  return {
    checkScript: `
async function checkWebXRSupport() {
  if (!navigator.xr) {
    return { supported: false, reason: 'WebXR not available' };
  }

  const capabilities = {
    supportedSessionTypes: [],
    features: {}
  };

  // Check session types
  for (const type of ['immersive-vr', 'immersive-ar', 'inline']) {
    try {
      const supported = await navigator.xr.isSessionSupported(type);
      if (supported) capabilities.supportedSessionTypes.push(type);
    } catch (e) {}
  }

  return { supported: true, capabilities };
}
    `.trim(),
    fallbackMessage:
      'WebXR is not supported in this browser. Please use Chrome, Edge, or Firefox with WebXR enabled.',
  };
}

/**
 * Get recommended session config for device type
 */
export function getRecommendedConfig(deviceType: string): SessionConfig {
  switch (deviceType) {
    case 'quest_2':
    case 'quest_3':
    case 'quest_pro':
      return {
        sessionType: 'immersive-vr',
        referenceSpace: 'local-floor',
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking', 'bounded-floor'],
      };

    case 'vision_pro':
      return {
        sessionType: 'immersive-vr',
        referenceSpace: 'local-floor',
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking', 'plane-detection', 'mesh-detection'],
      };

    case 'mobile_ar_ios':
    case 'mobile_ar_android':
      return {
        sessionType: 'immersive-ar',
        referenceSpace: 'local-floor',
        requiredFeatures: ['local-floor', 'hit-test'],
        optionalFeatures: ['plane-detection', 'light-estimation'],
      };

    case 'desktop_vr':
      return {
        sessionType: 'immersive-vr',
        referenceSpace: 'local-floor',
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor'],
      };

    default:
      return {
        sessionType: 'inline',
        referenceSpace: 'viewer',
        requiredFeatures: [],
        optionalFeatures: [],
      };
  }
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('quest 3')) return 'quest_3';
  if (ua.includes('quest 2')) return 'quest_2';
  if (ua.includes('quest pro')) return 'quest_pro';
  if (ua.includes('oculus')) return 'quest_2'; // Generic Oculus
  if (ua.includes('pico')) return 'pico_4';
  if (ua.includes('vive')) return 'vive_xr_elite';

  // Apple Vision Pro detection
  if (ua.includes('apple') && ua.includes('xr')) return 'vision_pro';

  // Mobile AR
  if (ua.includes('iphone') || ua.includes('ipad')) return 'mobile_ar_ios';
  if (ua.includes('android')) return 'mobile_ar_android';

  // Desktop
  if (ua.includes('steamvr') || ua.includes('openvr')) return 'desktop_vr';

  return 'unknown';
}

// ============================================================================
// MODE SWITCHING
// ============================================================================

/**
 * Get available modes for current context
 */
export function getAvailableModes(
  capabilities: SessionCapabilities
): Array<{ mode: SessionType; available: boolean; reason?: string }> {
  return [
    {
      mode: 'immersive-vr',
      available: capabilities.supportedSessionTypes.includes('immersive-vr'),
      reason: !capabilities.supportedSessionTypes.includes('immersive-vr')
        ? 'VR headset not detected'
        : undefined,
    },
    {
      mode: 'immersive-ar',
      available: capabilities.supportedSessionTypes.includes('immersive-ar'),
      reason: !capabilities.supportedSessionTypes.includes('immersive-ar')
        ? 'AR not supported on this device'
        : undefined,
    },
    {
      mode: 'inline',
      available: true,
      reason: undefined,
    },
  ];
}

/**
 * Generate mode switch code
 */
export function generateModeSwitchCode(
  fromMode: SessionType,
  toMode: SessionType
): string {
  return `
// Switch from ${fromMode} to ${toMode}
async function switchXRMode(renderer, currentSession) {
  // End current session
  if (currentSession) {
    await currentSession.end();
  }

  // Request new session
  const newSession = await navigator.xr.requestSession('${toMode}', {
    requiredFeatures: ${JSON.stringify(SESSION_FEATURES[toMode].slice(0, 2))},
    optionalFeatures: ${JSON.stringify(SESSION_FEATURES[toMode].slice(2))}
  });

  // Update renderer
  await renderer.xr.setSession(newSession);

  return newSession;
}
  `.trim();
}
