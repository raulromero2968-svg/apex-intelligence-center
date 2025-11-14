# Black Friday Phase 1 Action Plan
## Apex Intelligence - Tool Development Roadmap

**Launch Date:** November 29, 2025 (15 days remaining)
**Branch:** claude/tcg-apex-intelligence-research-01RjmCJE2Aw4tWMkM7JZjF2v

---

## CURRENT STATUS

### ✅ Completed Tools (Ready for Launch)
1. **Grading ROI Calculator** (/tool-grading.html) - PREMIUM
2. **Sealed Product Analyzer** (/tool-sealed.html) - PRO

### ⏳ Tools Requiring Work
1. **Set Completion Calculator** - BUILD FROM SCRATCH
2. **Cross-Market Arbitrage Finder** - BUILD FROM SCRATCH
3. **Trade Fairness Evaluator** - UPGRADE EXISTING

---

## PRIORITY 1: SET COMPLETION CALCULATOR

### Overview
**Purpose:** Help collectors calculate the cheapest path to complete TCG sets
**Tier:** FREE (unlimited use - drives signups)
**File:** /tool-set-completion.html
**Est. Time:** 3-5 days

### Features

#### Core Functionality
- [x] Set selection dropdown (Pokemon, MTG, Yu-Gi-Oh!, One Piece)
- [x] Subset selection (specific expansion)
- [x] Card checklist (mark owned cards)
- [x] Missing card identification
- [x] Total completion cost (current market prices)
- [x] Singles vs Packs comparison
- [x] Cheapest path recommendation

#### Advanced Features (Phase 2)
- [ ] "Smart completion" - prioritize cheap cards first
- [ ] Price alerts when missing cards drop in price
- [ ] Multi-set completion optimizer
- [ ] Bulk deal integration ("Should I buy this lot?")

### Technical Requirements

#### Data Needs
**Set Databases** (JSON format):
```json
{
  "set_id": "pokemon_evolving_skies",
  "set_name": "Pokemon - Evolving Skies",
  "release_date": "2021-08-27",
  "total_cards": 237,
  "cards": [
    {
      "number": "1",
      "name": "Oddish",
      "rarity": "Common",
      "type": "Grass",
      "market_price": 0.10
    },
    {
      "number": "203",
      "name": "Umbreon VMAX (Secret)",
      "rarity": "Secret Rare",
      "type": "Darkness",
      "market_price": 285.00
    }
  ]
}
```

**Data Sources:**
- Pokemon: https://pokemontcg.io/ (Free API)
- MTG: https://api.scryfall.com/ (Free API)
- Yu-Gi-Oh!: https://db.ygoprodeck.com/api/ (Free API)
- One Piece: Manual database (no official API yet)

#### Price Data
**Option 1 (Static - MVP):**
- Hardcode approximate prices in set database
- Update monthly via script

**Option 2 (Dynamic - Phase 2):**
- Real-time API calls to TCGplayer
- Cache for 24 hours to reduce API costs

**Recommendation:** Start with Option 1 (static prices) for Black Friday launch

#### Pack EV Calculator
**Formula:**
```javascript
function calculatePackEV(set) {
  const totalValue = set.cards.reduce((sum, card) => {
    return sum + (card.market_price * card.pull_rate);
  }, 0);
  return totalValue;
}
```

**Pull Rates by Rarity:**
- Common: 1 in 1 pack
- Uncommon: 1 in 3 packs
- Rare: 1 in 6 packs
- Holo Rare: 1 in 12 packs
- Ultra Rare: 1 in 24 packs
- Secret Rare: 1 in 72 packs

### UI/UX Design

#### Layout
```
+------------------------------------------+
|  🎯 Set Completion Calculator            |
+------------------------------------------+
|  Select TCG: [Pokemon ▼]                 |
|  Select Set: [Evolving Skies ▼]         |
+------------------------------------------+
|  Your Collection (12 / 237 cards)        |
|  [✓] 001 Oddish          $0.10           |
|  [ ] 002 Gloom           $0.15           |
|  [ ] 003 Vileplume       $0.50           |
|  ...                                     |
+------------------------------------------+
|  Missing Cards: 225                      |
|  Total Cost: $1,245.50                   |
|                                          |
|  💡 Recommendation:                      |
|  Buy singles - Expected cost: $1,245.50  |
|  Opening packs - Expected cost: $2,850   |
|                                          |
|  ✅ Singles are 56% cheaper!             |
+------------------------------------------+
```

#### Features
- Collapsible card list (paginated - 20 cards per page)
- Search/filter cards by name, number, rarity
- "Mark all Commons/Uncommons" bulk action
- Export missing cards list (CSV)
- Save progress (localStorage)

