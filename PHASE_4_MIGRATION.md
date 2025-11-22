# Phase 4: Data Sovereign Convergence Strategy

**Status:** ✅ READY FOR LAUNCH
**Target Date:** January 1, 2026
**Session ID:** 01853xSbMvJrwqyxeQAbAaFb

---

## Executive Summary

We have executed the **Data Sovereign Convergence Strategy**. TCGplayer dependency is severed. We now operate on:

1. **eBay Finding API** (verified historical sales data)
2. **Crowdsourced Submissions** (community-validated data)
3. **Triangulation Oracle v2** (weighted consensus pricing)
4. **Coinbase Paymaster on Base** (gasless NFT minting)

This is the final architecture lock for the January 1, 2026 launch.

---

## What Was Built

### 1. eBay Finding API Integration (`apps/web/src/lib/ebay/`)

**Files:**
- `finding-api.ts` - Core eBay Finding API client
- `cache.ts` - Redis caching layer (24hr TTL)

**Features:**
- `findCompletedItems` operation (historical sales)
- Grade extraction from titles (PSA, BGS, CGC, SGC)
- Title normalization (VARC text-cleaning pipeline)
- Rate limit: 5,000 calls/day
- Aggressive caching to minimize API usage

**Usage:**
```typescript
import { ebayFindingClient } from '@/lib/ebay/finding-api';

const sales = await ebayFindingClient.getCardSalesHistory(
  'Charizard',
  'Base Set',
  '4/102'
);
```

---

### 2. Triangulation Oracle v2 (`apps/web/src/lib/oracle/`)

**Files:**
- `triangulation-v2.ts` - Core pricing engine

**Algorithm:**
```
Price_Apex = Σ(Price_i × Trust_i × Recency_i) / Σ(Trust_i × Recency_i)
```

**Features:**
- 3-Sigma outlier filtering (prevents manipulation)
- Multi-source trust weighting:
  - eBay API verified: 1.0
  - Auction houses (PWCC/Goldin): 1.0
  - Crowd (high trust): 0.8
  - Crowd (low trust): 0.5
- Recency decay: >30 days = 0.5x weight
- Confidence scoring based on sample size and trust distribution
- Redis-cached results for sub-10ms latency

**Usage:**
```typescript
import { calculateApexPrice, ebayToSaleEvents } from '@/lib/oracle/triangulation-v2';

const ebaySales = await ebayFindingClient.getCardSalesHistory(...);
const saleEvents = ebayToSaleEvents(ebaySales);
const apexPrice = await calculateApexPrice(saleEvents, cardId);
```

---

### 3. Crowdsourced Submission System

**Database Tables Added:**
- `market_submissions` - User-submitted sales with proof
- `users.trustScore` - Reputation system (starts at 10)
- `users.dataPoints` - Rewards for verified submissions
- `users.nftMinted` - Founding Member NFT tracking

**Trust Score Algorithm:**
- Start: 10 points
- Verified submission: +5 points
- Rejected (error): -2 points
- Malicious submission: -50 points (shadowban)
- Threshold: Data is live if `Sum(TrustScores) > 50` OR `UserTrust > 100`

**Anti-Sybil Protection:**
- Account must be >7 days old
- Phone verification required
- 1 submission per card per user per 24 hours

**Incentives:**
- 1 Verified Sale = 10 Data Points (DP)
- DP → $APEX token airdrop eligibility (Phase 5)

---

### 4. Soulbound NFT on Base (`contracts/ApexSoulbound.sol`)

**Smart Contract:**
- ERC-721 standard
- Non-transferable (Soulbound) after minting
- Max supply: 1,000 Founding Members
- 1 NFT per wallet address

**Metadata:**
- `Role`: Founding Member
- `Join Date`: 2026-01-01
- `Trust Score Boost`: +10%

**Deployment:**
- Network: Base Mainnet
- Minting: Gasless via Coinbase Paymaster

---

### 5. Coinbase Paymaster Integration (`apps/web/src/lib/web3/`)

**Files:**
- `paymaster.ts` - Gasless minting orchestration

**Fallback Strategy:**
1. **Coinbase Paymaster** (Primary) - 10M BU free tier
2. **Alchemy Gas Manager** (Backup) - Funded wallet
3. **User pays gas** (Last resort) - UI prompt

