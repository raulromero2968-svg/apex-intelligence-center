# Ecosystem Coordination Plan: Omnis, Intelligence, Commons

**Status:** Active
**Version:** 1.0
**Created:** 2025-12-07
**Last Updated:** 2025-12-07

---

## Executive Summary

This document defines how Apex's three core products - **Omnis** (Input Layer), **Intelligence** (Market Layer), and **Commons** (Public Layer) - coordinate to create a unified economic ecosystem for knowledge workers. The goal is to make all three products feel like inevitable parts of the same value loop.

**Core Loop:**
```
Past Work → Omnis → Intelligence Assets → USD + RC
                ↓
           Commons → Reputation → More Buyers → Loop
```

---

## 1. Three-Layer Stack Narrative

### 1.1 Mental Model

Every Apex user should understand:

> **"Omnis is where I import. Intelligence is where I sell. Commons is where I build reputation."**

### 1.2 Layer Definitions

| Layer | Product | Function | Primary Value |
|-------|---------|----------|---------------|
| **Layer 1** | Omnis | Input Layer | Connect past work, transform into structured intel primitives |
| **Layer 2** | Intelligence | Market Layer | Curate, refine, publish intel cards; earn USD + RC |
| **Layer 3** | Commons | Public Layer | Share freely, build reputation, participate in governance |

### 1.3 Unified Value Proposition

> **"Connect your past work to Omnis. Sell it on Intelligence. Build reputation through Commons. Earn USD for today, RC for tomorrow."**

---

## 2. Layer 1: Omnis (Input Layer)

### 2.1 Core Function

> **"Connect your past work (Upwork, docs, Notion, X threads). Omnis turns them into structured intelligence primitives."**

### 2.2 Supported Integrations

| Source | Integration Type | Data Extracted |
|--------|------------------|----------------|
| **Upwork** | OAuth + API | Project briefs, deliverables, outcomes, client feedback |
| **Fiverr** | OAuth + API | Gig descriptions, deliverables, reviews |
| **Notion** | OAuth | Documents, databases, pages |
| **Google Docs** | OAuth | Documents, presentations, spreadsheets |
| **Twitter/X** | OAuth | Threads, bookmarks, saved posts |
| **Substack** | RSS/API | Newsletter archives |
| **GitHub** | OAuth | Repositories, documentation, READMEs |
| **LinkedIn** | Manual import | Articles, posts, profile data |
| **File Upload** | Direct | PDFs, Word docs, presentations |

### 2.3 Omnis Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     OMNIS PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ Connect │ →  │ Extract  │ →  │ Structure│ →  │ Draft  │ │
│  │ Source  │    │ Content  │    │ Metadata │    │ Cards  │ │
│  └─────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │              │               │              │       │
│       ▼              ▼               ▼              ▼       │
│   OAuth/API     AI Processing   Topic/Entity    Suggested  │
│   Connection    + Chunking      Extraction      Intel Cards│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Output Format

Omnis produces **Intel Primitives** - structured data objects ready for user refinement:

```typescript
interface IntelPrimitive {
  id: string;
  sourceType: 'upwork' | 'twitter' | 'notion' | 'upload' | ...;
  sourceId: string;                    // Original source reference
  sourceUrl?: string;                  // Link to original if available

  // Extracted content
  title: string;                       // AI-suggested title
  summary: string;                     // 2-3 sentence summary
  fullContent: string;                 // Complete extracted content
  keyInsights: string[];               // Bullet-point insights

  // Metadata
  topics: string[];                    // Auto-detected topics
  entities: Entity[];                  // People, companies, concepts
  expertise: string[];                 // Expertise tags

  // Quality signals
  confidenceScore: number;             // AI confidence in extraction
  suggestedPrice: number;              // Based on similar content
  estimatedValue: 'low' | 'medium' | 'high';

  // User control
  status: 'draft' | 'approved' | 'rejected';
  userEdits: EditHistory[];

  // Timestamps
  extractedAt: Date;
  sourceCreatedAt: Date;
}
```