### Implementation Plan

#### Day 1: Data Collection
- [ ] Download Pokemon set data from pokemontcg.io API
- [ ] Download MTG set data from Scryfall API
- [ ] Create JSON database files (/data/sets/pokemon/, /data/sets/mtg/)
- [ ] Add approximate market prices (scrape TCGplayer or use API)

#### Day 2: Core HTML/CSS
- [ ] Create tool-set-completion.html
- [ ] Build set selection UI
- [ ] Build card checklist UI
- [ ] Add navigation/header (copy from existing tools)

#### Day 3: JavaScript Functionality
- [ ] Load set data from JSON
- [ ] Implement card selection (checkboxes)
- [ ] Calculate missing cards total cost
- [ ] Calculate pack opening expected value
- [ ] Generate recommendation

#### Day 4: Polish & Testing
- [ ] Add search/filter functionality
- [ ] Implement localStorage (save progress)
- [ ] Add CSV export
- [ ] Test with multiple sets
- [ ] Mobile responsiveness

#### Day 5: Integration
- [ ] Add to tools.html landing page
- [ ] Update navigation on all pages
- [ ] Test user flow (home → tools → set completion)
- [ ] Final QA

### Success Metrics
- **Goal:** Most-used free tool (drive signups)
- **Target:** 60%+ of visitors try this tool
- **Conversion:** 10% of users subscribe to Premium after using

---

## PRIORITY 2: CROSS-MARKET ARBITRAGE FINDER

### Overview
**Purpose:** Find profitable price differences between US/JP/EU markets
**Tier:** PREMIUM ($9.99/mo)
**File:** /tool-arbitrage.html
**Est. Time:** 5-7 days

### Features

#### Core Functionality
- [x] Card search (by name)
- [x] Multi-market price comparison (US, Japan, Europe)
- [x] Shipping cost estimator
- [x] Fee calculator (PayPal, marketplace fees)
- [x] Currency conversion (real-time rates)
- [x] Profit calculator (after all costs)
- [x] Arbitrage opportunity score (A-F grade)

#### Advanced Features (Phase 2)
- [ ] Real-time alerts (email/SMS when arbitrage opportunity appears)
- [ ] Historical arbitrage tracking (best opportunities over time)
- [ ] Bulk opportunity scanner (scan top 100 cards)
- [ ] Recommended buy/sell platform

### Technical Requirements

#### Multi-Market Price APIs

**US Market:**
- TCGplayer API (requires account + API key)
- eBay API (completed listings)

**Japan Market:**
- Yahoo Japan Auctions (web scraping - no official API)
- magi.camp (Japanese price aggregator)
- Buyee proxy service prices

**Europe Market:**
- Cardmarket API (requires account)
- eBay UK/DE (completed listings)

**Currency Conversion:**
- Free API: https://exchangerate-api.com/ (1,500 requests/mo free)

#### Shipping Cost Estimator

**Formulas by Route:**
```javascript
const SHIPPING_COSTS = {
  us_to_us: (weight) => weight < 3 ? 5 : 10, // USPS First Class
  japan_to_us: (weight) => weight < 3 ? 15 : 30, // Japan Post Small Packet
  europe_to_us: (weight) => weight < 3 ? 12 : 25, // EU Post
  us_to_japan: (weight) => weight < 3 ? 18 : 35,
  us_to_europe: (weight) => weight < 3 ? 15 : 30,
};
```

#### Fee Calculator

**Marketplace Fees:**
- TCGplayer: 10.25% + $0.30 per sale
- eBay: 12.9% + $0.30 per sale (trading cards category)
- Cardmarket: 5% seller fee
- PayPal: 2.9% + $0.30 (international)

### UI/UX Design

#### Layout
```
+------------------------------------------+
|  🌍 Cross-Market Arbitrage Finder        |
+------------------------------------------+
|  Search Card: [Charizard Base Set___]🔍  |
+------------------------------------------+
|  💵 Price Comparison                     |
|                                          |
|  🇺🇸 United States (TCGplayer)           |
|     PSA 10: $8,500                       |
|                                          |
|  🇯🇵 Japan (Yahoo Auctions)              |
|     PSA 10: ¥980,000 → $6,450 USD        |
|                                          |
|  🇪🇺 Europe (Cardmarket)                 |
|     PSA 10: €7,200 → $7,650 USD          |
+------------------------------------------+
|  📊 Arbitrage Analysis                   |
|                                          |
|  🔥 Best Opportunity:                    |
|  Buy in Japan: $6,450                    |
|  + Shipping (JP→US): $30                 |
|  + PayPal fee (intl): $190               |
|  + Import tax (est): $0                  |
|  ----------------------                  |
|  Total Cost: $6,670                      |
|                                          |
|  Sell in US: $8,500                      |
|  - eBay fee (12.9%): $1,096              |
|  - PayPal fee: $246                      |
|  ----------------------                  |
|  Net Profit: $488                        |
|                                          |
|  📈 ROI: 7.3%                            |
|  ⭐ Grade: B+ (Good opportunity)         |
+------------------------------------------+
```

