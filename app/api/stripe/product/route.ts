import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// POST: Create a Product linked to a Connected Account
export async function POST(request: Request) {
  try {
    const { name, description, priceInCents, connectedAccountId } = await request.json();

    // Validate inputs
    if (!name || !priceInCents || !connectedAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Create Product on the Platform
    // We store the mapping to the Connected Account in 'metadata'
    const product = await stripe.products.create({
      name: name,
      description: description || 'High-value TCG Asset',
      default_price_data: {
        unit_amount: priceInCents,
        currency: 'usd',
      },
      metadata: {
        connected_account_id: connectedAccountId, // CRITICAL: This maps the item to the seller
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: List all products (Simulating a Marketplace Feed)
export async function GET() {
  try {
    // In production, we would query our Postgres DB.
    // For this demo, we list active products directly from Stripe.
    const products = await stripe.products.list({
      limit: 20,
      active: true,
      expand: ['data.default_price'], // Expand to see price details
    });

    return NextResponse.json({ products: products.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
