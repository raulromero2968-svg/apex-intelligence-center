// apps/web/src/app/api/viz/daily/route.ts

import { NextResponse } from 'next/server';

const NOT_AVAILABLE_MESSAGE =
  'Daily viz API is not available in this environment.';

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: NOT_AVAILABLE_MESSAGE,
    },
    { status: 501 },
  );
}

export async function POST(_req: Request) {
  return NextResponse.json(
    {
      ok: false,
      message: NOT_AVAILABLE_MESSAGE,
    },
    { status: 501 },
  );
}