### Implementation Plan

#### Day 1: API Integration Research
- [ ] Sign up for TCGplayer API (if needed)
- [ ] Sign up for Cardmarket API (if needed)
- [ ] Research Yahoo Japan Auctions scraping (legal/ToS check)
- [ ] Test currency conversion API

#### Day 2: Price Fetching (US Market)
- [ ] Build TCGplayer API integration
- [ ] Create card search function
- [ ] Display US prices

#### Day 3: Price Fetching (JP & EU Markets)
- [ ] Build Cardmarket API integration (EU prices)
- [ ] Build Yahoo Japan scraper OR use manual price entry (MVP)
- [ ] Currency conversion integration

#### Day 4: Profit Calculator
- [ ] Shipping cost estimator
- [ ] Fee calculator (all marketplaces)
- [ ] Net profit calculation
- [ ] ROI & opportunity grade

#### Day 5: UI/UX Polish
- [ ] Build comparison cards UI
- [ ] Add arbitrage recommendation section
- [ ] Mobile responsiveness
- [ ] Error handling (card not found, API errors)

#### Day 6-7: Testing & Integration
- [ ] Test with 20+ cards (various price ranges)
- [ ] Add to Premium paywall (subscription gate)
- [ ] Integration with tools.html
- [ ] Final QA

### Success Metrics
- **Goal:** Justify Premium subscription ($9.99/mo)
- **Target:** 30% of Premium subscribers use this tool monthly
- **Conversion:** Primary driver for free → Premium upgrades

---

## PRIORITY 3: TRADE FAIRNESS EVALUATOR (UPGRADE)

### Overview
**Purpose:** Upgrade existing Trade Calculator with trend predictions
**Tier:** FREE (basic) → PREMIUM (trend predictions)
**File:** /tool-calculator.html (modify existing)
**Est. Time:** 2-3 days

### Current Features (Already Built)
- ✅ Card-by-card value input
- ✅ Total value comparison
- ✅ Fair/unfair trade determination (±10%)

### New Features to Add

#### Free Tier (Current Functionality)
- ✅ Keep existing basic calculator
- ✅ Simple fair/unfair determination

#### Premium Tier (New Functionality)
- [x] 30-day price trend (up/down/stable)
- [x] 90-day historical volatility
- [x] "Trade win probability" score
- [x] Market momentum indicator (hot/cold)
- [x] Reprint risk warning (Phase 2 - integrate with Reprint Predictor)

### Technical Requirements

#### Price History API
**Options:**
1. **TCGplayer Market Pricing API** (historical data)
2. **Manual scraping** (store in database)
3. **Community-sourced** (users submit prices)

**Recommendation:** Start with manual database (top 500 cards), expand later

#### Trend Calculation
```javascript
function calculateTrend(priceHistory) {
  // Simple linear regression
  const n = priceHistory.length;
  const sumX = priceHistory.reduce((sum, p, i) => sum + i, 0);
  const sumY = priceHistory.reduce((sum, p) => sum + p.price, 0);
  const sumXY = priceHistory.reduce((sum, p, i) => sum + (i * p.price), 0);
  const sumX2 = priceHistory.reduce((sum, p, i) => sum + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (slope > 5) return "📈 Trending Up (Strong)";
  if (slope > 1) return "📈 Trending Up";
  if (slope < -5) return "📉 Trending Down (Strong)";
  if (slope < -1) return "📉 Trending Down";
  return "➡️ Stable";
}
```

#### Trade Win Probability Score
```javascript
function calculateWinProbability(yourCards, theirCards, trends) {
  let score = 50; // Start neutral

  yourCards.forEach(card => {
    if (trends[card.name] === "Trending Up") score += 5;
    if (trends[card.name] === "Trending Down") score -= 5;
  });

  theirCards.forEach(card => {
    if (trends[card.name] === "Trending Down") score += 5;
    if (trends[card.name] === "Trending Up") score -= 5;
  });

  return Math.max(0, Math.min(100, score)); // Clamp 0-100
}
```

