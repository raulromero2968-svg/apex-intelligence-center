# Production Deployment Guide

This guide walks you through deploying Apex Intelligence to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations run successfully
- [ ] Stripe products and prices created
- [ ] Email provider configured (Resend or SendGrid)
- [ ] TCGPlayer API keys obtained (optional)
- [ ] Domain DNS configured
- [ ] SSL certificate ready (Vercel handles this automatically)

---

## Step 1: Set Up Supabase

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and fill in project details
4. Wait for project to provision (~2 minutes)

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Or manually run the SQL from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

### Get API Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Step 2: Configure Stripe

### Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Products → Add Product

**Intelligence Tier:**
- Name: "Apex Intelligence - Intelligence Tier"
- Price: $29/month
- Recurring billing
- Copy Price ID → `STRIPE_INTELLIGENCE_PRICE_ID`

**Apex Tier:**
- Name: "Apex Intelligence - Apex Tier"
- Price: $99/month
- Recurring billing
- Copy Price ID → `STRIPE_APEX_PRICE_ID`

### Set Up Webhook

1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://apex-intelligence.io/api/webhooks/stripe`
3. Listen to events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. Copy Webhook Signing Secret → `STRIPE_WEBHOOK_SECRET`

### Get API Keys

1. Developers → API keys
2. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY` (keep secret!)

---

## Step 3: Configure Email

### Option A: Resend (Recommended)

1. Go to [resend.com](https://resend.com)
2. Create account and verify domain
3. API Keys → Create API Key
4. Copy key → `RESEND_API_KEY`

### Option B: SendGrid

1. Go to [sendgrid.com](https://sendgrid.com)
2. Settings → API Keys → Create API Key
3. Copy key → `SENDGRID_API_KEY`

---

## Step 4: Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. Push code to GitHub:
```bash
git push origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install --frozen-lockfile`

5. Add Environment Variables (see Step 5)

6. Deploy!

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Step 5: Environment Variables

Add these in Vercel Dashboard → Project → Settings → Environment Variables:

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_INTELLIGENCE_PRICE_ID=price_...
STRIPE_APEX_PRICE_ID=price_...

# Email (Resend OR SendGrid)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@apex-intelligence.io

# Production URL
PRODUCTION_URL=https://apex-intelligence.io
```

### Optional Variables

```env
# TCGPlayer (for real-time prices)
TCGPLAYER_PUBLIC_KEY=your_public_key
TCGPLAYER_PRIVATE_KEY=your_private_key

# eBay (for price data)
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id

# Analytics
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics.com/track

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME_PRICES=true
NEXT_PUBLIC_ENABLE_PRICE_ALERTS=true
NEXT_PUBLIC_ENABLE_PORTFOLIO_SYNC=true
```

---

## Step 6: Configure Domain

### Add Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `apex-intelligence.io`
3. Add DNS records (Vercel provides instructions)
4. Wait for DNS propagation (~5-60 minutes)
5. Vercel automatically provisions SSL certificate

### Update Stripe Webhook

Once domain is live:
1. Stripe Dashboard → Webhooks
2. Update endpoint URL to production domain
3. Test webhook: Send test event

---

## Step 7: Verify Deployment

### Test Checklist

```bash
# Run production tests
npm run test:production
```

Manual verification:

- [ ] Homepage loads correctly
- [ ] Sign up / Sign in works
- [ ] Portfolio CRUD operations work
- [ ] Price data displays correctly
- [ ] Stripe checkout flow works
- [ ] Webhooks receive events
- [ ] Emails send successfully
- [ ] Price alerts trigger
- [ ] Mobile responsive
- [ ] SEO metadata present

---

## Step 8: Post-Deployment

### Monitor

- **Vercel Logs**: Check for errors in deployment logs
- **Supabase**: Monitor database queries and performance
- **Stripe**: Watch for payment failures or webhook errors
- **Email**: Monitor delivery rates

### Security

```bash
# Run security audit
npm audit

# Check for outdated dependencies
npm outdated

# Update critical packages
npm update
```

### Performance

- Run Lighthouse audit: https://pagespeed.web.dev/
- Target scores: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO
- Enable Vercel Analytics for real-user monitoring

### Backups

- **Database**: Supabase automatically backs up daily
- **Code**: GitHub contains all source code
- **Environment Variables**: Store securely in password manager

---

## Troubleshooting

### Build Failures

```bash
# Clear Vercel cache
vercel --force

# Check build logs
vercel logs [deployment-url]

# Test locally
pnpm build
```

### Database Connection Errors

1. Check Supabase project status
2. Verify environment variables are correct
3. Check RLS policies in Supabase dashboard

### Stripe Webhook Failures

1. Check webhook signature secret
2. Verify endpoint URL is correct
3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger customer.subscription.created
```

### Email Not Sending

1. Check API key is correct
2. Verify domain is verified (Resend/SendGrid)
3. Check spam folder
4. Review email service logs

---

## Rollback Procedure

If deployment fails:

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

Or via CLI:
```bash
vercel rollback
```

---

## Scaling Considerations

### Database

- Supabase Free tier: 500MB database, 2GB bandwidth
- Upgrade to Pro ($25/month) for:
  - 8GB database
  - 50GB bandwidth
  - Daily backups
  - Point-in-time recovery

### Vercel

- Free tier: 100GB bandwidth, unlimited deployments
- Pro ($20/month/user) for:
  - More bandwidth
  - Team collaboration
  - Advanced analytics

### Stripe

- No monthly fee
- 2.9% + $0.30 per successful charge
- Volume discounts available

---

## Support

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Stripe**: https://support.stripe.com

---

## Next Steps

After successful deployment:

1. Set up monitoring alerts
2. Configure backup strategy
3. Create runbook for common issues
4. Document API rate limits
5. Plan for scaling
6. Set up staging environment
7. Implement CI/CD pipeline
8. Schedule security audits

---

**Congratulations! Apex Intelligence is now live in production.** 🎉