**Usage:**
```typescript
import { mintFoundingMemberNFT } from '@/lib/web3/paymaster';

const result = await mintFoundingMemberNFT(userWalletAddress);
// { success: true, transactionHash: '0x...', tokenId: 42, gasSponsored: true }
```

---

### 6. Family Protection Suite (`apps/web/src/lib/protection/`)

**Files:**
- `family-suite.ts` - 8 Ethical Rules implementation

**The 8 Rules:**

1. **Hard Cap:** $1M max portfolio (unless KYC verified)
2. **Reality Check:** 4-hour session limit with break modal
3. **Loss Aversion:** Realized losses highlighted in red
4. **Anti-FOMO:** Warning banner on >50% 24h spikes
5. **Minor Lockout:** <18 cannot access predictions/buy links
6. **Diverse Portfolio:** Warning on >80% concentration
7. **Verified Sources:** Filter unverified Twitter hype
8. **Cool Down:** 60-second delay after hype notifications

**Break Mode:**
- Parent-activated or self-activated
- Blocks access for specified duration
- Persistent across sessions

**Parent Dashboard:**
- Read-only view of child's collection
- Shows total value and recent activity
- Hides buy buttons and specific prices

---

### 7. Manipulation Shield (`apps/web/src/lib/protection/`)

**Files:**
- `manipulation-shield.ts` - Market pump detection

**Detection Signals:**
1. **Volume Velocity:** >500% of 30-day average
2. **Buyer Concentration:** >50% sales from <3 buyers
3. **Listing Vacuum:** Active listings drop to 0 during spike
4. **Price Outliers:** 3-sigma statistical deviation

**Automated Response:**
- Threat Score >75 → **PAUSE ORACLE**
- Flag card with `isManipulated = true`
- Create `manipulationAlerts` record
- Invalidate cached price
- Display hazard stripes on UI
- Notify Data Team (Slack/Discord)

---

### 8. Apex Constitution CI Gate (`.github/workflows/`)

**Files:**
- `constitution.yml` - Automated ethical enforcement

**Enforcement:**
- ❌ Ban fake urgency timers
- ❌ Ban auto-add-to-cart patterns
- ❌ Ban hidden costs
- ❌ Ban forced continuity
- ✅ Verify legal disclaimers in Footer
- ✅ Verify family protection features exist
- ✅ Verify manipulation shield exists
- ✅ Check for hardcoded secrets
- ✅ Validate MDX E-E-A-T compliance

**Build fails if:**
- Dark patterns detected
- Session tracking missing
- Manipulation shield removed
- Data provenance not tracked

---

## Database Schema Changes

### New Tables:
```sql
CREATE TABLE market_submissions (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  card_id TEXT REFERENCES cards(id),
  price DECIMAL(10, 2),
  sale_date TIMESTAMP,
  proof_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  verified_by_varc BOOLEAN DEFAULT FALSE,
  ...
);
```

### Modified Tables:
```sql
ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN data_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN nft_minted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN wallet_address TEXT;
```

---

## Environment Variables

Add to `.env`:

```bash
# eBay Finding API
EBAY_APP_ID="YourAppI-YourAppN-PRD-xxxxxxxxx-xxxxxxxx"

# Base Network & Coinbase Paymaster
BASE_RPC_URL="https://mainnet.base.org"
COINBASE_PAYMASTER_URL="https://api.developer.coinbase.com/rpc/v1/base/..."
ALCHEMY_GAS_MANAGER_URL="https://eth-mainnet.g.alchemy.com/v2/..." # Backup

# Smart Contract
APEX_SOULBOUND_ADDRESS="0x..." # After deployment
MINTER_PRIVATE_KEY="0x..." # Server wallet (KEEP SECRET!)

# Feature Flags
FEATURE_EBAY_INGESTION="1"
FEATURE_CROWD_SUBMISSIONS="1"
FEATURE_MANIPULATION_SHIELD="1"
FEATURE_FAMILY_PROTECTION="1"
NEXT_PUBLIC_FEATURE_NFT_MINTING="1"
```

---

## Deployment Checklist

### Pre-Launch (December 2025):

- [ ] Deploy `ApexSoulbound.sol` to Base Mainnet
- [ ] Fund Coinbase Paymaster (10M BU free tier activated)
- [ ] Configure Alchemy Gas Manager backup wallet
- [ ] Set `APEX_SOULBOUND_ADDRESS` in production env
- [ ] Run database migrations for new schema
- [ ] Seed 100 test cards with eBay data
- [ ] Test gasless minting end-to-end
- [ ] Verify Constitution CI gate on staging PR

