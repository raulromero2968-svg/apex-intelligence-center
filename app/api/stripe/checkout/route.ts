import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { priceId, connectedAccountId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing Price ID' }, { status: 400 });
    }

    // LOGIC FORK: Determine if this is a Marketplace Sale or a Platform Subscription
    const isMarketplaceTransaction = !!connectedAccountId;

    let sessionConfig: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/store`,
    };

    if (isMarketplaceTransaction) {
      // SCENARIO A: MARKETPLACE (Buying a Card)
      // We collect the funds and transfer them to the Seller (connectedAccount)
      sessionConfig.mode = 'payment';
      sessionConfig.payment_intent_data = {
        application_fee_amount: 500, // $5.00 Platform Fee
        transfer_data: {
          destination: connectedAccountId,
        },
      };
    } else {
      // SCENARIO B: PLATFORM SUBSCRIPTION (Upgrading to Whale/Pro)
      // The money goes directly to Apex Intelligence. No transfer needed.
      sessionConfig.mode = 'subscription';
      // Note: Subscriptions do not use payment_intent_data.transfer_data
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout Error:', error); // Log this to see the "Whale" crash details
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
