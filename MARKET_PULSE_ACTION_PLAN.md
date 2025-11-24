# Market Pulse - Immediate Action Plan

**Session ID:** claude/architecture-scalability-analysis-01MJJ2xoG36zqHnATay7UoF9
**Status:** Architecture Complete → Ready for Phase 2 Implementation
**Priority:** Medium
**Date:** 2025-11-24

---

## Quick Links

📋 **Full Architecture:** [docs/MARKET_PULSE_ARCHITECTURE.md](./docs/MARKET_PULSE_ARCHITECTURE.md)
🗃️ **Database Schema:** [apps/web/src/db/schema.ts](./apps/web/src/db/schema.ts)
🔧 **Migration Files:** [apps/web/drizzle/](./apps/web/drizzle/)

---

## Current State

✅ **Completed:**
- Comprehensive architectural blueprint documented
- Database schema designed (`market_movers` table)
- Integration points analyzed (market_knowledge, manipulationAlerts, arbitrageOpportunities)
- Data flow architecture mapped (Phase 1 → Phase 2)
- API endpoint specifications defined

⏳ **Pending:**
- MarketPulse.tsx component completion (GPT agent)
- Database migration execution (Manus agent)
- API endpoint implementation
- Grok crawler integration

---

## Phase 1: UI Build (Current - Static Data)

**Owner:** GPT Agent
**Timeline:** Immediate
**Deliverable:** Working `MarketPulse.tsx` component with hardcoded data

### Requirements Checklist
- [ ] Component accepts `dataSource` prop: `'static' | 'api'`
- [ ] Displays 5 market movers with:
  - Card name + set name
  - Current price (formatted: "$2000+")
  - Change percentage (formatted: "+45.2%")
  - "Why" explanation (2-3 sentences)
  - Sources citation (max 3 sources)
- [ ] "Last Updated" timestamp (hidden in Phase 1, shown in Phase 2)
- [ ] Manipulation warning icon (⚠️) when `isManipulated === true`
- [ ] Responsive design (mobile + desktop)
- [ ] Loading state (Suspense boundary)
- [ ] Error fallback UI

### Static Data Structure (From Grok)
```typescript
const staticMovers = [
  {
    rank: 1,
    cardName: "Charizard 1st Edition",
    setName: "Base Set",
    currentPrice: 2000,
    changePercentage: 47.2,
    reason: "Meta deck usage in recent tournament...",
    sources: ["TCGPlayer", "Reddit r/pkmntcg", "Twitter @PokeInvestor"],
    isManipulated: false,
  },
  // ... 4 more
];
```

---

## Phase 2: Production Integration (After UI Validation)

### Step 1: Database Migration

**Owner:** Manus Agent
**Prerequisites:** Phase 1 UI completed and validated

#### Tasks
1. **Add schema to codebase:**
   ```bash
   # Location: apps/web/src/db/schema.ts
   # Add the market_movers table definition from architecture doc
   ```

2. **Generate migration:**
   ```bash
   cd apps/web
   pnpm drizzle-kit generate
   # Expected output: drizzle/0027_market_movers.sql
   ```

3. **Review migration:**
   - Check for conflicts with existing tables
   - Verify indexes are created
   - Confirm foreign key constraints
   - Test rollback script

4. **Deploy migration:**
   ```bash
   # Staging first
   DATABASE_URL=$STAGING_DATABASE_URL pnpm drizzle-kit migrate

   # Verify in staging
   psql $STAGING_DATABASE_URL -c "\d market_movers"

   # Production deployment
   pnpm db:push
   ```

5. **Verify deployment:**
   ```sql
   -- Check table exists
   SELECT * FROM market_movers LIMIT 1;

   -- Check indexes
   SELECT indexname, indexdef FROM pg_indexes
   WHERE tablename = 'market_movers';
   ```

---

### Step 2: API Endpoint Implementation

**Owner:** Backend Team
**Timeline:** 2-3 days after migration

#### Endpoint 1: Query API (Public)

