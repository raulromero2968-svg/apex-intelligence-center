/**
 * Stripe Security Middleware
 *
 * SECURITY: Prevents client-side subscription tier manipulation attacks.
 * Clients MUST NOT be allowed to specify their own subscription tier.
 * Tier assignment is ONLY done server-side via Stripe webhook events.
 */

import { NextRequest } from 'next/server';

/**
 * Validates that the request body does not contain forbidden fields
 * that could allow clients to manipulate their subscription tier.
 *
 * @throws Error with 403 status if forbidden fields are detected
 */
export async function validateNoTierManipulation(req: NextRequest): Promise<void> {
  const contentType = req.headers.get('content-type');

  // Only validate JSON requests
  if (!contentType?.includes('application/json')) {
    return;
  }

  let body: any;

  try {
    const bodyText = await req.text();
    if (!bodyText) return;

    body = JSON.parse(bodyText);
  } catch {
    // If we can't parse the body, let the route handler deal with it
    return;
  }

  // Check for forbidden fields that allow tier manipulation
  const forbiddenFields = [
    'subscriptionTier',
    'subscription_tier',
    'tier',
    'subscriptionStatus',
    'subscription_status',
  ];

  const foundForbiddenFields = forbiddenFields.filter(field =>
    field in body || field.toLowerCase() in body
  );

  if (foundForbiddenFields.length > 0) {
    throw new Error(
      `SECURITY: Client-side tier manipulation attempt detected. ` +
      `Forbidden fields in request: ${foundForbiddenFields.join(', ')}. ` +
      `Subscription tiers can only be set via verified Stripe webhooks.`
    );
  }
}

/**
 * Error response for tier manipulation attempts
 */
export function createTierManipulationErrorResponse(message: string) {
  return Response.json(
    {
      error: 'Forbidden',
      message,
      code: 'TIER_MANIPULATION_ATTEMPT',
    },
    { status: 403 }
  );
}
