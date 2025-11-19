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
  
  // Handle missing or invalid body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    // JSON parse error (empty body, invalid JSON, etc.)
    return NextResponse.json(
      { ok: false, error: 'Bad Request: invalid or missing body', requestId: rid },
      { status: 400 }
    );
  }

  // Validate query exists and is a non-empty string
  const { query } = body || {};
  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json(
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

  return NextResponse.json(response);
}