**File:** `apps/web/src/app/api/market-movers/route.ts`

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1-minute cache

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketMovers, cards } from '@/db/schema';
import { gt, asc } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  return Sentry.startSpan({ name: 'api.market-movers' }, async (span) => {
    try {
      const now = new Date();

      // Fetch active movers (not expired)
      const movers = await db.query.marketMovers.findMany({
        where: gt(marketMovers.expiresAt, now),
        orderBy: asc(marketMovers.rank),
        limit: 5,
        with: {
          card: true, // Join with cards table
        },
      });

      if (movers.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active market movers found',
        }, { status: 404 });
      }

      const lastMover = movers[0];

      return NextResponse.json({
        success: true,
        data: movers.map(m => ({
          id: m.id,
          rank: m.rank,
          card: {
            id: m.card.id,
            name: m.card.name,
            setName: m.card.setName,
            game: m.card.game,
          },
          currentPrice: m.currentPrice,
          changePercentage: m.changePercentage,
          reason: m.reason,
          sources: m.sources,
          sentiment: m.sentiment,
          isManipulated: m.isManipulated,
          fetchedAt: m.fetchedAt.toISOString(),
        })),
        lastUpdated: lastMover.fetchedAt.toISOString(),
        expiresAt: lastMover.expiresAt.toISOString(),
      });
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch market movers',
      }, { status: 500 });
    }
  });
}
```

**Testing:**
```bash
curl http://localhost:3000/api/market-movers
# Expected: 200 OK with 5 movers or 404 if no data
```

---

#### Endpoint 2: Ingestion API (Private)

**File:** `apps/web/src/app/api/market-movers/ingest/route.ts`

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketMovers, cards, manipulationAlerts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.MARKET_MOVERS_API_KEY;

export async function POST(request: NextRequest) {
  // Authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { movers, fetchedAt } = body;

    if (!movers || !Array.isArray(movers) || movers.length !== 5) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload: movers must be array of 5 items',
      }, { status: 400 });
    }

    const insertedIds: string[] = [];
    const expiresAt = new Date(new Date(fetchedAt).getTime() + 15 * 60 * 1000);

    for (let i = 0; i < movers.length; i++) {
      const mover = movers[i];

      // Lookup card ID
      const card = await db.query.cards.findFirst({
        where: and(
          eq(cards.name, mover.cardName),
          eq(cards.setName, mover.setName || '')
        ),
      });

      if (!card) {
        console.warn(`Card not found: ${mover.cardName} (${mover.setName})`);
        continue;
      }

      // Check for manipulation alerts
      const alerts = await db.query.manipulationAlerts.findMany({
        where: and(
          eq(manipulationAlerts.cardId, card.id),
          eq(manipulationAlerts.isActive, true)
        ),
      });

      const isManipulated = alerts.length > 0;

      // Insert market mover
      const [inserted] = await db.insert(marketMovers).values({
        id: uuidv4(),
        cardId: card.id,
        rank: i + 1,
        currentPrice: mover.currentPrice,
        changePercentage: mover.changePercentage,
        reason: mover.reason,
        sources: mover.sources,
        sentiment: mover.sentiment || 'neutral',
        isManipulated,
        fetchedAt: new Date(fetchedAt),
        expiresAt,
        metadata: {},
      }).returning({ id: marketMovers.id });

      insertedIds.push(inserted.id);
    }

    return NextResponse.json({
      success: true,
      inserted: insertedIds.length,
      ids: insertedIds,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({
      success: false,
      error: 'Ingestion failed',
    }, { status: 500 });
  }
}
```

**Environment Variables:**
```bash
# Generate API key
openssl rand -hex 32

# Add to Vercel
vercel env add MARKET_MOVERS_API_KEY
```

**Testing:**
```bash
curl -X POST http://localhost:3000/api/market-movers/ingest \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "movers": [...],
    "fetchedAt": "2025-11-24T12:00:00Z"
  }'
```

---

### Step 3: Component Integration

**Owner:** GPT Agent
**Timeline:** 1 day after API deployment

