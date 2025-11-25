/**
 * Nexus Real-Time API (Server-Sent Events)
 *
 * SSE endpoint for live Nexus dashboard updates:
 * - Preference changes
 * - AR event notifications
 * - Delight moments
 * - CX score updates
 * - Community activity
 *
 * @see knowledge-10-api-realtime for SSE patterns
 * @see knowledge-09-database-architecture for pgvector
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';
import { getActiveAREvents } from '@/lib/customer-ux';

// ============================================================================
// TYPES
// ============================================================================

interface NexusEvent {
  type:
    | 'connected'
    | 'ar_event'
    | 'delight_moment'
    | 'cx_update'
    | 'community_activity'
    | 'preference_sync'
    | 'weather_boost'
    | 'error'
    | 'disconnected';
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// SSE ENDPOINT
// ============================================================================

/**
 * GET /api/nexus/real-time
 *
 * Server-Sent Events stream for live Nexus dashboard updates.
 *
 * Query params:
 * - location: optional location for AR event updates
 *
 * Events:
 * - connected: Initial connection confirmation
 * - ar_event: New AR event in user's area
 * - delight_moment: New delight moment triggered
 * - cx_update: CX score change
 * - community_activity: Nearby community activity
 * - preference_sync: Preference changes from other devices
 * - weather_boost: Weather condition changes affecting cards
 */
export async function GET(request: NextRequest) {
  // 1. Authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Rate limiting
  const limit = getLimitForTier(user.subscriptionTier);
  const { success } = await ratelimit(limit, `nexus:realtime:${user.id}`, 60);

  if (!success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  // 3. Parse query params
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  // 4. Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE events
      const sendEvent = (event: NexusEvent) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
            )
          );
        } catch (error) {
          console.error('[Nexus SSE] Error sending event:', error);
        }
      };

      // Send connection confirmation
      sendEvent({
        type: 'connected',
        data: {
          message: 'Nexus real-time stream connected',
          userId: user.id,
          tier: user.subscriptionTier,
          features: [
            'ar_events',
            'delight_moments',
            'cx_updates',
            'community_activity',
          ],
        },
        timestamp: new Date().toISOString(),
      });

      // Keep-alive interval (every 15s to prevent timeout)
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // AR event check interval (every 30s)
      const arCheckInterval = setInterval(async () => {
        try {
          if (location) {
            const events = await getActiveAREvents(user.id);
            if (events.length > 0) {
              const latestEvent = events[0];
              sendEvent({
                type: 'ar_event',
                data: {
                  eventId: latestEvent.id,
                  eventType: latestEvent.eventType,
                  weatherBoost: latestEvent.weatherBoost,
                  weatherMultiplier: latestEvent.weatherMultiplier,
                  expiresAt: latestEvent.expiresAt,
                  eventData: latestEvent.eventData,
                },
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error('[Nexus SSE] AR check error:', error);
        }
      }, 30000);

      // Weather boost simulation (every 60s)
      const weatherInterval = setInterval(() => {
        try {
          // Simulate weather changes
          const weatherTypes = ['sunny', 'rain', 'cloudy', 'snow', 'windy'];
          const randomWeather =
            weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

          const boostMap: Record<string, { boost: string; multiplier: number }> =
            {
              sunny: { boost: 'Fire & Electric cards +15%', multiplier: 1.15 },
              rain: { boost: 'Water cards +20%', multiplier: 1.2 },
              cloudy: { boost: 'Psychic cards +10%', multiplier: 1.1 },
              snow: { boost: 'Ice cards +25%', multiplier: 1.25 },
              windy: { boost: 'Flying cards +15%', multiplier: 1.15 },
            };

          // Only send occasionally to avoid spam
          if (Math.random() < 0.3) {
            sendEvent({
              type: 'weather_boost',
              data: {
                weather: randomWeather,
                ...boostMap[randomWeather],
                location: location || 'your area',
              },
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('[Nexus SSE] Weather check error:', error);
        }
      }, 60000);

      // CX score update simulation (every 2 minutes)
      const cxInterval = setInterval(() => {
        try {
          // Simulate small CX score changes
          const delta = (Math.random() - 0.5) * 2; // -1 to +1
          sendEvent({
            type: 'cx_update',
            data: {
              scoreDelta: parseFloat(delta.toFixed(2)),
              reason: delta > 0 ? 'engagement_bonus' : 'inactivity_decay',
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[Nexus SSE] CX update error:', error);
        }
      }, 120000);

      // Community activity simulation (every 45s)
      const communityInterval = setInterval(() => {
        try {
          const activities = [
            { type: 'trade', message: 'New trade listing nearby' },
            { type: 'tournament', message: 'Tournament starting soon' },
            { type: 'meetup', message: 'Collector meetup in your area' },
            { type: 'drop', message: 'Rare card spotted at local store' },
          ];

          // Only send occasionally
          if (Math.random() < 0.2) {
            const activity =
              activities[Math.floor(Math.random() * activities.length)];
            sendEvent({
              type: 'community_activity',
              data: {
                ...activity,
                location: location || 'nearby',
                participants: Math.floor(Math.random() * 20) + 5,
              },
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('[Nexus SSE] Community check error:', error);
        }
      }, 45000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        clearInterval(arCheckInterval);
        clearInterval(weatherInterval);
        clearInterval(cxInterval);
        clearInterval(communityInterval);

        sendEvent({
          type: 'disconnected',
          data: { message: 'Stream closed' },
          timestamp: new Date().toISOString(),
        });
      });
    },

    cancel() {
      console.log('[Nexus SSE] Stream cancelled by client');
    },
  });

  // 5. Return SSE response with proper headers
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Required Next.js config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