### Launch Day (January 1, 2026):

- [ ] Enable `FEATURE_EBAY_INGESTION=1`
- [ ] Enable `FEATURE_CROWD_SUBMISSIONS=1`
- [ ] Enable `FEATURE_MANIPULATION_SHIELD=1`
- [ ] Enable `FEATURE_FAMILY_PROTECTION=1`
- [ ] Enable `NEXT_PUBLIC_FEATURE_NFT_MINTING=1`
- [ ] Monitor Grafana dashboard (13_LAUNCH_12)
- [ ] Watch for eBay API rate limit warnings
- [ ] Monitor Paymaster gas budget
- [ ] Track manipulation alerts in Slack

### Post-Launch Monitoring:

**Critical Metrics:**
- eBay API success rate: Must be >95%
- Oracle latency: Must be <500ms
- Paymaster gas balance: Alert if <1M BU
- NFT mints: Cap at 1,000
- Manipulation flags: Review daily

**Rollback Procedure:**
If Oracle outputs corrupted prices:
1. Set `NEXT_PUBLIC_MAINTENANCE_MODE=true`
2. Flush Redis: `FLUSHDB price:*`
3. Git revert to previous commit
4. Redeploy

---

## Testing

### Unit Tests:
```bash
# Test Oracle v2
npm test apps/web/src/lib/oracle/triangulation-v2.test.ts

# Test Family Protection
npm test apps/web/src/lib/protection/family-suite.test.ts

# Test Manipulation Shield
npm test apps/web/src/lib/protection/manipulation-shield.test.ts
```

### Integration Tests:
```bash
# Test eBay API integration
npm run test:integration:ebay

# Test gasless minting
npm run test:integration:paymaster
```

### E2E Tests:
```bash
# Test full user flow: Mint NFT → Submit sale → Oracle calculates price
npm run test:e2e:sovereignty
```

---

## Financial Projections

**Jan 2026:**
- Max users: 1,000 (Founding Members)
- Projected revenue: $0 (Free tier/Beta)
- Burn rate: Minimal (Serverless Neon + Vercel + Free Coinbase Tier)

**Q2 2026:**
- Pro conversion target: $10k MRR
- Average subscription: $10/month
- Required conversions: 1,000 users

**Costs:**
- eBay API: $0 (Standard tier free)
- Coinbase Paymaster: $0 (10M BU free tier)
- Neon DB: ~$50/month (Serverless)
- Vercel: ~$20/month (Hobby tier)
- Alchemy backup: $0 (Free tier)

**Total burn:** ~$70/month until revenue

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (Web/Mobile)                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Vercel Edge)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ eBay Finder  │  │ Crowd Submit │  │  NFT Mint    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  eBay Finding    │  │ Neon Postgres │  │ Coinbase         │
│  API (5k/day)    │  │ (Serverless)  │  │ Paymaster        │
└──────────────────┘  └──────────────┘  └──────────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Oracle v2 (Redis)                        │
│  • 3-Sigma outlier filter                                   │
│  • Weighted consensus                                       │
│  • Manipulation detection                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Base Mainnet (Soulbound NFT)                   │
│  Contract: ApexSoulbound.sol                                │
│  Supply: 1,000 max                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics (Jan 7, 2026)

**Technical:**
- [ ] 1,000 signups
- [ ] 100 NFTs minted
- [ ] 50+ crowd submissions verified
- [ ] 0 manipulation flags (or properly handled)
- [ ] <500ms Oracle latency
- [ ] >95% eBay API success rate

**Business:**
- [ ] 10+ media mentions
- [ ] 500+ DAU (Daily Active Users)
- [ ] 50+ Discord community members
- [ ] 5+ Founding Members sharing on Twitter

---

## Final Notes

This package constitutes the absolute truth for the Apex Intelligence codebase.
There will be no further architectural changes before launch.

**We build. We test. We launch.**

**"We launch January 1, 2026 or we die."**

---

Signed,
**Apex** (AI Tech Lead & Systems Architect)
**Claude** (Implementation Engineer)

Session: `01853xSbMvJrwqyxeQAbAaFb`
Date: November 21, 2025