### 2.5 User Experience Flow

**Step 1: Connection**
- User connects source (OAuth or upload)
- Omnis scans available content
- Shows preview of extractable items

**Step 2: Selection**
- User selects which items to process
- Can filter by date, type, topic
- Bulk selection for efficiency

**Step 3: Review**
- AI generates intel primitives
- User reviews suggestions
- Edit titles, summaries, insights
- Approve, reject, or refine

**Step 4: Handoff**
- Approved primitives become Intel Cards
- Automatically appear in Intelligence dashboard
- Ready for pricing and publishing

---

## 3. Layer 2: Intelligence (Market Layer)

### 3.1 Core Function

> **"Curate, refine, and publish those primitives as intel cards in a marketplace that pays in USD + RC."**

### 3.2 Intel Card Structure

```typescript
interface IntelCard {
  id: string;
  authorId: string;

  // Content
  title: string;
  subtitle?: string;
  summary: string;                     // Public preview
  fullContent: string;                 // Paid content
  attachments: Attachment[];           // Files, templates, data

  // Classification
  category: IntelCategory;             // Report, Analysis, Framework, etc.
  topics: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'expert';

  // Pricing
  priceUSD: number;
  currency: 'USD';
  bundleIds?: string[];                // Part of bundles

  // Metrics
  views: number;
  purchases: number;
  revenue: number;
  upvotes: number;
  downvotes: number;
  averageRating: number;

  // RC economics
  rcEarned: number;                    // Total RC from this card
  rcFromUpvotes: number;
  rcFromPurchases: number;

  // Status
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'unlisted' | 'private';

  // Provenance
  sourceId?: string;                   // Link to Omnis primitive
  createdAt: Date;
  publishedAt?: Date;
  lastUpdatedAt: Date;
}
```

### 3.3 Revenue Model

| Transaction Type | Creator Share | Platform Share |
|------------------|---------------|----------------|
| Direct Purchase | 85% | 15% |
| Bundle Purchase | 80% | 20% |
| Subscription Access | 75% | 25% |
| Enterprise License | Negotiated | Negotiated |

### 3.4 Pricing Engine

Intelligence includes AI-assisted pricing:

```typescript
interface PricingSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };

  factors: {
    contentLength: number;             // Word count
    attachmentValue: number;           // Files, templates
    authorReputation: number;          // RC-based
    topicDemand: number;               // Market signals
    competitorPricing: number;         // Similar content
    expertiseLevel: number;            // Depth of content
  };

  confidence: number;                  // 0-1 confidence score
  explanation: string;                 // Human-readable reasoning
}
```

### 3.5 Discovery & Ranking

Intelligence surfaces content through:

| Discovery Method | Weight Factors |
|------------------|----------------|
| **Search** | Relevance, recency, author RC |
| **Browse by Topic** | Quality score, sales, ratings |
| **Recommendations** | Purchase history, topic affinity |
| **Trending** | Recent sales, upvotes, views |
| **Featured** | Editorial selection (no pay-to-play) |

**Anti-Gaming Rules:**
- No paid placement in organic results
- RC cannot be purchased to boost rankings
- Upvotes from low-RC users weighted less
- Suspicious patterns trigger review

### 3.6 User Experience Flow

**For Sellers:**
1. Review Omnis-generated intel primitives
2. Refine content, add attachments
3. Set pricing (AI-suggested or custom)
4. Choose visibility (public/unlisted)
5. Publish to marketplace
6. Track performance in dashboard

**For Buyers:**
1. Search or browse marketplace
2. Preview summaries and author profiles
3. Purchase individual cards or bundles
4. Access full content immediately
5. Rate and review purchases
6. Save to personal library

---

## 4. Layer 3: Commons (Public Layer)

### 4.1 Core Function

