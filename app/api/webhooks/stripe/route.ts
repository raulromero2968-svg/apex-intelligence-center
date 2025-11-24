import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// You will get this secret from the Stripe Dashboard > Developers > Webhooks
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature') as string;

  let event;

  try {
    if (!endpointSecret) throw new Error('Missing Stripe Webhook Secret');
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object;
      // TODO: Update your database here
      // Example: await db.user.update({ where: { stripeAccountId: account.id }, data: { chargesEnabled: account.charges_enabled } });
      console.log(`ℹ️ Account ${account.id} status updated: Charges Enabled = ${account.charges_enabled}`);
      break;

    case 'checkout.session.completed':
      const session = event.data.object;
      // TODO: Fulfill the order (email the user, unlock the card in the database)
      console.log(`✅ Sale completed! Session ID: ${session.id}`);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
