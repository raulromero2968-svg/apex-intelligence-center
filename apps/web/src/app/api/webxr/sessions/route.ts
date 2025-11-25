/**
 * WebXR Sessions API
 *
 * Endpoints for managing XR sessions.
 * Implements pack-webxr-001 §3.1 (Immersive Session Engine).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  getSession,
  updateSessionStatus,
  endSession,
  getRecentSessions,
  getActiveSessionsCount,
  getSessionAnalytics,
  logAnalyticEvent,
  getRecommendedConfig,
  detectDeviceType,
  getWebXRSupportInfo,
  type SessionType,
  type SessionStatus,
  type SessionMetrics,
} from '@/lib/webxr';

/**
 * GET /api/webxr/sessions
 *
 * Get sessions or session info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const sceneId = searchParams.get('sceneId');
    const sessionType = searchParams.get('sessionType') as SessionType | undefined;
    const status = searchParams.get('status') as SessionStatus | undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        const sessions = await getRecentSessions({
          userId: userId ?? undefined,
          sceneId: sceneId ?? undefined,
          sessionType,
          status,
          limit,
        });
        return NextResponse.json({ sessions });
      }

      case 'get': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sessionId' },
            { status: 400 }
          );
        }

        const session = await getSession(sessionId);
        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ session });
      }

      case 'analytics': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sessionId' },
            { status: 400 }
          );
        }

        const analytics = await getSessionAnalytics(sessionId);
        return NextResponse.json({ analytics });
      }

      case 'active-count': {
        const count = await getActiveSessionsCount();
        return NextResponse.json({ activeCount: count });
      }

      case 'support-info': {
        const supportInfo = getWebXRSupportInfo();
        return NextResponse.json(supportInfo);
      }

      case 'recommended-config': {
        const deviceType = searchParams.get('deviceType') ?? 'generic_vr';
        const config = getRecommendedConfig(deviceType);
        return NextResponse.json({ config });
      }

      case 'detect-device': {
        const userAgent = request.headers.get('user-agent') ?? '';
        const deviceType = detectDeviceType(userAgent);
        const config = getRecommendedConfig(deviceType);
        return NextResponse.json({ deviceType, recommendedConfig: config });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: list, get, analytics, active-count, support-info, recommended-config, detect-device`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST /api/webxr/sessions
 *
 * Create session or perform actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        if (!body.sessionType) {
          return NextResponse.json(
            { error: 'Missing required field: sessionType' },
            { status: 400 }
          );
        }

        const session = await createSession(
          {
            sessionType: body.sessionType,
            referenceSpace: body.referenceSpace,
            requiredFeatures: body.requiredFeatures,
            optionalFeatures: body.optionalFeatures,
          },
          {
            userId: body.userId,
            sceneId: body.sceneId,
            deviceInfo: body.deviceInfo,
          }
        );

        return NextResponse.json({ session }, { status: 201 });
      }

      case 'log-event': {
        if (!body.sessionId || !body.eventType) {
          return NextResponse.json(
            { error: 'Missing required fields: sessionId, eventType' },
            { status: 400 }
          );
        }

        const event = await logAnalyticEvent({
          sessionId: body.sessionId,
          sceneId: body.sceneId,
          userId: body.userId,
          eventType: body.eventType,
          eventData: body.eventData,
          performanceSnapshot: body.performanceSnapshot,
          deviceInfo: body.deviceInfo,
        });

        return NextResponse.json({ event }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, log-event` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

/**
 * PATCH /api/webxr/sessions
 *
 * Update session status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    const updateAction = body.updateAction ?? 'status';

    switch (updateAction) {
      case 'status': {
        if (!body.status) {
          return NextResponse.json(
            { error: 'Missing required field: status' },
            { status: 400 }
          );
        }

        const session = await updateSessionStatus(body.sessionId, body.status, {
          metrics: body.metrics,
          errorMessage: body.errorMessage,
          errorCode: body.errorCode,
        });

        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ session });
      }

      case 'end': {
        const session = await endSession(body.sessionId, body.metrics);

        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({ session });
      }

      default:
        return NextResponse.json(
          { error: `Invalid updateAction: ${updateAction}. Valid actions: status, end` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
