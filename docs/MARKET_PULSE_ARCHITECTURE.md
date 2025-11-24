# Market Pulse Architecture Blueprint
**Architectural Impact Analysis: Subroutine 042**

## Executive Summary

This document provides a comprehensive architectural analysis for integrating the **Market Pulse** feature into Apex Intelligence Center. The analysis covers data flow architecture, database schema design, integration points with existing infrastructure, and a phased implementation roadmap.

**Status:** Phase 1 (UI Build) pending → Phase 2 (Production Integration) ready for execution
**Current Branch:** `claude/architecture-scalability-analysis-01MJJ2xoG36zqHnATay7UoF9`
**Impact Level:** Medium - New table, no breaking changes to existing schema

---

## 1. Current Infrastructure Assessment

### Database Technology Stack ✓
- **Database:** PostgreSQL on Neon (Serverless)
- **ORM:** Drizzle ORM v0.44.7
- **Extensions:** pgvector (vector embeddings for semantic search)
- **Connection Pool:** node-postgres (max 20 connections, optimized for serverless)
- **Migration Tool:** Drizzle Kit v0.31.7

### Existing Market Intelligence Tables

| Table | Purpose | Key Features | Relevance to Market Pulse |
|-------|---------|--------------|---------------------------|
| `cards` | Core TCG card entity | `apexScore`, `sevenDayGainPercent`, `isManipulated`, manipulation flags | **HIGH** - Source for card metadata and manipulation detection |
| `prices` | Multi-source market prices | JustTCG, TCGPlayer, Cardmarket, PSA 10/9 prices | **HIGH** - Source for current price data |
| `market_knowledge` | AI-generated intelligence | 1536-dim vectors, sentiment (bullish/bearish/neutral), reliability scoring | **CRITICAL** - Source for "why" explanations with semantic search |
| `arbitrageOpportunities` | Cross-market arbitrage | JP/EU/US spreads, 15-min TTL, risk-adjusted metrics | **MEDIUM** - Alternative source for movers (arbitrage-driven spikes) |
| `manipulationAlerts` | Pump detection | LAMP + Contrarian, volume spikes >40%, severity levels | **HIGH** - Risk indicator for market movers |
| `sales` | Transaction provenance | eBay, PWCC, Goldin, Cardladder sales with cert numbers | **LOW** - Historical context for price validation |

### Existing API Routes
- `/api/arbitrage/live` - Top 50 arbitrage opportunities (already implemented)
- `/api/realtime` - SSE stream for live price updates (mock data)
- `/api/research` - RAG-powered market research with streaming
- `/api/manipulation/scan` - Market manipulation detection

---

## 2. Data Flow Architecture

### Phase 1: Tactical (MVP - Static Data)
**Timeline:** Immediate (UI build completion)

```
┌─────────────────────┐
│  MarketPulse.tsx    │
│  (Client/Server     │
│   Component)        │
└──────────┬──────────┘
           │
           ▼
    ┌────────────┐
    │ Static JSON│ ← Hardcoded in component
    │ 5 Movers   │   (From Grok's data structure)
    └────────────┘
```

**Pros:**
- Zero implementation time
- No database changes required
- Immediate value to users

**Cons:**
- Data becomes stale immediately
- Requires code deployment to update
- No provenance or audit trail
- Cannot support "Last Updated" timestamp

---

### Phase 2: Strategic (Production - Dynamic Data)
**Timeline:** Post-MVP (after UI validation)

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                       │
└──────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Grok Crawler│      │ LAMP Sentiment  │      │ Price Velocity  │
│  (External) │      │   Analysis      │      │   Calculator    │
└──────┬──────┘      └────────┬────────┘      └────────┬────────┘
       │                      │                         │
       │                      │                         │
       ▼                      ▼                         ▼
┌────────────────────────────────────────────────────────────────┐
│              /api/market-movers/ingest (Secured)               │
│                    (API Key Authentication)                     │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Neon PostgreSQL  │
                  │ market_movers    │
                  │   (15-min TTL)   │
                  └─────────┬────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                             │
