/**
 * Vercel Serverless Function: Create Stripe Customer Portal Session
 * Endpoint: /api/create-portal-session
 *
 * This allows customers to manage their subscriptions (cancel, update payment method, etc.)
 */

// Initialize Stripe only if secret key is available (optional for build)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is configured
  if (!stripe || !stripeSecretKey) {
    return res.status(503).json({ 
      error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' 
    });
  }

  try {
    const { sessionId, customerId } = req.body;

    let customer;

    // If we have a session ID, retrieve the customer from the session
    if (sessionId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      customer = checkoutSession.customer;
    } else if (customerId) {
      customer = customerId;
    } else {
      return res.status(400).json({ error: 'Session ID or Customer ID is required' });
    }

    // Get the site URL from environment or use the request origin
    const siteUrl = process.env.SITE_URL || req.headers.origin || 'http://localhost:3000';

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer,
      return_url: `${siteUrl}/account.html`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
};