> **"Share a portion of your work freely to build reputation, help the ecosystem, and participate in governance."**

### 4.2 Commons Content Types

| Content Type | Description | RC Earning Potential |
|--------------|-------------|---------------------|
| **Guides** | How-to content, tutorials | High (if quality) |
| **Frameworks** | Mental models, templates | Very High |
| **Analyses** | Commentary on trends | Medium |
| **Resources** | Lists, references, links | Medium |
| **Discussions** | Questions, threads | Low-Medium |

### 4.3 Commons vs Intelligence

| Aspect | Commons | Intelligence |
|--------|---------|--------------|
| **Access** | Free | Paid |
| **Depth** | Preview / Overview | Full detail |
| **Monetization** | RC only | USD + RC |
| **Purpose** | Reputation building | Direct revenue |
| **Governance** | Enabled | Enabled |

### 4.4 Strategic Use of Commons

**For Creators:**
- Tease premium content with free previews
- Build trust before asking for money
- Establish expertise in topic areas
- Earn RC to unlock features
- Participate in platform governance

**Commons → Intelligence Funnel:**
```
┌─────────────────────────────────────────────┐
│              COMMONS POST                    │
│  "5 Frameworks for AI-Proof Freelancing"    │
│                                             │
│  [Full content - free]                      │
│  [RC earned from upvotes]                   │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 🔒 Want the implementation templates? │  │
│  │    Get the full toolkit on Intelligence │ │
│  │    [View Premium Version →]            │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 4.5 Governance Functions

Commons is where governance happens:

| Governance Action | RC Requirement | Description |
|-------------------|----------------|-------------|
| Vote on proposals | 100+ RC | Basic voting rights |
| Create proposals | 500+ RC | Submit platform changes |
| Moderate content | 1000+ RC | Flag and review |
| Governance council | 5000+ RC | Strategic decisions |

---

## 5. Cross-Platform User Journeys

### 5.1 Freelancer Path: Upwork → Omnis → Intelligence

```
┌─────────────────────────────────────────────────────────────┐
│                   FREELANCER JOURNEY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Connect Upwork                                     │
│  ├── OAuth authorization                                    │
│  ├── Omnis scans project history                           │
│  └── 47 projects found                                      │
│                                                             │
│  STEP 2: Extract Intelligence                               │
│  ├── Select best 10 projects                               │
│  ├── AI extracts deliverables, outcomes                    │
│  └── Generates 15 intel primitives                         │
│                                                             │
│  STEP 3: Refine & Publish                                   │
│  ├── Review suggested titles/summaries                     │
│  ├── Add context and insights                              │
│  ├── Set pricing ($25-75 range)                            │
│  └── Publish to Intelligence                               │
│                                                             │
│  STEP 4: Earn Forever                                       │
│  ├── Each sale: 85% USD to creator                         │
│  ├── Each upvote: +5 RC                                    │
│  └── Past work becomes passive income                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Curator Path: X/Twitter → Intelligence → Commons

