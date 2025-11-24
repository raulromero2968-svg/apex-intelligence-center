// FILE: app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Ensure this matches your installed version or use latest
});

export async function POST(req: Request) {
  try {
    // 1. Parse the request
    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // 2. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Redirect paths
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://apex-intelligence-center.vercel.app'}/portfolio?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://apex-intelligence-center.vercel.app'}/subscribe?canceled=true`,
    });

    // 3. Return the URL
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
