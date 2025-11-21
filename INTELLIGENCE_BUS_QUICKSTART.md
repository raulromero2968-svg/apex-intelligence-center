# Intelligence Bus - Quick Start Guide

Get started with the Redis Intelligence Bus in 5 minutes.

## 🚀 Setup

### 1. Start Local Redis

```bash
# From project root
cd apps/web
pnpm redis:start
```

This starts:
- **Redis** on `localhost:6379`
- **BullBoard** (Queue UI) on `http://localhost:3001`
- **Redis Commander** on `http://localhost:8081`

### 2. Configure Environment

```bash
# Create .env.local
echo "REDIS_URL=redis://localhost:6379" >> .env.local
```

### 3. Verify Connection

```bash
pnpm intelligence:health
```

Expected output:
```json
{
  "healthy": true,
  "queues": {
    "varc": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "lamp": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "contrarian": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 }
  }
}
```

## 📊 Usage Examples

### Queue a VaR Calculation

```typescript
import { queueVaRCalculation } from '@/lib/queue';

await queueVaRCalculation({
  portfolioId: 'user-123',
  holdings: [
    { cardId: 'charizard-psa10', quantity: 5, costBasis: 500 },
    { cardId: 'black-lotus-bgs10', quantity: 1, costBasis: 50000 },
  ],
  confidenceLevel: 0.95,
  timeHorizon: 30,
});
```

### Subscribe to Results

```typescript
import { subscribe, PubSubChannels } from '@/lib/pubsub';

await subscribe(
  PubSubChannels.varcResult('user-123'),
  (channel, result) => {
    console.log('VaR Result:', result);
    // { var95: 15000, var99: 22000, expectedShortfall: 18000 }
  }
);
```

### Run Worker (Process Jobs)

```bash
# Terminal 1: Start workers
pnpm workers:example

# Terminal 2: Queue jobs via API or script
```

## 🔍 Monitoring

### View Queue Dashboard

```bash
# Open BullBoard
open http://localhost:3001
```

### View Redis Data

```bash
# Open Redis Commander
open http://localhost:8081
# Login: admin / apex2025
```

### Check Logs

```bash
pnpm redis:logs
```

## 🧪 Test the Bus

Create a test script:

```typescript
// test-intelligence-bus.ts
import {
  queueVaRCalculation,
  queueLiquidityAnalysis,
  queueContrarianAnalysis,
} from './lib/queue';
import { subscribe, PubSubChannels } from './lib/pubsub';

async function test() {
  // Subscribe to all VARC results
  await subscribe(PubSubChannels.allVarcResults(), (channel, result) => {
    console.log('📊 VARC Result:', result);
  });

  // Queue test job
  console.log('Queueing test VaR calculation...');
  await queueVaRCalculation({
    portfolioId: 'test-portfolio',
    holdings: [
      { cardId: 'test-card-1', quantity: 10, costBasis: 100 },
      { cardId: 'test-card-2', quantity: 5, costBasis: 500 },
    ],
  });

  console.log('✅ Job queued! Check BullBoard: http://localhost:3001');
  console.log('⏳ Start workers with: pnpm workers:example');

  // Keep process alive to receive results
  await new Promise(() => {});
}

test();
```

Run it:
```bash
tsx test-intelligence-bus.ts
```

## 🔄 Complete Workflow

```bash
# 1. Start Redis
pnpm redis:start

# 2. Start workers (Terminal 1)
pnpm workers:example

# 3. Queue jobs (Terminal 2)
tsx your-script.ts

# 4. Monitor (Browser)
open http://localhost:3001

# 5. Stop everything
pnpm redis:stop
```

## 📚 Next Steps

- Read [REDIS_INTELLIGENCE_BUS.md](./REDIS_INTELLIGENCE_BUS.md) for complete documentation
- Check [lib/integration.example.ts](./apps/web/lib/integration.example.ts) for API integration
- Review [lib/workers.example.ts](./apps/web/lib/workers.example.ts) for worker patterns

## 🐛 Troubleshooting

**Redis won't start**
```bash
# Check if port 6379 is in use
lsof -i :6379

# Or use different port
REDIS_URL=redis://localhost:6380 docker-compose up -d
```

**Workers not processing jobs**
```bash
# 1. Check Redis connection
redis-cli -h localhost -p 6379 ping

# 2. Verify workers are running
ps aux | grep workers

# 3. Check BullBoard for errors
open http://localhost:3001
```

**Can't subscribe to channels**
```bash
# Test pub/sub manually
redis-cli
> SUBSCRIBE test:channel

# In another terminal
redis-cli
> PUBLISH test:channel "hello"
```

## 🎯 Common Commands

```bash
# Redis
pnpm redis:start      # Start Redis
pnpm redis:stop       # Stop Redis
pnpm redis:logs       # View logs
pnpm redis:ui         # Show UI URLs

# Workers
pnpm workers:example  # Run example workers

# Health
pnpm intelligence:health  # Check bus health
pnpm intelligence:init    # Initialize bus
```

---

**Ready to build?** Start with the examples in `lib/integration.example.ts` 🚀