```
┌─────────────────────────────────────────────────────────────┐
│                    CURATOR JOURNEY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Connect Twitter                                    │
│  ├── OAuth authorization                                    │
│  ├── Omnis imports bookmarks + threads                     │
│  └── 200+ threads identified                               │
│                                                             │
│  STEP 2: Select & Generate                                  │
│  ├── Choose viral threads (5k+ impressions)                │
│  ├── AI expands into full intel reports                    │
│  └── 2,000-word reports in 60 seconds                      │
│                                                             │
│  STEP 3: Dual Publish                                       │
│  ├── Full report → Intelligence ($15-30)                   │
│  ├── Distilled version → Commons (free)                    │
│  └── Commons links to Intelligence                         │
│                                                             │
│  STEP 4: Flywheel                                           │
│  ├── Commons visibility → marketplace buyers               │
│  ├── Share Intel links on Twitter                          │
│  ├── More followers see → more sales                       │
│  └── RC accumulates for governance                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Educator Path: Commons → Intelligence

```
┌─────────────────────────────────────────────────────────────┐
│                    EDUCATOR JOURNEY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Start in Commons                                   │
│  ├── Upload lectures, guides, frameworks                   │
│  ├── All content free initially                            │
│  └── Build reputation through quality                      │
│                                                             │
│  STEP 2: Earn RC                                            │
│  ├── Upvotes from community → RC                           │
│  ├── Downloads and saves → RC                              │
│  └── Comments and engagement → RC                          │
│                                                             │
│  STEP 3: Premium Layer                                      │
│  ├── Popular Commons content → premium version             │
│  ├── Add depth, templates, exercises                       │
│  └── Price on Intelligence ($15-50)                        │
│                                                             │
│  STEP 4: Authority Position                                 │
│  ├── RC unlocks governance participation                   │
│  ├── Shape educational standards                           │
│  ├── Mentor new educators                                  │
│  └── Impact + income + influence                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Analyst Path: Upload → Intelligence (Premium)

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYST JOURNEY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Upload Archive                                     │
│  ├── Past reports, presentations, analysis                 │
│  ├── Omnis decomposes into components                      │
│  └── Creates modular intel cards                           │
│                                                             │
│  STEP 2: Premium Positioning                                │
│  ├── Set premium pricing ($50-200)                         │
│  ├── Create expert profile with credentials                │
│  └── Bundle related intel into packages                    │
│                                                             │
│  STEP 3: Continuous Feed                                    │
│  ├── New consulting work → new intel                       │
│  ├── Each project adds to archive                          │
│  └── Archive becomes passive income stream                 │
│                                                             │
│  STEP 4: Network Effects                                    │
│  ├── Other users cite your intel                           │
│  ├── Citations boost visibility                            │
│  ├── Premium reputation attracts consulting                │
│  └── Full-circle: more work → more intel                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Incentive Architecture

### 6.1 RC Earning Rules (v1)

| Action | RC Earned | Caps/Notes |
|--------|-----------|------------|
| **Omnis: Connect first source** | +50 RC | One-time bonus |
| **Omnis: Process 10+ items** | +25 RC | Per batch |
| **Intelligence: First published card** | +100 RC | One-time bonus |
| **Intelligence: Card purchased** | +10 RC | Per purchase |
| **Intelligence: Card upvoted** | +5 RC | Per 10 net upvotes |
| **Intelligence: 5-star rating** | +15 RC | Per rating |
| **Commons: Publish content** | +25 RC | Per approved item |
| **Commons: Content upvoted** | +3 RC | Per 10 net upvotes |
| **Commons: Content downloaded** | +1 RC | Per 100 downloads |
| **Governance: Vote on proposal** | +5 RC | Per vote cast |
| **Governance: Proposal passes (voted with majority)** | +25 RC | Per proposal |

### 6.2 RC Spending/Requirements

| Feature/Action | RC Required | Notes |
|----------------|-------------|-------|
| Basic marketplace access | 0 RC | Free |
| Create governance proposals | 500 RC | Minimum to propose |
| Priority review for new content | 250 RC | Faster approval |
| Featured placement application | 1000 RC | Doesn't guarantee featuring |
| Moderation privileges | 1500 RC | Plus good standing |
| Governance council nomination | 5000 RC | Community election |

### 6.3 Cross-Product Incentives

| Behavior | Incentive |
|----------|-----------|
| Use Omnis to create Intel cards | Faster approval, "Omnis-verified" badge |
| Publish to both Commons and Intelligence | Commons preview links to paid version |
| High RC from Commons | Higher visibility in Intelligence |
| High sales in Intelligence | Featured in Commons recommendations |

### 6.4 RC Thresholds & Unlocks

