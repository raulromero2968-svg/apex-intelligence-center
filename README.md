# Apex Intelligence - TCG Market Intelligence Platform

Premium trading card game market intelligence, research, and collector tools.

## 🚀 Features

- **Market Intelligence**: Real-time insights on TCG market trends
- **Research Articles**: In-depth analysis and data-driven research
- **Collector Tools**: Portfolio tracker, trade calculator, grading ROI calculator
- **Subscription System**: Free, Premium ($9.99/mo), and Pro ($29.99/mo) tiers
- **Stripe Payments**: Fully integrated subscription billing

## 📦 What's Included

- Static HTML/CSS/JS frontend
- Vercel serverless functions for backend
- Stripe Checkout integration
- Stripe Customer Portal for subscription management
- Webhook handling for subscription events
- Account management page

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Payments**: Stripe
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 15 minutes
- **[STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)** - Complete Stripe integration guide
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment options and instructions
- **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Pre-launch checklist

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Stripe account
- Vercel account (free tier works)
- GitHub account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/apex-intelligence-center.git
cd apex-intelligence-center

# Install dependencies
npm install

# Set up Stripe products
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY
node setup-stripe-products.js

# Update .env and subscribe.html with price IDs (see QUICK_START.md)

# Test locally
npx vercel dev
```

### Deploy to Vercel

```bash
npx vercel login
npx vercel --prod
```

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

## 📁 Project Structure

```
apex-intelligence-center/
├── api/                          # Vercel serverless functions
│   ├── create-checkout-session.js  # Create Stripe checkout
│   ├── create-portal-session.js    # Customer portal access
│   └── webhook.js                  # Stripe webhook handler
├── *.html                        # Frontend pages
│   ├── index.html                  # Homepage
│   ├── subscribe.html              # Subscription plans
│   ├── success.html                # Post-checkout success
│   ├── account.html                # Account management
│   ├── insights.html               # Insights articles
│   ├── blog.html                   # Blog posts
│   ├── research.html               # Research articles
│   └── [tools].html                # Collector tools
├── setup-stripe-products.js      # Stripe product creation script
├── package.json                  # Node.js dependencies
├── vercel.json                   # Vercel configuration
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment variables template
└── .gitignore                    # Git ignore rules
```

## 🔑 Environment Variables

Required environment variables (set in Vercel and `.env`):

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
SITE_URL=https://your-domain.com
```

## 🧪 Testing

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Local Testing

```bash
# Terminal 1: Webhook forwarding
stripe listen --forward-to http://localhost:3000/api/webhook

# Terminal 2: Development server
npx vercel dev
```

Visit `http://localhost:3000` and test the subscription flow.

## 💳 Subscription Tiers

### Free Tier
- 6 articles per month
- Basic market insights
- Newsletter access
- **Price**: Free

### Premium Tier
- Unlimited insights & blog access
- Collector tools (Portfolio Tracker, Trade Calculator)
- Weekly market reports
- Ad-free experience
- **Price**: $9.99/month or $99/year (17% savings)

### Pro Tier
- Everything in Premium
- Full research articles with raw data
- Advanced tools (Grading ROI, Sealed Product Analyzer)
- Custom market analysis
- Priority support
- **Price**: $29.99/month or $299/year (17% savings)

## 🔐 Security

- All sensitive keys stored in environment variables
- Webhook signatures verified
- HTTPS enforced on production
- Stripe handles all payment processing (PCI compliant)
- No credit card data touches your servers

## 📞 Support

- Email: support@apexintelligence.com
- Newsletter: https://apexintelligence.beehiiv.com
- Documentation: See `/docs` in this repository

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [Stripe](https://stripe.com) - Payment processing
- [Vercel](https://vercel.com) - Hosting and serverless functions
- Modern web technologies

---

**Ready to launch?** Follow the [QUICK_START.md](QUICK_START.md) guide!

## Deployment Cache Purge

Triggered: Mon Nov 17 00:58:05 EST 2025
