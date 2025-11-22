/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * Implements idempotent updates and proper error handling.
 *
 * SECURITY CRITICAL: This is the ONLY route that can update subscription tiers.
 * Tier assignment is derived server-side from priceId using PRICE_TO_TIER_MAP.
 * NEVER trust tier information from metadata or client requests.
 *
 * Events handled:
 * - checkout.session.completed: Initial subscription creation
 * - customer.subscription.updated: Subscription changes (upgrades, renewals)
 * - customer.subscription.deleted: Subscription cancellation
 */

import { NextRequest } from 'next/server';
import { stripe, mapPriceIdToTier } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

// Webhook events we care about
const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return Response.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Ignore events we don't handle
  if (!RELEVANT_EVENTS.has(event.type)) {
    return Response.json({ received: true, ignored: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateUserSubscription(userId, subscription);
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await updateUserSubscription(userId, subscription);
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Revert to free tier
  await db
    .update(users)
    .set({
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: null,
    })
    .where(eq(users.id, userId));

  console.log(`Subscription canceled for user ${userId}`);
}

/**
 * Update user subscription in database (idempotent)
 *
 * SECURITY CRITICAL: Tier is ONLY derived from priceId using server-side mapping.
 * NEVER trust metadata or client-provided tier information.
 */
async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  // SECURITY: Get priceId from subscription and map to tier server-side
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // SECURITY: Use ONLY server-side price-to-tier mapping
  // NEVER trust tier from metadata - it may have been manipulated
  const tier = mapPriceIdToTier(priceId);

  // Map Stripe status to our status
  const status = mapSubscriptionStatus(subscription.status);

  // Update user with tier derived ONLY from priceId
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(users.id, userId));

  console.log(
    `SECURITY: Updated subscription for user ${userId}: ` +
    `tier=${tier} (derived from priceId=${priceId}), ` +
    `status=${status}, ` +
    `subscriptionId=${subscription.id}`
  );
}

/**
 * Map Stripe subscription status to our enum
 */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'trialing' | null {
  switch (status) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    case 'trialing':
      return 'trialing';
    default:
      return null;
  }
}