### UI/UX Enhancements

#### Add Trend Indicators to Each Card
```
+------------------------------------------+
|  Your Cards                              |
|  ----------------------------------------|
|  Charizard VMAX     $120.00  📈 +15%     |
|  Pikachu VMAX       $45.00   ➡️ Stable   |
|  Mewtwo V           $30.00   📉 -8%      |
+------------------------------------------+
```

#### Add Premium Analysis Section
```
+------------------------------------------+
|  🔐 PREMIUM: Advanced Trade Analysis     |
|  ----------------------------------------|
|  Trade Win Probability: 68%              |
|  🟢 FAVORABLE - Your cards trending up   |
|                                          |
|  💡 Recommendation:                      |
|  This trade favors you. Your Charizard   |
|  VMAX has shown 15% growth over 30 days, |
|  while their Umbreon VMAX is declining.  |
|                                          |
|  ⚠️ Risk: Charizard reprint rumored     |
|  (Reprint Risk: Medium)                  |
+------------------------------------------+
|  [Upgrade to Premium] to see this        |
+------------------------------------------+
```

### Implementation Plan

#### Day 1: Data Collection
- [ ] Create price history database (JSON)
- [ ] Gather 30-day historical data for top 200 cards
- [ ] Calculate trends for each card

#### Day 2: JavaScript Enhancements
- [ ] Modify tool-calculator.html
- [ ] Add trend lookup function
- [ ] Implement trade win probability calculator
- [ ] Add premium paywall logic (show "Upgrade" for free users)

#### Day 3: UI/Polish/Testing
- [ ] Add trend indicators to card list
- [ ] Build premium analysis section
- [ ] Test with various card combinations
- [ ] Mobile responsiveness

### Success Metrics
- **Goal:** Drive Premium conversions (free users see value)
- **Target:** 15% of free tool users upgrade to Premium
- **Engagement:** 40%+ of trades analyzed use Premium feature

---

## LAUNCH CHECKLIST

### Week 1 (Nov 14-20)
- [ ] Build Set Completion Calculator (Days 1-5)
- [ ] Start Cross-Market Arbitrage Finder (Days 1-3)

### Week 2 (Nov 21-27)
- [ ] Finish Cross-Market Arbitrage Finder (Days 4-7)
- [ ] Upgrade Trade Calculator (Days 1-3)

### Pre-Launch (Nov 28)
- [ ] Final QA on all 5 tools
- [ ] Test subscription paywall (Stripe integration)
- [ ] Update tools.html landing page
- [ ] Create tool demos (screenshots/GIFs)
- [ ] Write launch announcement blog post

### Launch Day (Nov 29)
- [ ] Push to production (GitHub Pages)
- [ ] Announce on social media
- [ ] Email newsletter blast (if list exists)
- [ ] Monitor analytics (tool usage, signups, conversions)

---

## RISK MITIGATION

### Technical Risks
**Problem:** APIs may be expensive or rate-limited
**Solution:** Use free tiers, cache data aggressively, manual data for MVP

**Problem:** Price data may be inaccurate
**Solution:** Disclaimer: "Prices are estimates - always verify before trading"

**Problem:** Tools may break if APIs change
**Solution:** Graceful error handling, fallback to manual input

### Business Risks
**Problem:** Low conversion rate (free → Premium)
**Solution:** Add more Premium-exclusive features, limited free uses

**Problem:** Competitors copy our tools
**Solution:** Build brand authority, focus on quality & UX

---

## SUCCESS METRICS (Post-Launch)

### Week 1 After Launch
- **Signups:** 200+ free accounts
- **Premium:** 20+ subscribers ($200 MRR)
- **Tool Usage:** 500+ tool sessions

### Month 1 After Launch
- **Signups:** 1,000+ free accounts
- **Premium:** 100+ subscribers ($1,000 MRR)
- **Pro:** 5+ subscribers ($150 MRR)
- **Total MRR:** $1,150

### Key Metrics to Track
- Tool usage by tier (which tools drive conversions?)
- Conversion funnel (visitor → signup → Premium)
- Churn rate (are users staying subscribed?)
- Feature requests (what do users want next?)

---

## NEXT STEPS (IMMEDIATE)

1. **Start with Set Completion Calculator** (easiest, highest impact)
2. **Collect data** (Pokemon/MTG set databases + prices)
3. **Build MVP** (basic functionality first, polish later)
4. **Test early** (get feedback before launch)

**Goal:** Launch 3 new tools by November 29, 2025

---

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Author:** Claude (Apex Intelligence Black Friday Action Plan)
