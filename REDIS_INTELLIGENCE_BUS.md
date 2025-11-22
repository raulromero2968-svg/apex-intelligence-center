# Redis Intelligence Bus

Complete Redis-based intelligence processing system for Apex Intelligence, powered by Upstash Redis + BullMQ.

## 🏗️ Architecture

The Intelligence Bus provides three core capabilities:

1. **Background Job Processing** (BullMQ Queues)
   - VARC Queue: Value-at-Risk calculations
   - LAMP Queue: Liquidity Analysis & Market Positioning
   - Contrarian Queue: Sentiment & counter-trend analysis

2. **Real-Time Streaming** (Redis Pub/Sub)
   - Simulation progress updates
   - Analysis results broadcasting
   - Market alerts and notifications

3. **Connection Pooling** (IORedis)
   - Shared connections for queue operations
   - Dedicated connections for pub/sub
   - Production-optimized for Upstash with TLS

## 📁 File Structure

```
apps/web/lib/
├── queue.ts              # BullMQ queue configuration
├── pubsub.ts             # Redis pub/sub for real-time streaming
└── workers.example.ts    # Example worker implementations

docker-compose.override.yml  # Local Redis for development
.env.example                 # Environment variables
```

## 🚀 Quick Start

### Development (Local Redis)

1. **Start Local Redis**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - Redis 7.4 on `localhost:6379`
   - BullBoard (Queue UI) on `http://localhost:3001`
   - Redis Commander on `http://localhost:8081` (admin/apex2025)

2. **Configure Environment**
   ```bash
   # .env.local
   REDIS_URL=redis://localhost:6379
   INTELLIGENCE_BUS_CONCURRENCY=5
   INTELLIGENCE_BUS_RATE_LIMIT=10
   INTELLIGENCE_BUS_JOB_TIMEOUT=300000
   ```

3. **Initialize Intelligence Bus**
   ```typescript
   import { initializeIntelligenceBus } from './lib/queue';
   import { initializePubSub } from './lib/pubsub';

   await initializeIntelligenceBus();
   await initializePubSub();
   ```

### Production (Upstash Redis)

