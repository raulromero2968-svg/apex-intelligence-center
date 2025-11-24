import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST: Generate an Account Link for onboarding
export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // 2. Create the Account Link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/connect`, // Return here if they get stuck
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/connect`,  // Return here upon completion
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