└──────────────────────────────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ MarketPulse.tsx │ │ /api/realtime    │ │ /api/research   │
│ (Server Comp)   │ │ (SSE Stream)     │ │ (RAG Context)   │
└─────────────────┘ └──────────────────┘ └─────────────────┘
```

**Data Freshness:**
- Ingestion: Every 15 minutes (cron job)
- TTL: 15 minutes (auto-expire stale data)
- User-facing: "Last Updated: X minutes ago"

**Benefits:**
1. **Zero-latency updates** - No code deployments needed
2. **Provenance tracking** - Full audit trail via `sources` array
3. **Semantic search ready** - Integrate with `market_knowledge` embeddings
4. **Real-time UI** - SSE streaming support for live updates
5. **Manipulation protection** - Cross-reference with `manipulationAlerts`

---

## 3. Schema Design

### Proposed: `market_movers` Table

**Location:** `/home/user/apex-intelligence-center/apps/web/src/db/schema.ts`

```typescript
/**
 * Market Movers - Top daily price gainers with AI-powered insights
 *
 * Stores the top 5 market movers with explainable "why" reasoning.
 * Designed for high-performance queries with 15-minute refresh cycles.
 *
 * Features:
 * - Ranked ordering (1-5) for consistent UI display
 * - Foreign key to cards table for relational integrity
 * - JSONB sources array for provenance (citations)
 * - TTL via fetchedAt + expiresAt for automatic staleness detection
 * - Composite indexes for common query patterns
 */
export const marketMovers = pgTable('market_movers', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Relational integrity
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),

  // Display rank (1 = highest gainer, 5 = 5th highest)
  rank: integer('rank').notNull(),

  // Price data (snapshot at ingestion time)
  currentPrice: real('current_price').notNull(), // Store as float, display as "$2000+"
  changePercentage: real('change_percentage').notNull(), // e.g., 45.2 for +45.2%

  // AI-powered explanation (the "why" - critical for value prop)
  reason: text('reason').notNull(),

  // Provenance array (e.g., ["TCGPlayer API", "Reddit r/pkmntcg", "Twitter @PokeInvestor"])
  sources: jsonb('sources').$type<string[]>().notNull().default([]),

  // Sentiment indicator (derived from market_knowledge table)
  sentiment: text('sentiment', {
    enum: ['bullish', 'bearish', 'neutral']
  }),

  // Manipulation risk flag (cross-referenced with manipulationAlerts)
  isManipulated: boolean('is_manipulated').default(false).notNull(),

  // TTL fields (15-minute refresh cycle)
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // fetchedAt + 15 minutes

  // Metadata for extensibility
  metadata: jsonb('metadata').$type<{
    sevenDayHigh?: number;
    volumeSpike?: number;
    arbitrageSpread?: number;
    [key: string]: any;
  }>().default({}),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Primary query: Get active movers ordered by rank
  rankExpiresIdx: index('idx_market_movers_rank_expires')
    .on(table.rank, table.expiresAt),

  // Filter by card for historical tracking
  cardIdIdx: index('idx_market_movers_card_id')
    .on(table.cardId),

  // Expiration cleanup queries
  expiresAtIdx: index('idx_market_movers_expires_at')
    .on(table.expiresAt),

  // Timestamp index for historical analysis
  fetchedAtIdx: index('idx_market_movers_fetched_at')
    .on(table.fetchedAt),

  // Ensure only one entry per rank per refresh cycle
  uniqueRankFetched: uniqueIndex('idx_market_movers_unique_rank_fetched')
    .on(table.rank, table.fetchedAt),
}));

// Type exports for TypeScript
export type MarketMover = typeof marketMovers.$inferSelect;
export type NewMarketMover = typeof marketMovers.$inferInsert;
```

### Migration Strategy

**File:** `/home/user/apex-intelligence-center/apps/web/drizzle/0027_market_movers.sql`

```sql
-- Market Movers table for top daily gainers
CREATE TABLE IF NOT EXISTS "market_movers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "card_id" text NOT NULL REFERENCES "cards"("id") ON DELETE CASCADE,
  "rank" integer NOT NULL,
  "current_price" real NOT NULL,
  "change_percentage" real NOT NULL,
  "reason" text NOT NULL,
  "sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "sentiment" text CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  "is_manipulated" boolean DEFAULT false NOT NULL,
  "fetched_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX "idx_market_movers_rank_expires" ON "market_movers" ("rank", "expires_at");
CREATE INDEX "idx_market_movers_card_id" ON "market_movers" ("card_id");
CREATE INDEX "idx_market_movers_expires_at" ON "market_movers" ("expires_at");
CREATE INDEX "idx_market_movers_fetched_at" ON "market_movers" ("fetched_at");
CREATE UNIQUE INDEX "idx_market_movers_unique_rank_fetched" ON "market_movers" ("rank", "fetched_at");

