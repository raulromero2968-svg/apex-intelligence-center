# Apex Intelligence - Deployment Guide

## Quick Start Checklist

- [ ] Configure Stripe with production keys
- [ ] Set up hosting platform
- [ ] Test payment flow end-to-end
- [ ] Configure DNS (if using custom domain)
- [ ] Set up SSL certificate (usually automatic)
- [ ] Enable analytics (optional)

---

## 1. Stripe Configuration

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account verification (business details, bank account)
3. Navigate to the Stripe Dashboard

### Step 2: Create Products and Prices

In your Stripe Dashboard, create the following products:

#### Premium Plan
- **Product Name**: Apex Intelligence Premium
- **Description**: Unlimited access to insights, blog, and collector tools
- **Prices to create**:
  - **Monthly**: $9.99/month
    - Billing period: Monthly
    - Copy the Price ID (starts with `price_`)
  - **Yearly**: $99/year
    - Billing period: Yearly
    - Copy the Price ID (starts with `price_`)

#### Pro Plan
- **Product Name**: Apex Intelligence Pro
- **Description**: Full access including research articles, datasets, and priority support
- **Prices to create**:
  - **Monthly**: $29.99/month
    - Billing period: Monthly
    - Copy the Price ID (starts with `price_`)
  - **Yearly**: $299/year
    - Billing period: Yearly
    - Copy the Price ID (starts with `price_`)

### Step 3: Get Your Publishable Key

1. In Stripe Dashboard, go to **Developers** → **API Keys**
2. Find your **Publishable key**
   - For testing: starts with `pk_test_`
   - For production: starts with `pk_live_`
3. Copy this key

### Step 4: Update subscribe.html

Open `subscribe.html` and replace the placeholders:

**Line 495** - Replace the Stripe key:
```javascript
// BEFORE:
const stripe = Stripe('pk_test_51PLACEHOLDER_REPLACE_WITH_YOUR_STRIPE_KEY');

// AFTER (example with your actual key):
const stripe = Stripe('pk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
```

**Lines 498-503** - Replace the Price IDs:
```javascript
// BEFORE:
const STRIPE_PRICES = {
    premium_monthly: 'price_premium_monthly_placeholder',
    premium_yearly: 'price_premium_yearly_placeholder',
    pro_monthly: 'price_pro_monthly_placeholder',
    pro_yearly: 'price_pro_yearly_placeholder'
};

// AFTER (example with your actual price IDs):
const STRIPE_PRICES = {
    premium_monthly: 'price_1AbCdEfGhIjKlMnO',  // $9.99/month
    premium_yearly: 'price_2PqRsTuVwXyZ1234',   // $99/year
    pro_monthly: 'price_3AbCdEfGhIjKlMnO',      // $29.99/month
    pro_yearly: 'price_4PqRsTuVwXyZ1234'        // $299/year
};
```

### Step 5: Configure Success Page (Optional)

You may want to create a `success.html` page for post-checkout redirect. The URL is referenced on line 523:
```javascript
successUrl: window.location.origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
```

---

## 2. Hosting Platform Deployment

### Option A: GitHub Pages (Recommended for Static Sites)

#### Prerequisites
- GitHub repository with your code
- GitHub account with Pages enabled

#### Steps:
1. Push all your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure Stripe for production"
   git push origin main
   ```

2. Enable GitHub Pages:
   - Go to repository **Settings** → **Pages**
   - Source: Deploy from a branch
   - Branch: `main` (or your production branch)
   - Folder: `/` (root)
   - Click **Save**

3. Your site will be live at:
   - `https://YOUR_USERNAME.github.io/apex-intelligence-center/`
   - Or custom domain (see DNS configuration below)

4. **Important**: Update Stripe redirect URLs:
   - In `subscribe.html`, update domain in successUrl/cancelUrl if needed
   - In Stripe Dashboard, add your domain to allowed redirect URLs:
     - Go to **Settings** → **Checkout settings**
     - Add: `https://YOUR_USERNAME.github.io` to allowed domains

#### Custom Domain Setup:
1. In repository settings, add your custom domain (e.g., `apexintelligence.com`)
2. In your DNS provider, add these records:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153

   Type: A
   Name: @
   Value: 185.199.109.153

   Type: A
   Name: @
   Value: 185.199.110.153

   Type: A
   Name: @
   Value: 185.199.111.153

   Type: CNAME
   Name: www
   Value: YOUR_USERNAME.github.io
   ```
3. GitHub will automatically provision SSL certificate

---

### Option B: Netlify (Best for Continuous Deployment)

#### Prerequisites
- Netlify account (free tier available)
- GitHub repository

#### Steps:
1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub and select your repository
4. Build settings:
   - Build command: (leave empty for static site)
   - Publish directory: `/` (root)
5. Click **Deploy site**

6. Your site will be live at:
   - `https://random-name-12345.netlify.app`
   - You can customize the subdomain or add custom domain

