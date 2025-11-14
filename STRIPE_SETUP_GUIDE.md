# Stripe Integration Setup Guide

## ⚠️ IMPORTANT: Test Keys vs Live Keys

Your provided keys start with `pk_live_` and `sk_live_` - these are **PRODUCTION** keys!

For **testing**, you need to get your **test keys** from Stripe:
1. Go to Stripe Dashboard
2. Toggle to **"Test mode"** (switch in the top right)
3. Go to **Developers** → **API Keys**
4. Copy `pk_test_...` and `sk_test_...`

**Always test with test keys first before going live!**

---

## Setup Steps

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `stripe` - Stripe SDK for Node.js
- `vercel` - Vercel CLI for local development

---

### Step 2: Create Stripe Products (IMPORTANT!)

Run this script to automatically create products and prices in Stripe:

```bash
# For testing (recommended first)
export STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
node setup-stripe-products.js

# OR for production (only after testing!)
export STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
node setup-stripe-products.js
```

The script will output something like:

```
✅ ALL PRODUCTS AND PRICES CREATED SUCCESSFULLY!

📋 Copy these Price IDs to your .env file:

STRIPE_PRICE_PREMIUM_MONTHLY=price_1ABC123DEF456
STRIPE_PRICE_PREMIUM_YEARLY=price_2GHI789JKL012
STRIPE_PRICE_PRO_MONTHLY=price_3MNO345PQR678
STRIPE_PRICE_PRO_YEARLY=price_4STU901VWX234
```

**COPY THESE PRICE IDs** - you'll need them in the next step!

---

### Step 3: Update Configuration Files

#### A. Update `.env` file

Replace the placeholder price IDs with your actual ones:

```bash
# Update these lines in .env
STRIPE_PRICE_PREMIUM_MONTHLY=price_1ABC123DEF456  # ← Your actual ID
STRIPE_PRICE_PREMIUM_YEARLY=price_2GHI789JKL012  # ← Your actual ID
STRIPE_PRICE_PRO_MONTHLY=price_3MNO345PQR678     # ← Your actual ID
STRIPE_PRICE_PRO_YEARLY=price_4STU901VWX234      # ← Your actual ID
```

#### B. Update `subscribe.html`

Open `subscribe.html` and find lines 497-502:

```javascript
const STRIPE_PRICES = {
    premium_monthly: 'price_1ABC123DEF456',  // ← Paste your actual ID
    premium_yearly: 'price_2GHI789JKL012',   // ← Paste your actual ID
    pro_monthly: 'price_3MNO345PQR678',      // ← Paste your actual ID
    pro_yearly: 'price_4STU901VWX234'        // ← Paste your actual ID
};
```

---

### Step 4: Set Up Vercel Environment Variables

You need to add your Stripe keys to Vercel:

1. Go to your Vercel dashboard
2. Select your project (or import it first)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_YOUR_SECRET_KEY` | Production |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_YOUR_PUBLISHABLE_KEY` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | (see Step 5) | Production |
| `SITE_URL` | Your production URL | Production |

For testing locally, also add these to **Development** environment.

---

### Step 5: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your app about subscription events.

#### For Local Testing:

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Download from: https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to http://localhost:3000/api/webhook

# This will output a webhook secret like: whsec_abc123...
# Copy this and add to your .env file:
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

#### For Production (Vercel):

1. Deploy to Vercel first (Step 6)
2. Get your production URL (e.g., `https://apex-intelligence.vercel.app`)
3. Go to Stripe Dashboard → **Developers** → **Webhooks**
4. Click **Add endpoint**
5. Endpoint URL: `https://YOUR_DOMAIN.vercel.app/api/webhook`
6. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
7. Click **Add endpoint**
8. Copy the **Signing secret** (starts with `whsec_`)
9. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

### Step 6: Deploy to Vercel

#### First Time Setup:

```bash
# Login to Vercel
npx vercel login

# Deploy
npx vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- What's your project's name? `apex-intelligence-center`
- In which directory is your code located? `./`
- Want to override settings? **N**

Your site will be live at: `https://apex-intelligence-center.vercel.app`

