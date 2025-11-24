import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST: Create a new Connected Account
export async function POST() {
  try {
    // 1. Create the account with Platform Controls
    // We strictly avoid top-level 'type' and use the 'controller' hash as requested.
    const account = await stripe.accounts.create({
      controller: {
        // Platform (Apex) sets pricing and collects fees
        fees: {
          payer: 'application',
        },
        // Platform (Apex) is liable for chargebacks/refunds
        losses: {
          payments: 'application',
        },
        // Enable Express Dashboard for the user to manage payouts
        stripe_dashboard: {
          type: 'express',
        },
      },
    });

    return NextResponse.json({ accountId: account.id });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