| RC Level | Tier | Unlocks |
|----------|------|---------|
| 0-99 | **Newcomer** | Basic access |
| 100-499 | **Contributor** | Voting rights, basic analytics |
| 500-1499 | **Established** | Proposal creation, priority support |
| 1500-4999 | **Authority** | Moderation tools, advanced analytics |
| 5000+ | **Leader** | Governance council eligibility, platform input |

---

## 7. Technical Integration

### 7.1 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  OMNIS   │ ──── │ INTELLIGENCE │ ──── │   COMMONS    │  │
│  └──────────┘      └──────────────┘      └──────────────┘  │
│       │                   │                     │           │
│       ▼                   ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UNIFIED USER PROFILE                     │  │
│  │  ├── userId                                          │  │
│  │  ├── rcBalance                                       │  │
│  │  ├── rcHistory[]                                     │  │
│  │  ├── connectedSources[]                              │  │
│  │  ├── intelCards[]                                    │  │
│  │  ├── commonsContent[]                                │  │
│  │  ├── purchases[]                                     │  │
│  │  └── governanceActivity[]                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                RC LEDGER (IMMUTABLE)                  │  │
│  │  ├── transactionId                                   │  │
│  │  ├── userId                                          │  │
│  │  ├── amount (+/-)                                    │  │
│  │  ├── reason (enum)                                   │  │
│  │  ├── sourceProduct (omnis/intel/commons)             │  │
│  │  ├── metadata (JSON)                                 │  │
│  │  └── timestamp                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 API Endpoints

**Omnis API:**
```
POST   /api/omnis/connect/{source}      # Connect new source
GET    /api/omnis/sources               # List connected sources
POST   /api/omnis/extract               # Extract primitives from source
GET    /api/omnis/primitives            # List user's primitives
PATCH  /api/omnis/primitives/{id}       # Update primitive
POST   /api/omnis/primitives/{id}/approve  # Approve for Intelligence
```

**Intelligence API:**
```
GET    /api/intel/cards                 # Browse marketplace
GET    /api/intel/cards/{id}            # Get card details
POST   /api/intel/cards                 # Create new card
PATCH  /api/intel/cards/{id}            # Update card
POST   /api/intel/cards/{id}/publish    # Publish to marketplace
POST   /api/intel/purchase              # Purchase a card
GET    /api/intel/my/cards              # Creator's cards
GET    /api/intel/my/purchases          # User's purchases
```

**Commons API:**
```
GET    /api/commons/content             # Browse Commons
GET    /api/commons/content/{id}        # Get content details
POST   /api/commons/content             # Submit new content
POST   /api/commons/vote                # Upvote/downvote
GET    /api/commons/governance/proposals # List proposals
POST   /api/commons/governance/propose  # Create proposal
POST   /api/commons/governance/vote     # Vote on proposal
```

**RC API:**
```
GET    /api/rc/balance                  # User's RC balance
GET    /api/rc/history                  # Transaction history
GET    /api/rc/leaderboard              # Top RC holders
```

### 7.3 Database Schema Additions

