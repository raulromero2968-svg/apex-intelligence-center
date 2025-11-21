/**
 * Stripe Checkout Session API
 *
 * Creates a Stripe checkout session for subscription upgrade.
 * Follows Linear/Vercel patterns for seamless subscription management.
 *
 * SECURITY: This route does NOT accept tier from clients.
 * Tier mapping happens server-side in the webhook after payment verification.
 */

import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';

/**
 * SECURITY: Request schema only accepts priceId
 * Tier is NEVER accepted from client - it's derived server-side in webhook
 */
const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Reject any request containing subscription tier fields
    const bodyText = await req.text();
    let body: any;

    try {
      body = JSON.parse(bodyText);
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Check for forbidden tier manipulation fields
    const forbiddenFields = [
      'subscriptionTier',
      'subscription_tier',
      'tier',
      'subscriptionStatus',
      'subscription_status',
    ];

    const foundForbidden = forbiddenFields.filter(field => field in body);

    if (foundForbidden.length > 0) {
      return Response.json(
        {
          error: 'Forbidden',
          message:
            'SECURITY: Client-side tier manipulation attempt detected. ' +
            `Forbidden fields: ${foundForbidden.join(', ')}. ` +
            'Subscription tiers can only be set via verified Stripe webhooks.',
          code: 'TIER_MANIPULATION_ATTEMPT',
        },
        { status: 403 }
      );
    }

    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const { priceId } = checkoutSchema.parse(body);

    // Get user from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      throw new AuthenticationError('User not found');
    }

    // Get or create Stripe customer
    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }

    // Create checkout session
    // SECURITY: Do NOT include tier in metadata - it will be derived from priceId in webhook
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        // SECURITY: Tier is NOT stored here - derived from priceId in webhook
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          // SECURITY: Tier is NOT stored here - derived from priceId in webhook
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return Response.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}