#### Subsequent Deployments:

```bash
npx vercel --prod
```

Or just push to GitHub and enable auto-deploy in Vercel.

---

### Step 7: Update Site URL

After deploying, update the `SITE_URL` in Vercel:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add/Update `SITE_URL` to your production URL
3. Example: `https://apex-intelligence-center.vercel.app`

---

### Step 8: Enable Stripe Customer Portal

For the account management page to work, enable Customer Portal in Stripe:

1. Go to Stripe Dashboard → **Settings** → **Billing** → **Customer Portal**
2. Click **Activate**
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans
4. Click **Save changes**

---

## Testing the Complete Flow

### Local Testing:

```bash
# Terminal 1: Start Stripe webhook forwarding
stripe listen --forward-to http://localhost:3000/api/webhook

# Terminal 2: Start Vercel development server
npx vercel dev

# Open browser to: http://localhost:3000
```

### Test with Stripe Test Cards:

1. Go to `http://localhost:3000/subscribe.html`
2. Click "Subscribe Now" on any plan
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. Complete checkout
5. Should redirect to success page
6. Check webhook logs in Terminal 1 for events

---

## Common Issues & Solutions

### Issue: "Price ID not found"

**Solution:** Make sure you ran `setup-stripe-products.js` and updated the price IDs in both `.env` and `subscribe.html`

### Issue: "Webhook signature verification failed"

**Solution:**
- For local: Make sure `stripe listen` is running and you copied the webhook secret to `.env`
- For production: Check that `STRIPE_WEBHOOK_SECRET` is set in Vercel environment variables

### Issue: "Customer Portal not available"

**Solution:** Enable Customer Portal in Stripe Dashboard (Step 8)

### Issue: API endpoints returning 500 errors

**Solution:**
- Check Vercel function logs: `npx vercel logs`
- Verify environment variables are set in Vercel
- Make sure `node_modules` is installed: `npm install`

---

## Files Modified/Created

### New Files:
- ✅ `.env` - Environment variables (DO NOT COMMIT!)
- ✅ `.gitignore` - Protects sensitive files
- ✅ `package.json` - Node.js dependencies
- ✅ `vercel.json` - Vercel configuration
- ✅ `setup-stripe-products.js` - Auto-create Stripe products
- ✅ `api/create-checkout-session.js` - Serverless function for checkout
- ✅ `api/create-portal-session.js` - Serverless function for customer portal
- ✅ `api/webhook.js` - Webhook handler
- ✅ `account.html` - Account management page

### Modified Files:
- ✅ `subscribe.html` - Updated with Stripe integration
- ✅ `success.html` - Added session tracking and account link

---

## Security Checklist

- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] Using test keys for development
- [ ] Webhook signatures are verified
- [ ] Environment variables set in Vercel
- [ ] HTTPS enabled on production site
- [ ] Customer Portal enabled in Stripe

---

## Quick Reference

### Price IDs Location:
- Stripe Dashboard → **Products** → Click on product → See Price IDs

### Webhook Secret:
- Local: Output from `stripe listen` command
- Production: Stripe Dashboard → **Developers** → **Webhooks** → Click endpoint → **Signing secret**

### Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Useful Commands:
```bash
npm install              # Install dependencies
node setup-stripe-products.js  # Create Stripe products
npx vercel dev          # Local development
npx vercel --prod       # Deploy to production
stripe listen           # Forward webhooks locally
```

---

## Next Steps After Setup

1. ✅ Test the complete flow locally
2. ✅ Deploy to Vercel
3. ✅ Set up production webhooks
4. ✅ Test on production with test keys
5. ✅ Switch to live keys when ready to launch
6. ✅ Test one real transaction (then refund it)
7. ✅ Launch! 🚀

---

## Support

- Stripe Documentation: https://stripe.com/docs
- Vercel Documentation: https://vercel.com/docs
- Stripe Test Cards: https://stripe.com/docs/testing

**Questions?** Check the Stripe Dashboard logs and Vercel function logs for detailed error messages.