#### Custom Domain Setup:
1. In Netlify, go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow DNS configuration instructions provided by Netlify
4. SSL certificate is automatically provisioned

#### Continuous Deployment:
- Every push to your repository automatically deploys
- Netlify provides branch deploys for testing

---

### Option C: Vercel (Alternative to Netlify)

#### Steps:
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Framework preset: Other (static site)
5. Click **Deploy**

Similar to Netlify, Vercel provides:
- Automatic SSL
- Custom domain support
- Continuous deployment
- Branch previews

---

## 3. Testing Payment Flow

### Test Mode Testing (Before Production)

1. Use Stripe test keys (`pk_test_...`)
2. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0027 6000 3184`
   - Use any future expiry date, any 3-digit CVC, any ZIP

3. Test the full flow:
   - Click "Subscribe Now" on Premium plan
   - Fill in test card details
   - Verify redirect to success page
   - Check Stripe Dashboard for test subscription

### Production Testing

1. Switch to live keys (`pk_live_...`)
2. Use a real card with small amount
3. Immediately cancel the test subscription in Stripe Dashboard
4. Verify:
   - Email receipt received
   - Subscription appears in Stripe Dashboard
   - Success page loads correctly

---

## 4. Post-Deployment Checklist

- [ ] Verify all links work (navigation, footer links)
- [ ] Test on mobile devices
- [ ] Check page load speed (use PageSpeed Insights)
- [ ] Verify SSL certificate is active (https://)
- [ ] Test all subscription buttons (Premium monthly, yearly, Pro monthly, yearly)
- [ ] Verify Stripe webhooks (if you add backend functionality later)
- [ ] Check browser console for JavaScript errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Verify analytics are tracking (if configured)
- [ ] Test newsletter signup (beehiiv integration)

---

## 5. Stripe Webhook Configuration (Future Enhancement)

When you're ready to add server-side functionality (user management, access control):

1. Set up webhook endpoint at your server
2. In Stripe Dashboard → **Developers** → **Webhooks**
3. Add endpoint URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

---

## 6. Security Best Practices

1. **Never expose secret keys**:
   - Publishable key (`pk_...`) is safe for client-side ✓
   - Secret key (`sk_...`) must NEVER be in client-side code ✗

2. **Use HTTPS**: Always serve your site over HTTPS (automatic with GitHub Pages, Netlify, Vercel)

3. **Stripe validation**: Payment processing happens on Stripe's servers (no sensitive data touches your site)

4. **Content Security Policy**: Consider adding CSP headers for additional security

---

## 7. Launch Marketing Checklist

After technical deployment:

- [ ] Announce on social media (Twitter, LinkedIn, Discord, Reddit)
- [ ] Email existing newsletter subscribers
- [ ] Post in relevant TCG communities
- [ ] Create launch discount code in Stripe (optional)
- [ ] Prepare launch blog post
- [ ] Update email signature with link
- [ ] Submit to product directories (Product Hunt, etc.)

---

## 8. Monitoring and Analytics

Consider adding:

- **Google Analytics**: Track visitor behavior
- **Stripe Dashboard**: Monitor subscriptions, MRR, churn
- **Uptime monitoring**: UptimeRobot or similar
- **Error tracking**: Sentry for JavaScript errors

---

## 9. Support Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Testing**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **GitHub Pages**: [docs.github.com/pages](https://docs.github.com/pages)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)

---

## Quick Commands Reference

```bash
# Commit Stripe configuration
git add subscribe.html
git commit -m "Configure Stripe with production keys"

# Push to GitHub (triggers auto-deploy on Netlify/Vercel)
git push origin main

# Check deployment status
git status

# View commit history
git log --oneline -5
```

---

## Emergency Rollback

If something goes wrong after deployment:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main  # Use with caution!
```

---

## Need Help?

If you encounter issues:
1. Check browser console for errors (F12 → Console)
2. Check Stripe Dashboard logs
3. Review hosting platform logs (Netlify/Vercel/GitHub Pages)
4. Test with Stripe test keys first
5. Verify all URLs and redirects are correct

---

**Status**: Ready for production deployment! 🚀

The platform is fully functional and ready to accept payments once you configure Stripe with your production keys.
