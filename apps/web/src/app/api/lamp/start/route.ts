import { NextRequest, NextResponse } from 'next/server';
import { startSimulation } from '@/server/api/routers/lampRouter';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await startSimulation(body);
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