-- Automatic cleanup trigger (optional - can also use cron)
CREATE OR REPLACE FUNCTION cleanup_expired_market_movers()
RETURNS void AS $$
BEGIN
  DELETE FROM market_movers WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Integration Points

### A. Integration with `market_knowledge` Table

**Purpose:** Enrich market movers with AI-generated "why" explanations via semantic search

**Query Pattern:**
```typescript
// When ingesting market movers, query market_knowledge for relevant claims
const relevantKnowledge = await db
  .select()
  .from(market_knowledge)
  .where(
    and(
      sql`content ILIKE ${`%${cardName}%`}`,
      gte(market_knowledge.reliability_score, 0.7), // High-confidence only
      eq(market_knowledge.sentiment, 'bullish') // Match bullish sentiment for gainers
    )
  )
  .orderBy(desc(market_knowledge.created_at))
  .limit(3);

// Extract sources from metadata.citations
const sources = relevantKnowledge.flatMap(k =>
  k.metadata.citations?.map(c => c.type) || []
);
```

**Benefit:** Leverages existing LAMP sentiment analysis and vector search infrastructure

---

### B. Integration with `manipulationAlerts` Table

**Purpose:** Flag suspicious market movers to protect users from pump-and-dump schemes

**Query Pattern:**
```typescript
// Cross-reference each mover with active manipulation alerts
const alerts = await db
  .select()
  .from(manipulationAlerts)
  .where(
    and(
      eq(manipulationAlerts.cardId, cardId),
      eq(manipulationAlerts.isActive, true)
    )
  );

const isManipulated = alerts.length > 0;
```

**UI Impact:**
- Manipulated movers display with ⚠️ warning icon
- Link to `/manipulation/${cardId}` for detailed analysis
- Severity badge: "Warning" (orange) or "Critical" (red)

---

### C. Integration with `arbitrageOpportunities` Table

**Purpose:** Identify movers driven by cross-market arbitrage (e.g., JP → US flips)

**Query Pattern:**
```typescript
// Check if mover has active arbitrage opportunities
const arbitrage = await db
  .select()
  .from(arbitrageOpportunities)
  .where(
    and(
      eq(arbitrageOpportunities.cardId, cardId),
      gte(arbitrageOpportunities.spreadPct, 18), // Minimum 18% spread
      gt(arbitrageOpportunities.expiresAt, new Date())
    )
  );

// Add to metadata for display
metadata.arbitrageSpread = arbitrage[0]?.spreadPct;
```

**UI Enhancement:** Show "Arbitrage Opportunity: +25% JP → US" badge

---

## 5. API Design

### Ingestion Endpoint: `/api/market-movers/ingest` (POST)

**Authentication:** API Key (shared secret with Grok crawler)

**Request Body:**
```typescript
interface MarketMoverIngestionRequest {
  movers: Array<{
    cardName: string; // Used to lookup cardId via cards table
    setName?: string;
    currentPrice: number;
    changePercentage: number;
    reason: string;
    sources: string[];
    sentiment?: 'bullish' | 'bearish' | 'neutral';
  }>;
  fetchedAt: string; // ISO 8601 timestamp
}
```

**Implementation:**
1. Validate API key
2. Lookup `cardId` for each mover via `cards` table (by name + set)
3. Cross-reference with `manipulationAlerts` to set `isManipulated` flag
4. Set `expiresAt = fetchedAt + 15 minutes`
5. Insert into `market_movers` with rank 1-5
6. Return 200 OK with inserted IDs

**Rate Limiting:** 1 request per 15 minutes (aligned with TTL)

---

### Query Endpoint: `/api/market-movers` (GET)

**Purpose:** Serve market movers to MarketPulse.tsx component

**Response:**
```typescript
interface MarketMoverResponse {
  movers: Array<{
    id: string;
    rank: number;
    card: {
      id: string;
      name: string;
      setName: string;
      imageUrl?: string;
    };
    currentPrice: number;
    changePercentage: number;
    reason: string;
    sources: string[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    isManipulated: boolean;
    fetchedAt: string;
  }>;
  lastUpdated: string; // ISO 8601
  expiresAt: string;
}
```

**Caching:**
- Next.js `revalidate: 60` (1 minute cache)
- Vercel Edge Config for zero-latency global reads (optional)

---

## 6. Roadmap Integration

### Initiative 1: AI-Powered Insights (H1 2026)

**Reference:** [cite: 45] Roadmap item for predictive market intelligence

