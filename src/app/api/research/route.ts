import { NextRequest, NextResponse } from 'next/server';

interface Success {
  ok: true;
  answer: string;
  sources: never[];
  requestId: string;
}

interface Fail {
  ok: false;
  error: string;
  requestId: string;
}

type ResearchResponse = Success | Fail;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rid = crypto.randomUUID().slice(0, 8);
  try {
    const { query } = await req.json();

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json<Fail>(
        { ok: false, error: 'Bad Request: missing query', requestId: rid },
        { status: 400 }
      );
    }

    const response: Success = {
      ok: true,
      answer: `Research queued for: ${query}`,
      sources: [],
      requestId: rid,
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
