import { NextResponse } from 'next/server';
import { ping } from '@/server/redis/client';
import { getVarcQueue, getLampQueue, getContrarianQueue } from '@/server/queues/bullmqClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: { connected: boolean; latency?: number };
    queues: {
      varc: { waiting: number; active: number; completed: number; failed: number };
      lamp: { waiting: number; active: number; completed: number; failed: number };
      contrarian: { waiting: number; active: number; completed: number; failed: number };
    };
    timestamp: string;
  } = {
    status: 'healthy',
    redis: { connected: false },
    queues: {
      varc: { waiting: 0, active: 0, completed: 0, failed: 0 },
      lamp: { waiting: 0, active: 0, completed: 0, failed: 0 },
      contrarian: { waiting: 0, active: 0, completed: 0, failed: 0 },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const redisStart = Date.now();
    const redisConnected = await ping();
    const redisLatency = Date.now() - redisStart;
    health.redis = {
      connected: redisConnected,
      latency: redisLatency,
    };

    if (!redisConnected) {
      health.status = 'unhealthy';
    }
  } catch (error) {
    console.error('[health] Redis check failed:', error);
    health.redis.connected = false;
    health.status = 'unhealthy';
  }

  try {
    const varcQueue = getVarcQueue();
    const [varcWaiting, varcActive, varcCompleted, varcFailed] = await Promise.all([
      varcQueue.getWaitingCount(),
      varcQueue.getActiveCount(),
      varcQueue.getCompletedCount(),
      varcQueue.getFailedCount(),
    ]);

    health.queues.varc = {
      waiting: varcWaiting,
      active: varcActive,
      completed: varcCompleted,
      failed: varcFailed,
    };
  } catch (error) {
    console.error('[health] VARC queue check failed:', error);
    health.status = 'degraded';
  }

  try {
    const lampQueue = getLampQueue();
    const [lampWaiting, lampActive, lampCompleted, lampFailed] = await Promise.all([
      lampQueue.getWaitingCount(),
      lampQueue.getActiveCount(),
      lampQueue.getCompletedCount(),
      lampQueue.getFailedCount(),
    ]);

    health.queues.lamp = {
      waiting: lampWaiting,
      active: lampActive,
      completed: lampCompleted,
      failed: lampFailed,
    };
  } catch (error) {
    console.error('[health] LAMP queue check failed:', error);
    health.status = 'degraded';
  }

  try {
    const contrarianQueue = getContrarianQueue();
    const [contrarianWaiting, contrarianActive, contrarianCompleted, contrarianFailed] = await Promise.all([
      contrarianQueue.getWaitingCount(),
      contrarianQueue.getActiveCount(),
      contrarianQueue.getCompletedCount(),
      contrarianQueue.getFailedCount(),
    ]);

    health.queues.contrarian = {
      waiting: contrarianWaiting,
      active: contrarianActive,
      completed: contrarianCompleted,
      failed: contrarianFailed,
    };
  } catch (error) {
    console.error('[health] Contrarian queue check failed:', error);
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
