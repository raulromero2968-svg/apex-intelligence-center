# Quick Start - Stripe Integration

## 🚀 Get Running in 15 Minutes

### 1. Install Dependencies (2 min)
```bash
npm install
```

### 2. Create Stripe Products (3 min)
```bash
# Get your test secret key from Stripe Dashboard (toggle to Test mode)
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY

# Run the setup script
node setup-stripe-products.js
```

Copy the 4 price IDs that are output.

### 3. Update Configuration (5 min)

**Update `.env` file:**
```bash
# Paste your price IDs here
STRIPE_PRICE_PREMIUM_MONTHLY=price_PASTE_HERE
STRIPE_PRICE_PREMIUM_YEARLY=price_PASTE_HERE
STRIPE_PRICE_PRO_MONTHLY=price_PASTE_HERE
STRIPE_PRICE_PRO_YEARLY=price_PASTE_HERE
```

**Update `subscribe.html` (lines 497-502):**
```javascript
const STRIPE_PRICES = {
    premium_monthly: 'price_PASTE_HERE',
    premium_yearly: 'price_PASTE_HERE',
    pro_monthly: 'price_PASTE_HERE',
    pro_yearly: 'price_PASTE_HERE'
};
```

### 4. Test Locally (5 min)

**Terminal 1 - Webhooks:**
```bash
stripe listen --forward-to http://localhost:3000/api/webhook
# Copy the webhook secret and add to .env:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**Terminal 2 - Dev Server:**
```bash
npx vercel dev
# Open: http://localhost:3000/subscribe.html
```

**Test with card:** `4242 4242 4242 4242` (any future date, any CVC)

### 5. Deploy to Vercel (5 min)

```bash
npx vercel login
npx vercel --prod
```

**Then add environment variables in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from your `.env` file

### 6. Enable Stripe Features (2 min)

**Customer Portal:**
- Stripe Dashboard → Settings → Billing → Customer Portal
- Click "Activate"

**Production Webhooks:**
- Stripe Dashboard → Developers → Webhooks → Add Endpoint
- URL: `https://YOUR_DOMAIN.vercel.app/api/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- Copy webhook secret to Vercel environment variables

---

## ✅ Done!

Your site is now live with Stripe payments!

Test it:
1. Visit your site
2. Click "Subscribe Now"
3. Use test card: `4242 4242 4242 4242`
4. Should redirect to success page
5. Click "Manage Subscription" to access Customer Portal

---

## 📚 Need More Details?

See `STRIPE_SETUP_GUIDE.md` for complete documentation.

## ⚠️ Before Going Live

Switch from test keys (`pk_test_`, `sk_test_`) to live keys (`pk_live_`, `sk_live_`) in:
- Vercel environment variables
- Run `setup-stripe-products.js` again with live key to create live products
- Update price IDs in `subscribe.html`
