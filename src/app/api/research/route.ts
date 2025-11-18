// src/app/api/research/route.ts
// Reference: knowledge-10 → typed JSON responses in App Router
// This is the production-safe minimal stub (honest placeholder)
// Ready for full RAG-Fusion streaming upgrade in next PR

import { NextRequest, NextResponse } from 'next/server';

interface Success {
  ok: true;
  answer: string;
  sources: never[];
}

interface Fail {
  ok: false;
  error: string;
  requestId: string;
}

type ResearchResponse = Success | Fail;

const requestId = () => crypto.randomUUID().slice(0, 8);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rid = requestId();

  try {
    const { query } = await req.json();

    // Basic input guard
    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json<Fail>(
        { ok: false, error: 'Bad Request: missing query', requestId: rid },
        { status: 400 }
      );
    }

    // Honest minimal response – panel shows "Research queued for: ..."
    const response: Success = {
      ok: true,
      answer: `Research queued for: ${query}`,
      sources: [],
    };

    return NextResponse.json<ResearchResponse>(response);

  } catch (error) {
    console.error('[RESEARCH_API_ERROR]', error);
    return NextResponse.json<Fail>(
      { ok: false, error: 'Internal server error', requestId: rid },
      { status: 500 }
    );
  }
}
