/**
 * Real-time Child Activity Stream (SSE)
 *
 * Provides Server-Sent Events for real-time monitoring of child activity.
 * Only parents with active family links can access this stream.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { familyLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/family/activity/stream?childId=xxx
 * Subscribe to real-time child activity events
 */
export async function GET(request: NextRequest) {
  // 1. Authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Get childId from params
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');

  if (!childId) {
    return new NextResponse('Child ID required', { status: 400 });
  }

  // 3. Verify parent has access to this child
  const link = await db.query.familyLinks.findFirst({
    where: and(
      eq(familyLinks.parentId, user.id),
      eq(familyLinks.childId, childId),
      eq(familyLinks.status, 'active')
    ),
  });

  if (!link) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 4. Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE events
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send connection confirmation
      sendEvent('connected', {
        message: 'Child activity stream connected',
        childId,
        parentId: user.id,
      });

      // Keep-alive interval (every 30s to prevent timeout)
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        console.log(`Activity stream closed for child ${childId}`);
      });

      /*
       * Production implementation with Redis pub/sub:
       *
       * Subscribe to child activity events via Redis pub/sub.
       * Activities are published when child performs actions.
       *
       * const activityChannel = `child:${childId}:activity`;
       * redis.subscribe(activityChannel, (message: string) => {
       *   try {
       *     const activity = JSON.parse(message);
       *     sendEvent('activity', activity);
       *   } catch (error) {
       *     sendEvent('error', { error: 'Invalid activity format' });
       *   }
       * });
       *
       * request.signal.addEventListener('abort', () => {
       *   redis.unsubscribe(activityChannel);
       * });
       */

      // Mock activity updates for development
      // Remove this in production when Redis pub/sub is enabled
      const mockActivityInterval = setInterval(() => {
        try {
          const mockActivities = [
            { type: 'login', data: { timestamp: new Date() } },
            { type: 'watchlist_add', data: { cardName: 'Pikachu' } },
            { type: 'portfolio_update', data: { value: Math.random() * 1000 } },
          ];

          const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];

          sendEvent('activity', {
            id: crypto.randomUUID(),
            childId,
            activityType: randomActivity.type,
            activityData: randomActivity.data,
            timestamp: new Date(),
            blockedByBedtime: false,
            blockedByCoolDown: false,
          });
        } catch (error) {
          console.error('Error sending activity update:', error);
        }
      }, 10000); // Every 10 seconds for demo

      // Cleanup mock interval on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(mockActivityInterval);
      });
    },

    cancel() {
      console.log('Activity stream cancelled by client');
    },
  });

  // 5. Return SSE response with proper headers
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  });
}
