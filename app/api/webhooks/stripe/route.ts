import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Webhook Handler
 *
 * Handles subscription lifecycle events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();

  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  // Get user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine tier from subscription price
  const tier = getTierFromSubscription(subscription);

  // Update user tier
  await supabase
    .from('users')
    .update({ tier })
    .eq('id', user.id);

  // Upsert subscription record
  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: user.id,
      stripe_subscription_id: subscriptionId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    });

  console.log(`Subscription updated for user ${user.id}: ${tier}`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();

  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('users')
    .update({ tier: 'free' })
    .eq('id', user.id);

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription canceled for user ${user.id}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = createSupabaseAdminClient();

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to active
  await supabase
    .from('user_subscriptions')
    .update({ status: 'active' })
    .eq('stripe_subscription_id', subscriptionId);

  // TODO: Send payment success email
  console.log(`Payment succeeded for user ${user.id}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createSupabaseAdminClient();

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  // TODO: Send payment failed email
  console.log(`Payment failed for user ${user.id}`);
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createSupabaseAdminClient();

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    // If user doesn't exist, they might have signed up during checkout
    // Get user from session metadata
    const userId = session.metadata?.userId;
    if (userId) {
      // Link Stripe customer to user
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
  }

  console.log(`Checkout completed for subscription ${subscriptionId}`);
}

/**
 * Determine tier from subscription
 */
function getTierFromSubscription(subscription: Stripe.Subscription): 'free' | 'intelligence' | 'apex' {
  // Get price ID from subscription items
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    return 'free';
  }

  // Map price IDs to tiers (these should match your Stripe product prices)
  const PRICE_TIER_MAP: Record<string, 'intelligence' | 'apex'> = {
    [process.env.STRIPE_INTELLIGENCE_PRICE_ID || '']: 'intelligence',
    [process.env.STRIPE_APEX_PRICE_ID || '']: 'apex',
  };

  return PRICE_TIER_MAP[priceId] || 'free';
}
