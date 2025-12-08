/**
 * Intel Reports SSE Stream - Real-time report broadcasts
 *
 * Provides Server-Sent Events (SSE) for real-time updates on new reports.
 * Clients subscribe and receive automatic pushes when new reports are published.
 *
 * Features:
 * - Filter by market (commons/rc_market)
 * - Automatic heartbeat every 30s
 * - Graceful cleanup on disconnect
 *
 * Trade-offs:
 * - SSE is simpler than WebSocket for server-to-client only
 * - No built-in reconnection (client must handle)
 * - Add heartbeat for connection health
 *
 * Reference: knowledge-10-api-realtime.md
 *
 * @module api/reports/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { reportEmitter, type ReportEvent } from '@/lib/events/report-emitter';

// =============================================================================
// CONSTANTS
// =============================================================================

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

// =============================================================================
// GET - SSE STREAM FOR NEW REPORTS
// =============================================================================

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market'); // 'commons' | 'rc_market' | null (all)

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = JSON.stringify({ type: 'connected', market: market || 'all' });
      controller.enqueue(encoder.encode(`data: ${connectMsg}\n\n`));

      // Report handler
      const reportHandler = (report: ReportEvent) => {
        // Filter by market if specified
        if (market && report.postedTo !== market && report.postedTo !== 'both') {
          return;
        }

        const eventData = JSON.stringify({
          type: 'new_report',
          report: {
            id: report.id,
            title: report.title,
            slug: report.slug,
            summary: report.summary,
            category: report.category,
            tier: report.tier,
            postedTo: report.postedTo,
            game: report.game,
            tags: report.tags,
            publishedAt: report.publishedAt,
          },
        });

        try {
          controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
        } catch (error) {
          // Client disconnected
          cleanup();
        }
      };

      // Report update handler
      const updateHandler = (report: ReportEvent) => {
        if (market && report.postedTo !== market && report.postedTo !== 'both') {
          return;
        }

        const eventData = JSON.stringify({
          type: 'report_updated',
          report: {
            id: report.id,
            title: report.title,
            slug: report.slug,
            summary: report.summary,
          },
        });

        try {
          controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
        } catch {
          cleanup();
        }
      };

      // Like handler
      const likeHandler = (data: { reportId: string; likeCount: number }) => {
        const eventData = JSON.stringify({ type: 'report_liked', ...data });
        try {
          controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
        } catch {
          cleanup();
        }
      };

      // Subscribe to events
      reportEmitter.on('new_report', reportHandler);
      reportEmitter.on('report_updated', updateHandler);
      reportEmitter.on('report_liked', likeHandler);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Cleanup function
      const cleanup = () => {
        reportEmitter.off('new_report', reportHandler);
        reportEmitter.off('report_updated', updateHandler);
        reportEmitter.off('report_liked', likeHandler);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Handle abort signal
      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// =============================================================================
// POST - ADMIN BROADCAST (internal use)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check for internal/admin auth
    const authHeader = request.headers.get('x-internal-key');
    if (authHeader !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'new_report' && data) {
      reportEmitter.emit('new_report', data as ReportEvent);
      return NextResponse.json({ success: true, message: 'Broadcast sent' });
    }

    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  } catch (error) {
    console.error('Broadcast failed:', error);
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}
