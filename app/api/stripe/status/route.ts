import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// GET: Check if the account is fully onboarded
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
  }

  try {
    // 3. Retrieve account details directly from Stripe API (No DB cache for this demo)
    const account = await stripe.accounts.retrieve(accountId);

    return NextResponse.json({
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
