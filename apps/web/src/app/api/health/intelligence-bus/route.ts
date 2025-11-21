import { NextResponse } from 'next/server';
import { ping } from '@/server/redis/client';
import { varcQueue, lampQueue, contrarianQueue } from '@/server/queues/bullmqClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const redisHealthy = await ping();

    const [varcWaiting, varcActive, lampWaiting, lampActive, contrarianWaiting, contrarianActive] = await Promise.all([
      varcQueue.getWaitingCount(),
      varcQueue.getActiveCount(),
      lampQueue.getWaitingCount(),
      lampQueue.getActiveCount(),
      contrarianQueue.getWaitingCount(),
      contrarianQueue.getActiveCount(),
    ]);

    return NextResponse.json({
      status: redisHealthy ? 'healthy' : 'degraded',
      redis: {
        healthy: redisHealthy,
      },
      queues: {
        varc: {
          waiting: varcWaiting,
          active: varcActive,
        },
        lamp: {
          waiting: lampWaiting,
          active: lampActive,
        },
        contrarian: {
          waiting: contrarianWaiting,
          active: contrarianActive,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

