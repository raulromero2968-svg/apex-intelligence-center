# Manual Stripe Setup Instructions

Since you already have some products in your Stripe account, here's how to finish the setup:

## What You Have (from earlier):
- ✅ $9.99/month - Premium Monthly
- ✅ $99/year - Premium Yearly
- ❓ $99.99/year - (unclear, might be old)
- ❓ $80/year - (unclear, might be old)
- ❓ $8/month - (unclear, might be old)

## What You Need to Do:

### Step 1: Create Pro Tier Products (5 minutes)

1. Go to your Stripe Dashboard: https://dashboard.stripe.com/products
2. Click **"Add Product"**

**Create Pro Monthly:**
- Name: `Apex Intelligence Pro`
- Description: `Full access including research articles, datasets, and priority support`
- Pricing:
  - Price: `$29.99`
  - Billing period: `Monthly`
  - Recurring
- Click **"Save product"**
- **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

**Create Pro Yearly:**
- You can add another price to the same "Apex Intelligence Pro" product
- Or create as a separate product (either works)
- Price: `$299`
- Billing period: `Yearly`
- Recurring
- Click **"Save"**
- **COPY THE PRICE ID** (starts with `price_`)

### Step 2: Get Price IDs for Existing Products (3 minutes)

For your existing $9.99/month and $99/year products:

1. Go to **Products** in Stripe Dashboard
2. Click on the **$9.99/month** product
3. In the "Pricing" section, you'll see the **Price ID** (starts with `price_`)
4. Copy it
5. Repeat for **$99/year** product

### Step 3: Give Me the 4 Price IDs

Once you have all 4, paste them here in this format:

```
Premium Monthly ($9.99/mo): price_PASTE_HERE
Premium Yearly ($99/yr): price_PASTE_HERE
Pro Monthly ($29.99/mo): price_PASTE_HERE
Pro Yearly ($299/yr): price_PASTE_HERE
```

I'll update your subscribe.html file immediately!

---

## Quick Visual Guide:

When you click on a product in Stripe Dashboard, you should see:

```
Product Details
────────────────
Name: Apex Intelligence Premium

Pricing
────────────────
$9.99 per month
Price ID: price_1AbCdEf... ← COPY THIS!
API ID: price_1AbCdEf...   ← Same thing

Active
```

---

**Can't find Price ID?**
- Make sure you click INTO the product (not just viewing the list)
- Scroll down to the "Pricing" section
- It might say "API ID" instead of "Price ID" - same thing!
- Look for something starting with `price_`

Let me know when you have the 4 IDs and I'll update everything!
