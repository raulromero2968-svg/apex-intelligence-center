import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

export interface UserWithTier {
  id: string;
  email: string;
  tier?: string;
  [key: string]: unknown;
}

type JwtPayload = {
  sub?: string;
  email?: string;
  tier?: string;
  [key: string]: unknown;
};

function base64UrlDecode(segment: string): Buffer | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded =
      normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
  } catch {
    return null;
  }
}

function verifyJwt(token: string, secret: string): JwtPayload | null {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const headerBuffer = base64UrlDecode(encodedHeader);
  const payloadBuffer = base64UrlDecode(encodedPayload);

  if (!headerBuffer || !payloadBuffer) {
    return null;
  }

  try {
    const header = JSON.parse(headerBuffer.toString());
    if (header.alg !== 'HS256') {
      return null;
    }
  } catch {
    return null;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest()
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadBuffer.toString());
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  req: NextRequest
): Promise<UserWithTier | null> {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.JWT_SECRET;

  if (!authHeader || !secret) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const payload = verifyJwt(match[1], secret);
  if (!payload || typeof payload.sub !== 'string') {
    return null;
  }

  return {
    id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    tier: typeof payload.tier === 'string' ? payload.tier : undefined,
    ...payload,
  };
}