**How Market Movers Enables This:**
1. **Historical Reason Tracking** - By storing `reason` field with timestamps, we accumulate a training dataset of "why cards moved"
2. **Pattern Recognition** - ML model can learn:
   - "Meta deck usage" → 72% chance of sustained growth
   - "Buyout speculation" → 43% chance of crash within 7 days
   - "Tournament win" → 89% chance of 3-day spike then correction
3. **Semantic Clustering** - Use `market_knowledge` embeddings to group similar explanations
4. **Predictive API** - `/api/insights/predict` returns "Cards likely to spike in next 7 days"

**Data Requirements:**
- 90 days of historical `market_movers` data (minimum)
- Cross-referenced with `prices` table for validation
- Sentiment labels from `market_knowledge` for supervised learning

---

### Initiative 2: Perplexity-Style Blog (H1 2026)

**Reference:** [cite: 21] Transparency and citation-backed research

**How Market Movers Enables This:**
1. **Provenance Array** - `sources` field directly maps to blog citations
2. **Auto-Generated Articles** - Template: "Why {cardName} Spiked +{changePercentage}%"
3. **Markdown Rendering** - Convert `reason` + `sources` to blog post:
   ```markdown
   # Why Charizard 1st Edition PSA 10 Spiked +47%

   {reason}

   ## Sources
   - [TCGPlayer Market Data](...)
   - [Reddit Discussion](...)
   - [PSA Population Report](...)
   ```
4. **SEO Optimization** - Each mover gets a dedicated `/blog/market-movers/{date}/{slug}` page

**Implementation:**
- Cron job: Daily at midnight, generate blog posts for top 5 movers
- Store in `collections` table with `type: 'market-mover-report'`
- Display in `/market` page as "Today's Market Pulse Report"

---

## 7. Migration Checklist

### Phase 2A: Database Setup
- [ ] Add `market_movers` table to `/apps/web/src/db/schema.ts`
- [ ] Generate migration: `pnpm drizzle-kit generate`
- [ ] Review migration SQL in `/apps/web/drizzle/0027_market_movers.sql`
- [ ] Run migration: `pnpm drizzle-kit migrate` (local) + `pnpm db:push` (Neon)
- [ ] Verify indexes created: `EXPLAIN ANALYZE SELECT * FROM market_movers ORDER BY rank WHERE expires_at > NOW()`

### Phase 2B: API Development
- [ ] Create `/apps/web/src/app/api/market-movers/ingest/route.ts`
  - [ ] API key authentication via `MARKET_MOVERS_API_KEY` env var
  - [ ] Card lookup logic (name → cardId)
  - [ ] Manipulation check integration
  - [ ] Upsert logic (replace stale data)
- [ ] Create `/apps/web/src/app/api/market-movers/route.ts`
  - [ ] Query active movers (WHERE `expires_at > NOW()`)
  - [ ] Join with `cards` table for metadata
  - [ ] Apply `revalidate: 60` cache
- [ ] Add env vars to Vercel:
  - `MARKET_MOVERS_API_KEY` (generate via `openssl rand -hex 32`)

### Phase 2C: Component Integration
- [ ] Update `MarketPulse.tsx` to fetch from `/api/market-movers`
- [ ] Add "Last Updated" timestamp display
- [ ] Add loading state (Suspense boundary)
- [ ] Add error state (fallback to static data)
- [ ] Add manipulation warning badges

### Phase 2D: Ingestion Pipeline (External)
- [ ] Create Grok crawler script (Python/Node.js)
- [ ] Schedule via cron (every 15 minutes)
- [ ] POST to `/api/market-movers/ingest` with API key
- [ ] Monitor via Sentry for ingestion failures

---

## 8. Performance Considerations

### Query Performance
- **Primary Query** (serve MarketPulse UI):
  ```sql
  SELECT * FROM market_movers
  WHERE expires_at > NOW()
  ORDER BY rank ASC
  LIMIT 5;
  ```
  - **Estimated Cost:** < 0.5ms (uses `idx_market_movers_rank_expires`)
  - **Scaling:** O(1) regardless of table size (only 5-10 active rows at any time)

### Storage Impact
- **Per Record:** ~500 bytes (UUID + text + JSONB)
- **Active Records:** 5 (only current top 5)
- **Historical Records:** 480/day (5 records × 96 refreshes) = ~240 KB/day
- **Annual Storage:** 87.6 MB (negligible - 0.001% of Neon free tier)

### Cleanup Strategy
1. **Option A:** TTL-based auto-delete (recommended)
   - Cron job: `DELETE FROM market_movers WHERE expires_at < NOW()`
   - Frequency: Daily at 2 AM UTC
   - Retention: Keep last 90 days for AI training