#### Tasks
1. **Update MarketPulse.tsx to use API:**
   ```typescript
   'use client';

   import { useEffect, useState } from 'react';

   export default function MarketPulse({ dataSource = 'api' }) {
     const [movers, setMovers] = useState([]);
     const [lastUpdated, setLastUpdated] = useState('');
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       if (dataSource === 'api') {
         fetch('/api/market-movers')
           .then(res => res.json())
           .then(data => {
             if (data.success) {
               setMovers(data.data);
               setLastUpdated(data.lastUpdated);
             } else {
               setError(data.error);
             }
           })
           .catch(err => setError(err.message))
           .finally(() => setLoading(false));
       } else {
         // Use static data
         setMovers(staticMovers);
         setLoading(false);
       }
     }, [dataSource]);

     if (loading) return <LoadingState />;
     if (error) return <ErrorState error={error} />;

     return (
       <div>
         <h2>Market Pulse</h2>
         {lastUpdated && <p>Last Updated: {formatTimestamp(lastUpdated)}</p>}
         {movers.map((mover, idx) => (
           <MoverCard key={idx} mover={mover} />
         ))}
       </div>
     );
   }
   ```

2. **Add feature flag:**
   ```typescript
   // In page.tsx or layout
   const enableAPI = process.env.NEXT_PUBLIC_ENABLE_MARKET_MOVERS_API === 'true';

   <MarketPulse dataSource={enableAPI ? 'api' : 'static'} />
   ```

3. **Test both modes:**
   - Static mode: Verify hardcoded data displays correctly
   - API mode: Verify live data fetches and updates

---

### Step 4: Grok Crawler Integration (External)

**Owner:** External Team / Grok Integration
**Timeline:** Parallel with API implementation

#### Crawler Requirements
- **Language:** Python or Node.js
- **Frequency:** Every 15 minutes
- **Data Sources:**
  - Price APIs (TCGPlayer, JustTCG)
  - LAMP sentiment (market_knowledge table)
  - Population reports (PSA/BGS)
  - Social signals (Reddit, Twitter)

#### Sample Script (Python)
```python
import requests
import os
from datetime import datetime

API_KEY = os.getenv('MARKET_MOVERS_API_KEY')
API_URL = 'https://apex-intelligence.vercel.app/api/market-movers/ingest'

def fetch_top_movers():
    # TODO: Implement scraping logic
    # 1. Query price APIs for 24h % changes
    # 2. Sort by % gain descending
    # 3. Take top 5
    # 4. For each, query LAMP for "why"
    return [
        {
            "cardName": "Charizard 1st Edition",
            "setName": "Base Set",
            "currentPrice": 2000,
            "changePercentage": 47.2,
            "reason": "...",
            "sources": ["TCGPlayer", "Reddit"],
            "sentiment": "bullish"
        },
        # ... 4 more
    ]

def ingest_movers(movers):
    response = requests.post(
        API_URL,
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'movers': movers,
            'fetchedAt': datetime.utcnow().isoformat()
        }
    )
    return response.json()

if __name__ == '__main__':
    movers = fetch_top_movers()
    result = ingest_movers(movers)
    print(f"Ingested {result['inserted']} movers")
```

#### Cron Schedule
```bash
# Run every 15 minutes
*/15 * * * * python3 /path/to/grok_crawler.py >> /var/log/market-movers.log 2>&1
```

---

## Environment Variables Checklist

### Development
```bash
# .env.local
DATABASE_URL=postgresql://...
MARKET_MOVERS_API_KEY=your_api_key_here
NEXT_PUBLIC_ENABLE_MARKET_MOVERS_API=false  # Start with static
```

### Production (Vercel)
```bash
vercel env add DATABASE_URL
vercel env add MARKET_MOVERS_API_KEY
vercel env add NEXT_PUBLIC_ENABLE_MARKET_MOVERS_API  # Set to 'true' after validation
```

---

## Testing Strategy

### Phase 1 (Static UI)
- [ ] Visual regression tests (Percy/Chromatic)
- [ ] Mobile responsiveness (iPhone SE, iPad, Desktop)
- [ ] Loading states render correctly
- [ ] Error states display fallback UI

