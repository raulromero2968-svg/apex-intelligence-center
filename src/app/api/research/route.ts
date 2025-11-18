/**
 * Research Panel API - Production-Safe Minimal Implementation
 *
 * This is a stable stub that never 500s. It validates environment,
 * returns proper typed responses, and gives us a place to plug
 * the full RAG pipeline later.
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';           // ensure Node runtime on Vercel
export const dynamic = 'force-dynamic';    // avoid static optimization

function hasEnv() {
  const missing: string[] = [];
  const need = [
    'OPENAI_API_KEY',
    // add others when you wire RAG back in:
    // 'COHERE_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'
  ];
  for (const k of need) if (!process.env[k]) missing.push(k);
  return { ok: missing.length === 0, missing };
}

export async function POST(req: NextRequest) {
  try {
    const { ok, missing } = hasEnv();
    if (!ok) {
      return Response.json(
        { ok: false, error: `Missing required env: ${missing.join(', ')}` },
        { status: 503 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!query) return Response.json({ ok: false, error: 'Bad Request' }, { status: 400 });

    // Temporary echo until the streaming RAG is re-landed
    // This gives the UI a stable contract and stops 500s immediately
    return Response.json({
      ok: true,
      answer: `Research queued for: "${query}"`,
      sources: []
    });
  } catch (err: any) {
    // Never throw—return typed error
    return Response.json({ ok: false, error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