2. **Option B:** Rolling window
   - Keep only last 10 refresh cycles (2.5 hours of data)
   - Immediate cleanup on new ingestion

---

## 9. Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Stale Data (Phase 1)** | High - Users see outdated movers | Deploy Phase 2 within 2 weeks of Phase 1 launch |
| **Ingestion Failure** | Medium - UI shows empty state | Fallback to last valid dataset (expires_at + 1 hour grace period) |
| **Manipulation False Positives** | Low - Legitimate movers flagged | Adjust `manipulationAlerts` threshold (currently >40% volume spike) |
| **API Key Leak** | High - Unauthorized ingestion | Rotate key immediately + rate limiting (1 req/15 min) |
| **Database Migration Failure** | Critical - Schema out of sync | Test migration on staging DB first + rollback script prepared |

---

## 10. Success Metrics

### Technical Metrics
- [ ] Query latency: < 50ms (p95)
- [ ] Ingestion success rate: > 99.5%
- [ ] Cache hit rate: > 90%
- [ ] Zero breaking changes to existing tables

### Product Metrics
- [ ] Market page bounce rate: Decrease by 20%
- [ ] Time on page: Increase by 30 seconds
- [ ] Click-through rate to card detail pages: > 15%
- [ ] User feedback: "Market Pulse is helpful" > 80% agree

---

## 11. Immediate Action Items

### For GPT (UI Agent)
1. ✅ Complete `MarketPulse.tsx` component (Phase 1 - static data)
2. Ensure component accepts both static and API data sources (prop: `dataSource: 'static' | 'api'`)
3. Add "Last Updated" timestamp display (hidden in Phase 1, shown in Phase 2)
4. Add manipulation warning icon (⚠️) when `isManipulated === true`

### For Manus (Migration Agent)
1. **After Phase 1 UI completion:**
   - Add `market_movers` schema to `/apps/web/src/db/schema.ts`
   - Run `pnpm drizzle-kit generate` to create migration
   - Verify no conflicts with existing `intel_items` table
   - Check migration rollback script
   - Deploy to Neon staging first, then production

### For Architect (This Agent)
1. ✅ Complete architectural blueprint (this document)
2. Monitor UI build progress - ready to trigger Phase 2 on completion
3. Prepare API endpoint specifications for backend team
4. Review Grok's crawler implementation for ingestion pipeline

---

## 12. Phase Transition Checklist

### Phase 1 → Phase 2 Trigger Conditions
- [x] `MarketPulse.tsx` component completed and merged
- [ ] User validation: Positive feedback on static UI (>80% approval)
- [ ] Technical validation: No console errors, mobile responsive
- [ ] Stakeholder approval: Product team signs off on design

### Phase 2 Go-Live Checklist
- [ ] Database migration deployed to production
- [ ] API endpoints tested (200 OK, correct data shape)
- [ ] Grok crawler scheduled and tested (dry run)
- [ ] Monitoring dashboards configured (Sentry + Vercel Analytics)
- [ ] Rollback plan documented and tested
- [ ] Feature flag enabled: `ENABLE_MARKET_MOVERS_API=true`

---

## Appendix A: Technology Stack References

**Cited References:**
- [cite: 21] - Perplexity-style blog with transparent citations
- [cite: 28] - Technology stack documentation (Neon, Drizzle, Next.js)
- [cite: 34] - Neon Serverless Postgres
- [cite: 35] - Drizzle ORM v0.44.7
- [cite: 45] - AI-Powered Insights roadmap initiative (H1 2026)
- [cite: 73] - Great Reset workflow for database schema changes

---

## Appendix B: Schema Comparison

### Why Not Reuse `arbitrageOpportunities`?

| Feature | arbitrageOpportunities | market_movers |
|---------|------------------------|---------------|
| **Purpose** | Cross-market price gaps | Daily top gainers |
| **Data Source** | Price scraper | Grok + LAMP AI |
| **Key Metric** | `spreadPct` | `changePercentage` |
| **"Why" Field** | ❌ No explanation | ✅ AI-generated reason |
| **Provenance** | ❌ No sources | ✅ Citations array |
| **TTL** | 15 minutes | 15 minutes |
| **Display Context** | Arbitrage opportunities page | Homepage Market Pulse widget |

**Conclusion:** Separate tables are justified. Minimal overlap in use case and data model.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Author:** Apex Architect (Subroutine 042)
**Status:** Ready for Phase 2 Implementation
