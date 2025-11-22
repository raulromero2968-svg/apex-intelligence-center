# Stripe Monetization System – CLAUDE_SESSION_10

Complete production-ready subscription system with tiered access control, comprehensive testing, and bulletproof error handling.

## Overview

The Apex Intelligence Center now includes a full-featured Stripe subscription system with three tiers:

| Tier | Price | Watchlist Limit | API Calls/Day | Features |
|------|-------|----------------|---------------|----------|
| **Free** | $0 | 10 | 100 | Basic alerts, Public data |
| **Pro** | $29/mo | 100 | 10,000 | Free + Web push notifications, Priority feed |
| **Enterprise** | $299/mo | Unlimited | 1,000,000 | Pro + Dedicated support, Custom integrations |

All limits are enforced **server-side** with zero trust architecture.

## Architecture

### Database Schema

```sql
-- Extended users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status TEXT;
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMPTZ;

-- New watchlist_items table
CREATE TABLE watchlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  card_id TEXT NOT NULL REFERENCES cards(id),
  target_price REAL NOT NULL,
  direction TEXT NOT NULL,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Key Components

1. **Stripe Client** (`src/lib/stripe.ts`)
   - Singleton Stripe instance
   - Tier limits configuration
   - Helper functions for feature checks

2. **Error Handling** (`src/lib/errors.ts`)
   - Custom error classes (ValidationError, TierLimitError, etc.)
   - Unified error formatting
   - Sentry integration ready

3. **Tier Enforcement** (`src/lib/tier-enforcement.ts`)
   - Redis-backed rate limiting
   - Token bucket algorithm
   - Per-tier API limits

4. **API Routes**
   - `POST /api/stripe/checkout` - Create subscription checkout session
   - `POST /api/stripe/webhook` - Handle Stripe webhook events
   - `GET/POST/DELETE /api/watchlist` - Manage watchlist items

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

Dependencies added:
- `stripe` (already installed)
- `zod` - Runtime validation
- `@upstash/ratelimit` (already installed)

### 2. Configure Environment Variables

Add to `.env`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs (get these from Stripe dashboard or setup script)
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_ENTERPRISE_MONTHLY="price_..."

# Public key for frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. Create Stripe Products

Run the existing setup script:

```bash
pnpm setup-stripe
```

This creates:
- Premium product ($9.99/mo) - NOTE: Renamed to Pro in our system
- Pro product ($29.99/mo) - NOTE: Maps to Enterprise in our system

Update the script or manually create products matching our tiers.

### 4. Run Database Migration

```bash
pnpm db:migrate
```

This runs migration `0022_stripe_subscriptions_watchlist.sql`.

### 5. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration

Run unit tests:

```bash
pnpm test:unit
```

Test coverage includes:
- ✅ Watchlist tier limits
- ✅ Subscription upgrades/downgrades
- ✅ Error handling
- ✅ Rate limiting
- ✅ Webhook events

## Usage Examples

### Creating a Checkout Session (Frontend)

```typescript
async function handleUpgrade(tier: 'pro' | 'enterprise') {
  const priceId = tier === 'pro'
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE;

  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ priceId, tier }),
  });

  const { url } = await response.json();
  window.location.href = url;
}
```

### Adding Watchlist Item (Frontend)

```typescript
async function addToWatchlist(cardId: string, targetPrice: number, direction: 'above' | 'below') {
  const response = await fetch('/api/watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ cardId, targetPrice, direction }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.statusCode === 403 && error.limit) {
      // Show upgrade prompt
      alert(`Watchlist limit reached (${error.limit}). Upgrade to add more!`);
    }
  }

  return response.json();
}
```

### Checking Rate Limits (Backend)

```typescript
import { getUserFromRequest } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/tier-enforcement';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce rate limit
  await enforceRateLimit(user);

  // ... rest of API logic
}
```

## Testing

### Unit Tests

Run all tests:

```bash
pnpm test
```

Run with coverage:

```bash
pnpm test:unit -- --coverage
```

### Manual Testing Checklist

- [ ] Free user can add up to 10 watchlist items
- [ ] Free user gets 403 error when adding 11th item
- [ ] Pro user can add up to 100 watchlist items
- [ ] Stripe checkout creates session and redirects
- [ ] Webhook updates user subscription tier
- [ ] Subscription cancellation reverts to free tier
- [ ] Rate limiting blocks excessive API calls
- [ ] Error messages are user-friendly

## Monitoring

### Stripe Dashboard

Monitor subscriptions at: https://dashboard.stripe.com/subscriptions

Key metrics:
- Monthly Recurring Revenue (MRR)
- Churn rate
- Upgrade/downgrade events

### Rate Limiting Analytics

Check Redis analytics:

```typescript
import { getRateLimitStatus } from '@/lib/tier-enforcement';

const status = await getRateLimitStatus(user);
console.log(`API calls remaining: ${status.remaining}/${status.limit}`);
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook signature verification
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Rate Limiting Not Working

1. Verify Redis connection: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Check Redis logs in Upstash dashboard
3. In development, rate limiting logs warnings if Redis is unavailable

### Tier Limits Not Enforced

1. Ensure middleware is applied to API routes
2. Check JWT token includes `subscriptionTier`
3. Verify database has correct subscription data

## Security Considerations

✅ **Zero Trust**: All limits enforced server-side
✅ **Webhook Verification**: Stripe signature validation
✅ **JWT Authentication**: Per-request authentication
✅ **Rate Limiting**: Redis-backed token bucket
✅ **SQL Injection**: Drizzle ORM parameterized queries
✅ **XSS Protection**: Zod input validation

## Future Enhancements

- [ ] Annual billing with discount
- [ ] Team/organization subscriptions
- [ ] Usage-based pricing for enterprise
- [ ] Stripe customer portal
- [ ] Invoice management
- [ ] Payment method updates

## Support

For issues or questions:
1. Check [Stripe Documentation](https://stripe.com/docs)
2. Review test files in `src/__tests__/`
3. Check Sentry for error logs

---

**CLAUDE_SESSION_10 complete.** 🚀

Next: CLAUDE_SESSION_11 – Real-time Leaderboard + Portfolio Tracker + Monte Carlo ROI Simulator