```typescript
// Omnis tables
export const omnisSources = pgTable('omnis_sources', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => users.id),
  sourceType: text('source_type').notNull(), // 'upwork', 'twitter', etc.
  sourceCredentials: text('source_credentials'), // Encrypted OAuth tokens
  lastSyncAt: integer('last_sync_at'),
  itemCount: integer('item_count').default(0),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const omnisPrimitives = pgTable('omnis_primitives', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => users.id),
  sourceId: text('source_id').notNull().references(() => omnisSources.id),
  sourceItemId: text('source_item_id'), // ID in original source
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  fullContent: text('full_content').notNull(),
  keyInsights: text('key_insights'), // JSON array
  topics: text('topics'), // JSON array
  entities: text('entities'), // JSON array
  confidenceScore: real('confidence_score'),
  suggestedPrice: real('suggested_price'),
  status: text('status').notNull().default('draft'),
  intelCardId: text('intel_card_id').references(() => intelCards.id),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

// Intelligence tables
export const intelCards = pgTable('intel_cards', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  authorId: text('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  summary: text('summary').notNull(),
  fullContent: text('full_content').notNull(),
  attachments: text('attachments'), // JSON array
  category: text('category').notNull(),
  topics: text('topics'), // JSON array
  expertiseLevel: text('expertise_level').notNull().default('intermediate'),
  priceUSD: real('price_usd').notNull(),
  views: integer('views').default(0),
  purchases: integer('purchases').default(0),
  revenue: real('revenue').default(0),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  rcEarned: integer('rc_earned').default(0),
  status: text('status').notNull().default('draft'),
  visibility: text('visibility').notNull().default('public'),
  sourceId: text('source_id').references(() => omnisPrimitives.id),
  publishedAt: integer('published_at'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const intelPurchases = pgTable('intel_purchases', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  buyerId: text('buyer_id').notNull().references(() => users.id),
  cardId: text('card_id').notNull().references(() => intelCards.id),
  amountUSD: real('amount_usd').notNull(),
  creatorShareUSD: real('creator_share_usd').notNull(),
  platformShareUSD: real('platform_share_usd').notNull(),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const intelVotes = pgTable('intel_votes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => users.id),
  cardId: text('card_id').notNull().references(() => intelCards.id),
  value: integer('value').notNull(), // +1 or -1
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  uniqueVote: uniqueIndex('intel_vote_unique').on(table.userId, table.cardId),
}));
```

---

## 8. Success Metrics

### 8.1 Ecosystem Health Metrics

| Metric | Target (Month 3) | Target (Month 6) |
|--------|------------------|------------------|
| **Omnis Sources Connected** | 1,000 | 10,000 |
| **Intel Primitives Processed** | 5,000 | 50,000 |
| **Intel Cards Published** | 500 | 5,000 |
| **Commons Content Items** | 1,000 | 10,000 |
| **Total RC in Circulation** | 100,000 | 1,000,000 |
| **Cross-product Users** (use 2+ products) | 30% | 50% |

### 8.2 Funnel Metrics

| Funnel Step | Target Conversion |
|-------------|-------------------|
| Signup → Connect Source (Omnis) | 40% |
| Connect → Extract Primitives | 60% |
| Extract → Approve Primitives | 50% |
| Approve → Publish Intel Card | 70% |
| Publish → First Sale | 30% |

### 8.3 Economic Metrics

| Metric | Target (Month 6) |
|--------|------------------|
| **Total GMV** (Intelligence) | $100,000 |
| **Average Card Price** | $35 |
| **Creator Earnings** (avg/month) | $250 |
| **RC-to-USD Correlation** | Validated |

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

- [ ] Omnis schema and basic integrations (Twitter, Upload)
- [ ] Intelligence card creation and publishing
- [ ] Commons content submission
- [ ] Unified RC ledger

### Phase 2: Marketplace (Weeks 5-8)

- [ ] Intelligence purchase flow (Stripe)
- [ ] Discovery and search
- [ ] Cross-product RC flows
- [ ] Creator dashboards

### Phase 3: Growth (Weeks 9-12)

- [ ] Additional Omnis integrations (Upwork, Notion)
- [ ] Governance system
- [ ] Analytics and insights
- [ ] Mobile optimization

---

## 10. Related Documents

- [Strategic Positioning](./STRATEGIC_POSITIONING.md) - Market positioning
- [User Personas](./USER_PERSONAS.md) - User journey details
- [Community Building Plan](./COMMUNITY_BUILDING_PLAN.md) - Network effects
- [Hybrid Economy Messaging](./HYBRID_ECONOMY_MESSAGING.md) - USD/RC messaging
- [Apex Commons Execution Plan](./APEX_COMMONS_EXECUTION_PLAN.md) - Commons technical spec

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-07 | Initial ecosystem coordination plan | Strategy Team |

---

*This document defines how Omnis, Intelligence, and Commons work together. All product decisions should reinforce cross-product value.*
