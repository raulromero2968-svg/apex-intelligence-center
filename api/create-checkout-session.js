/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * Endpoint: /api/create-checkout-session
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, customerEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get the site URL from environment or use the request origin
    const siteUrl = process.env.SITE_URL || req.headers.origin || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe.html`,
      metadata: {
        priceId: priceId,
      },
      subscription_data: {
        metadata: {
          priceId: priceId,
        },
      },
      // Enable customer portal for subscription management
      billing_address_collection: 'auto',
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};
