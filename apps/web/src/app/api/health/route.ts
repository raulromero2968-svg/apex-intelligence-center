/**
 * Health check endpoint for test server harness
 * Returns 200 OK when the server is ready
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}


