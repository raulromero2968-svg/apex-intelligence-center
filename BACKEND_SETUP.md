# Backend Integration Setup Guide

This document explains the backend architecture and how to connect real data sources.

## Overview

The Apex Intelligence platform uses a modular backend architecture with the following components:

- **Authentication**: User management and session handling
- **Price API**: Real-time TCG price data from multiple sources
- **Portfolio**: User collection tracking and valuation
- **Alerts**: Price notifications and monitoring
- **Analytics**: User behavior and conversion tracking

## Architecture

```
┌─────────────────┐
│   Next.js App   │
└────────┬────────┘
         │
         ├─── lib/auth/context.tsx (Auth Provider)
         ├─── lib/api/client.ts (HTTP Client)
         ├─── lib/api/prices.ts (Price Service)
         ├─── lib/api/portfolio.ts (Portfolio Service)
         ├─── lib/api/alerts.ts (Alert Service)
         └─── lib/analytics.ts (Analytics)
                 │
                 ▼
         ┌───────────────────┐
         │  Backend Services │
         └───────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼────┐    ┌─────▼─────┐
    │ TCGPlayer│    │   eBay    │
    │   API    │    │    API    │
    └──────────┘    └───────────┘
```

## Current State

**Development Mode**: The application currently runs in **mock data mode** for development purposes. All API calls return simulated data without requiring external API keys.

**Production Ready**: The architecture is production-ready and can be connected to real services by following the steps below.

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Authentication Setup (Supabase)

**Option A: Supabase (Recommended)**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get your project URL and anon key from Settings > API
4. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run database migrations:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  condition TEXT,
  graded BOOLEAN DEFAULT false,
  grading_company TEXT,
  grade INT,
  purchase_price DECIMAL,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  condition TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  target_price DECIMAL,
  percent_change DECIMAL,
  active BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  last_triggered_at TIMESTAMPTZ,
  notification_method TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Option B: Custom Auth**

Implement your own authentication by modifying `lib/auth/context.tsx` to call your backend.

### 3. Price Data Integration

**TCGPlayer API**

1. Sign up at [TCGPlayer Marketplace API](https://www.tcgplayer.com/marketplace/api)
2. Get API credentials
3. Add to `.env.local`:

```env
TCGPLAYER_PUBLIC_KEY=your_public_key
TCGPLAYER_PRIVATE_KEY=your_private_key
```

4. Update `lib/api/config.ts` to enable real-time prices:

```env
NEXT_PUBLIC_ENABLE_REAL_TIME_PRICES=true
```

**eBay Browse API**

1. Create developer account at [developer.ebay.com](https://developer.ebay.com/)
2. Create application and get credentials
3. Add to `.env.local`:

```env
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
```

### 4. Payment Integration (Stripe)

1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard
3. Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. Create products in Stripe Dashboard:
   - Intelligence Plan: $29/month
   - Apex Plan: $99/month

5. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Email Notifications

**SendGrid**

```env
SENDGRID_API_KEY=your_api_key
EMAIL_FROM=noreply@apex-intelligence.io
```

**Resend (Alternative)**

```env
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@apex-intelligence.io
```

### 6. Analytics

The platform includes built-in privacy-focused analytics. To send events to an external service:

```env
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-api.com/track
```

Compatible with: Plausible, PostHog, Mixpanel, Segment, etc.

## API Endpoints to Implement

When moving to production, implement these Next.js API routes:

### `/app/api/prices/search/route.ts`

```typescript
export async function GET(request: Request) {
  // Search TCGPlayer/eBay for cards
  // Return CardPrice[]
}
```

### `/app/api/portfolio/route.ts`

```typescript
export async function GET(request: Request) {
  // Get user's portfolio from database
}

export async function POST(request: Request) {
  // Add item to portfolio
}
```

### `/app/api/alerts/route.ts`

```typescript
export async function GET(request: Request) {
  // Get user's price alerts
}

export async function POST(request: Request) {
  // Create new alert
}
```

### `/app/api/webhooks/stripe/route.ts`

```typescript
export async function POST(request: Request) {
  // Handle Stripe subscription webhooks
  // Update user tier in database
}
```

## Testing

### Mock Mode (Current)

No configuration needed. All services return realistic mock data.

### Integration Testing

1. Enable real APIs in `.env.local`:

```env
NEXT_PUBLIC_ENABLE_REAL_TIME_PRICES=true
NEXT_PUBLIC_ENABLE_PRICE_ALERTS=true
```

2. Run tests:

```bash
npm run test:integration
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Self-Hosted

1. Build production bundle:

```bash
npm run build
```

2. Start server:

```bash
npm run start
```

3. Configure reverse proxy (nginx/Caddy)
4. Set up SSL certificate

## Security Checklist

- [ ] Rotate all API keys before production
- [ ] Enable HTTPS only
- [ ] Set up CORS properly
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CSP headers
- [ ] Configure environment variables in production
- [ ] Set up monitoring and error tracking
- [ ] Enable database backups
- [ ] Implement audit logging

## Support

For implementation help, refer to:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TCGPlayer API Docs](https://docs.tcgplayer.com/)

## Development Roadmap

**Current Features**:
- ✅ Mock authentication
- ✅ Mock price data
- ✅ Client-side portfolio
- ✅ Mock alerts

**Next Steps**:
- [ ] Connect Supabase auth
- [ ] Implement API routes
- [ ] Connect TCGPlayer API
- [ ] Set up Stripe webhooks
- [ ] Enable email notifications
- [ ] Add Redis caching
- [ ] Implement rate limiting
