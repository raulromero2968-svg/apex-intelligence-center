# Apex Intelligence - Quick Deployment Checklist

## Pre-Deployment: Stripe Configuration

### 1. Create Stripe Account & Products (15 minutes)
- [ ] Sign up at [stripe.com](https://stripe.com)
- [ ] Complete business verification
- [ ] Create product: "Apex Intelligence Premium"
  - [ ] Add price: $9.99/month (copy price ID)
  - [ ] Add price: $99/year (copy price ID)
- [ ] Create product: "Apex Intelligence Pro"
  - [ ] Add price: $29.99/month (copy price ID)
  - [ ] Add price: $299/year (copy price ID)
- [ ] Copy publishable key from Developers → API Keys

### 2. Update subscribe.html (5 minutes)
- [ ] Open `subscribe.html` in editor
- [ ] Line 495: Replace `pk_test_51PLACEHOLDER...` with your Stripe publishable key
- [ ] Line 499: Replace `price_premium_monthly_placeholder` with actual price ID
- [ ] Line 500: Replace `price_premium_yearly_placeholder` with actual price ID
- [ ] Line 501: Replace `price_pro_monthly_placeholder` with actual price ID
- [ ] Line 502: Replace `price_pro_yearly_placeholder` with actual price ID
- [ ] Save file

### 3. Test Payment Flow (10 minutes)
- [ ] Use test keys first (`pk_test_...`)
- [ ] Open `subscribe.html` in browser
- [ ] Click "Subscribe Now" on Premium plan
- [ ] Use test card: `4242 4242 4242 4242`
  - Expiry: any future date
  - CVC: any 3 digits
  - ZIP: any 5 digits
- [ ] Verify redirect to success page
- [ ] Check Stripe Dashboard for test subscription
- [ ] Cancel test subscription

---

## Deployment Option A: GitHub Pages (Fastest)

### Setup (10 minutes)
- [ ] Commit Stripe configuration:
  ```bash
  git add subscribe.html success.html DEPLOYMENT_GUIDE.md
  git commit -m "Configure Stripe for production deployment"
  git push origin main
  ```
- [ ] Go to GitHub repository → Settings → Pages
- [ ] Source: Deploy from branch `main`, folder `/`
- [ ] Click Save
- [ ] Wait 2-3 minutes for deployment
- [ ] Visit: `https://YOUR_USERNAME.github.io/apex-intelligence-center/`

### Post-Deployment
- [ ] Test live site loads correctly
- [ ] Click through all navigation links
- [ ] Test subscription flow with test keys
- [ ] Switch to production Stripe keys (`pk_live_...`)
- [ ] Update subscribe.html with live keys
- [ ] Commit and push again
- [ ] Test ONE real payment (then cancel immediately)

---

## Deployment Option B: Netlify (Recommended)

### Setup (15 minutes)
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "Configure Stripe for production deployment"
  git push origin main
  ```
- [ ] Sign up at [netlify.com](https://netlify.com)
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Connect GitHub account
- [ ] Select `apex-intelligence-center` repository
- [ ] Build settings:
  - Build command: (leave empty)
  - Publish directory: `/`
- [ ] Click "Deploy site"
- [ ] Wait 1-2 minutes
- [ ] Site live at: `https://random-name-12345.netlify.app`

### Custom Domain (Optional, 10 minutes)
- [ ] In Netlify: Site settings → Domain management
- [ ] Click "Add custom domain"
- [ ] Enter your domain (e.g., `apexintelligence.com`)
- [ ] Configure DNS as instructed by Netlify
- [ ] Wait for SSL certificate (automatic)

### Post-Deployment
- [ ] Test live site
- [ ] Verify all pages load
- [ ] Test subscription flow
- [ ] Check mobile responsiveness

---

## Deployment Option C: Vercel (Alternative)

### Setup (15 minutes)
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "Configure Stripe for production deployment"
  git push origin main
  ```
- [ ] Sign up at [vercel.com](https://vercel.com)
- [ ] Click "Add New" → "Project"
- [ ] Import GitHub repository
- [ ] Framework: Other (static)
- [ ] Click "Deploy"
- [ ] Wait 1-2 minutes
- [ ] Site live at: `https://apex-intelligence-center.vercel.app`

---

## Post-Deployment Testing (20 minutes)

### Technical Tests
- [ ] All pages load without errors (check browser console F12)
- [ ] HTTPS is active (green padlock in browser)
- [ ] All navigation links work
- [ ] Images load correctly
- [ ] Newsletter signup works (beehiiv)
- [ ] Subscription buttons respond
- [ ] Success page loads after checkout
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile device

### Payment Flow Tests
- [ ] Click "Subscribe Now" on Premium monthly
- [ ] Complete payment with real card
- [ ] Verify email receipt from Stripe
- [ ] Check success page displays correctly
- [ ] Verify subscription in Stripe Dashboard
- [ ] Cancel test subscription in Stripe Dashboard

### Content Tests
- [ ] Homepage displays correctly
- [ ] Article pages load (insights, blog, research)
- [ ] Tools pages load (portfolio tracker, trade calculator, etc.)
- [ ] About page displays correctly
- [ ] Footer links work (privacy, terms)

---

## Go-Live Checklist

### Before Launch
- [ ] All tests pass
- [ ] Production Stripe keys configured
- [ ] Real payment test completed successfully
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics configured (optional)

### Launch Day
- [ ] Announce on Twitter/X
- [ ] Post on LinkedIn
- [ ] Email newsletter subscribers
- [ ] Share in TCG communities (Reddit, Discord)
- [ ] Update social media bios with link
- [ ] Submit to Product Hunt (optional)

### Week 1 Monitoring
- [ ] Check Stripe Dashboard daily
- [ ] Monitor for error reports
- [ ] Respond to customer emails
- [ ] Track conversion rates
- [ ] Gather user feedback

---

## Quick Commands

```bash
# Commit Stripe configuration
git add subscribe.html
git commit -m "Add Stripe production keys"
git push origin main

# Check deployment status
git status

# View recent commits
git log --oneline -5

# Emergency rollback (if needed)
git revert HEAD
git push origin main
```

---

## Stripe Configuration Reference

**File to edit**: `subscribe.html`

**Line 495**: Publishable key
```javascript
const stripe = Stripe('pk_live_YOUR_ACTUAL_KEY_HERE');
```

**Lines 498-503**: Price IDs
```javascript
const STRIPE_PRICES = {
    premium_monthly: 'price_YOUR_ACTUAL_ID',
    premium_yearly: 'price_YOUR_ACTUAL_ID',
    pro_monthly: 'price_YOUR_ACTUAL_ID',
    pro_yearly: 'price_YOUR_ACTUAL_ID'
};
```

---

## Support Resources

- **Full Guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **GitHub Pages**: [docs.github.com/pages](https://docs.github.com/pages)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)

---

## Estimated Time to Deploy

- **Stripe Setup**: 15-20 minutes
- **Code Configuration**: 5 minutes
- **Hosting Setup**: 10-15 minutes
- **Testing**: 20-30 minutes
- **Total**: ~60-90 minutes

---

**You're ready to deploy!** 🚀

The platform is production-ready. Just follow the checklist above, and you'll be live in about an hour.

Good luck with your launch!
