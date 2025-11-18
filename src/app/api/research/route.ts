// Minimal, stable Research API v1 (no external calls)
// runtime: nodejs to avoid Edge limitations and get better logging

import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ok = {
  ok: true;
  sessionId: string;
  received: string;
  streamingEnabled: boolean;
  time: string;
};

type Fail = { ok: false; error: string; requestId?: string };

const flag = (v?: string) => typeof v === 'string' && !['0','false','off',''].includes(v.toLowerCase());

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { query = '', sessionId = crypto.randomUUID() } = await req.json().catch(() => ({}));
    const streamingEnabled = flag(process.env.RESEARCH_STREAMING_ENABLED);

    // Basic input guard
    if (typeof query !== 'string' || !query.trim()) {
      return Response.json<Fail>({ ok: false, error: 'Bad Request: missing query', requestId }, { status: 400 });
    }

    // No external calls here — always succeed and echo
    const body: Ok = {
      ok: true,
      sessionId,
      received: query,
      streamingEnabled,
      time: new Date().toISOString(),
    };

    return Response.json(body, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    const msg = err?.message ?? 'unknown error';
    Sentry.captureException(err, { tags: { route: 'api/research' }, extra: { requestId } });
    return Response.json<Fail>({ ok: false, error: msg, requestId }, { status: 500 });
  }
}
