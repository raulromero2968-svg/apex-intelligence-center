import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST: Initialize Checkout Session
export async function POST(request: Request) {
  try {
    const { priceId, connectedAccountId } = await request.json();

    if (!priceId || !connectedAccountId) {
      return NextResponse.json({ error: 'Missing price or seller ID' }, { status: 400 });
    }

    // 5. Create Checkout Session with Destination Charge
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // We take a $5.00 platform fee (500 cents) for providing the analytics & marketplace
        application_fee_amount: 500,
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/store`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
