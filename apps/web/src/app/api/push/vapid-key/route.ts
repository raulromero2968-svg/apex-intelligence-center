/**
 * VAPID Public Key API
 *
 * Returns the VAPID public key needed for client-side push subscription
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import { getVapidPublicKey } from '@/lib/webpush';

/**
 * GET /api/push/vapid-key - Get VAPID public key for push subscription
 */
export async function GET() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Web push not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    publicKey,
  });
}

