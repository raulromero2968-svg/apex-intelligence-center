/**
 * Vercel Serverless Function: Stripe Webhook Handler
 * Endpoint: /api/webhook
 *
 * Handles Stripe webhook events for subscription lifecycle
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// We need to get the raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let buffer = [];
    req.on('data', (chunk) => buffer.push(chunk));
    req.on('end', () => resolve(Buffer.concat(buffer)));
    req.on('error', reject);
  });
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('✅ Checkout completed:', session.id);
        console.log('   Customer:', session.customer);
        console.log('   Subscription:', session.subscription);

        // Here you would typically:
        // 1. Store the customer ID and subscription ID in your database
        // 2. Grant access to premium content
        // 3. Send a welcome email

        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('✅ Subscription created:', subscription.id);
        console.log('   Customer:', subscription.customer);
        console.log('   Status:', subscription.status);

        // Grant access to the subscription tier
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('📝 Subscription updated:', subscription.id);
        console.log('   Status:', subscription.status);

        // Update user's subscription status (e.g., if they upgraded/downgraded)
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('❌ Subscription cancelled:', subscription.id);
        console.log('   Customer:', subscription.customer);

        // Revoke access to premium content
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('💰 Payment succeeded:', invoice.id);
        console.log('   Amount:', invoice.amount_paid / 100, invoice.currency.toUpperCase());

        // Confirm ongoing access
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('⚠️ Payment failed:', invoice.id);
        console.log('   Customer:', invoice.customer);

        // Notify customer of payment failure
        // Optionally suspend access if multiple failures
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