### Phase 2 (API Integration)
- [ ] Unit tests for API routes (`/ingest`, `/movers`)
- [ ] Integration tests for database queries
- [ ] End-to-end tests (Playwright)
  - [ ] Empty state (no data in DB)
  - [ ] Success state (5 movers displayed)
  - [ ] Stale data handling (expired movers)
  - [ ] Manipulation warning display

### Performance Tests
- [ ] API latency < 50ms (p95)
- [ ] Query execution < 5ms
- [ ] Component render < 100ms

---

## Rollout Plan

### Week 1: Phase 1 (Static UI)
- **Day 1-2:** UI component build (GPT agent)
- **Day 3:** Code review + QA
- **Day 4:** Merge to main
- **Day 5:** Deploy to production (static data only)
- **Day 6-7:** User feedback collection

### Week 2: Phase 2 (API Integration)
- **Day 1:** Database migration (Manus agent)
- **Day 2-3:** API endpoint implementation
- **Day 4:** Component integration (API mode)
- **Day 5:** Grok crawler setup
- **Day 6:** Staging validation
- **Day 7:** Production rollout (feature flag enabled)

### Week 3: Monitoring & Optimization
- **Day 1-7:** Monitor error rates, latency, user engagement
- **Adjustments:** Tweak TTL, ingestion frequency, manipulation thresholds

---

## Monitoring & Alerts

### Sentry Dashboards
- **API Errors:** `/api/market-movers/*` error rate
- **Database Queries:** Slow query alerts (> 100ms)
- **Ingestion Failures:** Track failed POST requests

### Vercel Analytics
- **Page Views:** `/market` page traffic
- **Engagement:** Click-through rate to card detail pages
- **Performance:** Core Web Vitals (LCP, FID, CLS)

### Alerts
```yaml
- name: Market Movers Ingestion Failure
  condition: No data ingested in 30 minutes
  action: Send alert to #engineering-alerts

- name: API Latency High
  condition: p95 latency > 200ms
  action: Send alert to #performance-alerts

- name: Empty Market Movers
  condition: GET /api/market-movers returns 404 for > 1 hour
  action: Send alert to #product-alerts
```

---

## Success Criteria

### Technical
- [x] Architecture documented (✅ Complete)
- [ ] Database schema deployed
- [ ] API endpoints live (200 OK responses)
- [ ] Query latency < 50ms (p95)
- [ ] Ingestion success rate > 99.5%
- [ ] Zero breaking changes to existing tables

### Product
- [ ] Market page bounce rate: -20%
- [ ] Time on page: +30 seconds
- [ ] Click-through rate to cards: > 15%
- [ ] User survey: "Market Pulse helpful" > 80% agree

---

## Rollback Plan

If production issues occur after Phase 2 deployment:

1. **Immediate (< 5 minutes):**
   ```bash
   # Disable API mode
   vercel env rm NEXT_PUBLIC_ENABLE_MARKET_MOVERS_API
   vercel --prod
   ```

2. **Database Rollback (if needed):**
   ```bash
   # Run rollback migration
   psql $DATABASE_URL -f drizzle/rollback/0027_market_movers_down.sql
   ```

3. **Communication:**
   - Post in #engineering-updates
   - Update status page (if user-facing)
   - Log incident in Sentry

---

## Next Actions (Immediate)

### For Orchestrator (GPT)
1. Review this action plan with team
2. Assign Phase 1 UI build to GPT agent
3. Schedule checkpoint after Phase 1 completion

### For GPT Agent
1. Start `MarketPulse.tsx` component build
2. Use static data structure from architecture doc
3. Implement all checklist items (manipulation warnings, loading states, etc.)
4. Create PR with title: "feat: Market Pulse UI (Phase 1 - Static Data)"

### For Manus Agent
1. **Stand by** - Wait for Phase 1 completion signal
2. Prepare migration files based on schema in architecture doc
3. Review checklist in this document for migration steps

---

**Status:** Ready for execution
**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Contact:** Architecture Team (Subroutine 042)