1. **Create Upstash Redis Database**
   - Go to [console.upstash.com](https://console.upstash.com)
   - Create new Redis database
   - Enable TLS
   - Copy connection details

2. **Configure Environment**
   ```bash
   # Production .env
   REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379
   UPSTASH_REDIS_REST_URL=https://HOST.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
   ```

3. **Deploy Workers**
   - Deploy `workers.example.ts` as a separate service
   - Run on background process or serverless function
   - Scale workers independently from web app

## 📊 Queue Operations

### Adding Jobs to Queues

#### VARC Queue - Value-at-Risk

```typescript
import { queueVaRCalculation } from './lib/queue';

await queueVaRCalculation({
  portfolioId: 'user-123-portfolio',
  holdings: [
    { cardId: 'psa-10-charizard', quantity: 5, costBasis: 500 },
    { cardId: 'bgs-10-black-lotus', quantity: 1, costBasis: 50000 },
  ],
  confidenceLevel: 0.95, // 95% VaR
  timeHorizon: 30, // 30-day horizon
});
```

#### LAMP Queue - Liquidity Analysis

```typescript
import { queueLiquidityAnalysis } from './lib/queue';

await queueLiquidityAnalysis({
  cardId: 'psa-10-charizard',
  marketDepth: true,
  spreadAnalysis: true,
  volumeProfile: true,
});
```

#### Contrarian Queue - Signal Detection

```typescript
import { queueContrarianAnalysis } from './lib/queue';

await queueContrarianAnalysis({
  game: 'pokemon',
  signalType: 'sentiment',
  threshold: 0.7,
  lookbackDays: 30,
});
```

### Processing Jobs (Workers)

```typescript
import { createIntelligenceWorker, VaRCJobData } from './lib/queue';

const varcWorker = createIntelligenceWorker<VaRCJobData, any>(
  'intelligence:varc',
  async (job) => {
    console.log(`Processing VaR for ${job.data.portfolioId}`);

    // Your calculation logic here
    const var95 = calculateVaR(job.data);

    // Update progress
    await job.updateProgress(100);

    return { portfolioId: job.data.portfolioId, var95 };
  }
);
```

## 📡 Real-Time Streaming

### Publishing Updates

```typescript
import {
  publishSimulationProgress,
  publishVaRCResult,
  publishPriceAlert,
} from './lib/pubsub';

// Simulation progress
await publishSimulationProgress('sim-123', {
  progress: 45,
  currentStep: 'Running Monte Carlo',
  totalSteps: 10,
  elapsed: 45000,
  estimatedRemaining: 55000,
});

// VARC result
await publishVaRCResult('portfolio-456', {
  var95: 15000,
  var99: 22000,
  expectedShortfall: 18000,
  confidenceLevel: 0.95,
  timeHorizon: 30,
});

// Price alert
await publishPriceAlert('card-789', {
  name: 'PSA 10 Charizard',
  price: 5500,
  previousPrice: 5000,
  changePercent: 10,
  threshold: 5,
});
```

### Subscribing to Updates

```typescript
import { subscribe, subscribeToSimulation, subscribeToAlerts } from './lib/pubsub';

// Subscribe to specific simulation
const unsubscribe = await subscribeToSimulation(
  'sim-123',
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
  },
  (result) => {
    console.log('Simulation complete:', result);
  }
);

// Subscribe to all alerts
await subscribeToAlerts((channel, alert) => {
  console.log(`Alert from ${channel}:`, alert);
});

// Unsubscribe when done
await unsubscribe();
```

### Streaming with Async Iterators

```typescript
import { streamMessages } from './lib/pubsub';

// Stream all simulation updates
for await (const { channel, message } of streamMessages('simulation:*', true)) {
  console.log(`[${channel}]`, message);

  if (message.status === 'completed') {
    break;
  }
}
```

## 🔍 Monitoring & Debugging

### Health Checks

```typescript
import { checkIntelligenceBusHealth } from './lib/queue';
import { checkPubSubHealth } from './lib/pubsub';

// Check queue health
const queueHealth = await checkIntelligenceBusHealth();
console.log('Queue Status:', queueHealth);

// Check pub/sub health
const pubsubHealth = await checkPubSubHealth();
console.log('Pub/Sub Status:', pubsubHealth);
```

### Queue Dashboard (BullBoard)

Access the web UI at `http://localhost:3001` to:
- View job status (waiting, active, completed, failed)
- Retry failed jobs
- Monitor queue metrics
- View job details and logs

### Redis Commander

Access Redis GUI at `http://localhost:8081`:
- **Username:** admin
- **Password:** apex2025

Browse keys, monitor pub/sub channels, and debug data.

## 📦 Job Data Structures

### VARC Job

```typescript
interface VaRCJobData {
  portfolioId: string;
  holdings: Array<{
    cardId: string;
    quantity: number;
    costBasis: number;
  }>;
  confidenceLevel?: number; // Default: 0.95
  timeHorizon?: number; // Days, default: 30
}
```

### LAMP Job

```typescript
interface LAMPJobData {
  cardId: string;
  marketDepth?: boolean;
  spreadAnalysis?: boolean;
  volumeProfile?: boolean;
}
```

### Contrarian Job

```typescript
interface ContrarianJobData {
  game: 'pokemon' | 'yugioh' | 'mtg' | 'onepiece' | 'lorcana' | 'fab' | 'digimon';
  signalType: 'sentiment' | 'technical' | 'fundamental';
  threshold?: number; // Default: 0.7
  lookbackDays?: number; // Default: 30
}
```

## 🛡️ Production Best Practices

### Connection Pooling

```typescript
// ✅ Good - Reuse shared connection
import { getRedisConnection } from './lib/queue';
const redis = getRedisConnection();

// ❌ Bad - Creating new connections everywhere
import IORedis from 'ioredis';
const redis = new IORedis(process.env.REDIS_URL);
```

### Graceful Shutdown

```typescript
import { shutdownIntelligenceBus } from './lib/queue';
import { shutdownPubSub } from './lib/pubsub';

process.on('SIGTERM', async () => {
  await shutdownIntelligenceBus();
  await shutdownPubSub();
  process.exit(0);
});
```

### Error Handling

```typescript
// Jobs automatically retry with exponential backoff
const worker = createIntelligenceWorker('intelligence:varc', async (job) => {
  try {
    // Your logic here
    return result;
  } catch (error) {
    // Log error - BullMQ will retry automatically
    console.error('Job failed:', error);
    throw error; // Throw to trigger retry
  }
});
```

### Rate Limiting

Default: 10 jobs/second per worker. Configure in queue options:

```typescript
const worker = createIntelligenceWorker(
  'intelligence:varc',
  processor,
  {
    limiter: {
      max: 20, // 20 jobs per second
      duration: 1000,
    },
  }
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint | - |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth token | - |
| `INTELLIGENCE_BUS_CONCURRENCY` | Worker concurrency | `5` |
| `INTELLIGENCE_BUS_RATE_LIMIT` | Max jobs/second | `10` |
| `INTELLIGENCE_BUS_JOB_TIMEOUT` | Job timeout (ms) | `300000` |

### Queue Options

```typescript
const customQueue = new Queue('custom', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 5, // Retry up to 5 times
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s, 8s, 16s
    },
    timeout: 600000, // 10 minutes
    removeOnComplete: 50, // Keep last 50 completed
    removeOnFail: 200, // Keep last 200 failed
  },
});
```

## 🚨 Troubleshooting

### Connection Issues

```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping
# Expected: PONG

# Check Redis logs
docker-compose logs -f redis

# Verify connection from Node.js
node -e "const IORedis = require('ioredis'); const r = new IORedis('redis://localhost:6379'); r.ping().then(console.log)"
```

### Queue Not Processing

1. Check workers are running
2. Verify Redis connection
3. Check BullBoard for stuck jobs
4. Review worker logs

### Pub/Sub Not Working

1. Verify publisher and subscriber are separate connections
2. Check channel names match exactly
3. Use Redis Commander to monitor pub/sub channels
4. Test with `redis-cli SUBSCRIBE channel-name`

## 📚 Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [IORedis Documentation](https://github.com/redis/ioredis)
- [Upstash Redis](https://upstash.com/docs/redis)
- [Redis Pub/Sub Guide](https://redis.io/docs/manual/pubsub/)

## 🎯 Next Steps

1. **Implement Real Workers**: Replace example workers with actual analysis logic
2. **Add Monitoring**: Integrate with Sentry/Datadog for production monitoring
3. **Scale Workers**: Deploy multiple worker instances for high throughput
4. **Add Tests**: Create integration tests for queue operations
5. **Optimize**: Tune concurrency and rate limits based on workload

---

Built with ❤️ for Apex Intelligence
