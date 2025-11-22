#!/usr/bin/env node

/**
 * Stripe Product Setup Script
 * This script creates the products and prices in your Stripe account
 *
 * Usage:
 *   1. Install Stripe CLI: npm install stripe
 *   2. Set environment variable: export STRIPE_SECRET_KEY=sk_test_...
 *   3. Run: node setup-stripe-products.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // Create Premium Product
    console.log('Creating Premium product...');
    const premiumProduct = await stripe.products.create({
      name: 'Apex Intelligence Premium',
      description: 'Unlimited access to insights, blog, and collector tools',
      metadata: {
        tier: 'premium'
      }
    });
    console.log('✅ Premium product created:', premiumProduct.id);

    // Create Premium Monthly Price
    const premiumMonthly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        tier: 'premium',
        billing: 'monthly'
      }
    });
    console.log('✅ Premium Monthly price created:', premiumMonthly.id);

    // Create Premium Yearly Price
    const premiumYearly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 9900, // $99 in cents
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        tier: 'premium',
        billing: 'yearly'
      }
    });
    console.log('✅ Premium Yearly price created:', premiumYearly.id);

    // Create Pro Product
    console.log('\nCreating Pro product...');
    const proProduct = await stripe.products.create({
      name: 'Apex Intelligence Pro',
      description: 'Full access including research articles, datasets, and priority support',
      metadata: {
        tier: 'pro'
      }
    });
    console.log('✅ Pro product created:', proProduct.id);

    // Create Pro Monthly Price
    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2999, // $29.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        tier: 'pro',
        billing: 'monthly'
      }
    });
    console.log('✅ Pro Monthly price created:', proMonthly.id);

    // Create Pro Yearly Price
    const proYearly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 29900, // $299 in cents
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        tier: 'pro',
        billing: 'yearly'
      }
    });
    console.log('✅ Pro Yearly price created:', proYearly.id);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL PRODUCTS AND PRICES CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Copy these Price IDs to your .env file:\n');
    console.log(`STRIPE_PRICE_PREMIUM_MONTHLY=${premiumMonthly.id}`);
    console.log(`STRIPE_PRICE_PREMIUM_YEARLY=${premiumYearly.id}`);
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_YEARLY=${proYearly.id}`);
    console.log('\n📋 Product IDs (for reference):\n');
    console.log(`Premium Product: ${premiumProduct.id}`);
    console.log(`Pro Product: ${proProduct.id}`);
    console.log('\n💡 Next steps:');
    console.log('1. Copy the price IDs above');
    console.log('2. Add them to your .env file');
    console.log('3. Update subscribe.html with these IDs');
    console.log('4. Deploy to Vercel');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupProducts();
