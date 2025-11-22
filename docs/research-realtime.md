# Research Real-Time Price Deltas

WebSocket-based live price updates for the research experience, feature-flagged and safe by default.

## Overview

This feature adds real-time price delta tracking to research answers. When a user receives a research answer that mentions trading card symbols (e.g., "Charizard", "Umbreon"), the UI automatically subscribes to live price updates via WebSocket and displays inline badges showing price changes since the answer was generated.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ ResearchDialog  │──────│  useLivePrices   │──────│  /api/research/ │
│ ResearchPanel   │ SSE  │  Hook (Client)   │ GET  │  ws/route.ts    │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                             │
                                                             │ Redis
                                                             │ Pub/Sub
                                                             │
                                                    ┌────────▼────────┐
                                                    │ Upstash Redis   │
                                                    │ List: research: │
                                                    │ ${sessionId}    │
                                                    └────────▲────────┘
                                                             │
                                                             │ RPUSH
                                                    ┌────────┴────────┐
                                                    │  /api/research/ │
                                                    │  mock-prices    │
                                                    │  /route.ts      │
                                                    └─────────────────┘
```

## Components

### Server-Side

#### `/app/api/research/ws/route.ts`
- **Runtime**: Node.js (required for WebSocket support)
- **Protocol**: Server-Sent Events (SSE) via `text/event-stream`
- **Channel**: `research:${sessionId}`
- **Features**:
  - Heartbeat ping every 20 seconds
  - Clean disconnect handling
  - Redis LPOP polling (1s intervals)
  - Feature-flagged behind `FEATURE_LIVE_PRICES=1`

#### `/app/api/research/mock-prices/route.ts`
- **Environment**: Development/Preview only
- **Purpose**: Testing and local development
- **Parameters**: `?symbols=CHARIZARD,UMBREON&sessionId=xyz`
- **Behavior**:
  - Publishes random price deltas at 1-second intervals
  - Runs for 20 seconds then stops
  - Uses Redis RPUSH to `research:${sessionId}`

### Client-Side

#### `src/hooks/useLivePrices.ts`
Custom React hook for WebSocket connection management:
- **Auto-reconnect**: Exponential backoff (1s → 2s → 4s → max 5s)
- **Heartbeat monitoring**: 25s timeout (server pings every 20s)
- **State management**: Map of symbol → PriceDelta
- **Feature flag**: Checks `NEXT_PUBLIC_FEATURE_LIVE_PRICES=1`

#### `src/lib/research/symbol-extractor.ts`
Extracts trading card symbols from research answers:
- Known symbol matching (Charizard, Pikachu, Mewtwo, etc.)
- Capitalized word extraction (4+ chars)
- Common word filtering
- Confidence scoring based on frequency

#### UI Components
- **ResearchDialog**: Shows live price badges below research results
- **ResearchPanel**: Alternative panel view with live prices
- **Badge colors**:
  - Green: Positive price change
  - Red: Negative price change
  - Gray: No data yet

## Environment Variables

### Required (Server)

```bash
# Upstash Redis (for Pub/Sub)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Feature flag (server-side)
FEATURE_LIVE_PRICES=1
```

### Required (Client)

```bash
# Feature flag (client-side, exposed to browser)
NEXT_PUBLIC_FEATURE_LIVE_PRICES=1
```

## Feature Flags

This feature is **disabled by default** and requires explicit opt-in via environment variables:

| Flag | Side | Required | Default |
|------|------|----------|---------|
| `FEATURE_LIVE_PRICES` | Server | Yes | `undefined` |
| `NEXT_PUBLIC_FEATURE_LIVE_PRICES` | Client | Yes | `undefined` |

**Important**: Both flags must be set to `1` for the feature to work.

## Local Development

### 1. Set Environment Variables

```bash
# .env.local
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
FEATURE_LIVE_PRICES=1
NEXT_PUBLIC_FEATURE_LIVE_PRICES=1
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Test with Mock Publisher

1. Open the research dialog at `http://localhost:3000`
2. Submit a query like "What is the best Pokemon card to invest in?"
3. Once you get a result with symbols (e.g., "Charizard"), note the session ID from the network tab
4. In a new terminal, trigger the mock publisher:

```bash
# Get the sessionId from browser DevTools > Network > research request
curl "http://localhost:3000/api/research/mock-prices?symbols=CHARIZARD,UMBREON,PIKACHU&sessionId=<SESSION_ID>"
```

5. Watch the UI update with live price deltas every second for 20 seconds

## Verifying Locally

### Check WebSocket Connection

1. Open browser DevTools > Network tab
2. Filter by "EventStream" or "ws"
3. Look for `/api/research/ws?sessionId=...`
4. Status should be `200 OK` with `Content-Type: text/event-stream`
5. You should see periodic `ping` events every 20 seconds

### Check Price Delta Events

In DevTools Console:

```javascript
// Subscribe to custom events
const eventSource = new EventSource('/api/research/ws?sessionId=YOUR_SESSION_ID');

eventSource.addEventListener('price-delta', (event) => {
  console.log('Price delta:', JSON.parse(event.data));
});

eventSource.addEventListener('ping', () => {
  console.log('Heartbeat ping received');
});

eventSource.onerror = (error) => {
  console.error('Connection error:', error);
};
```

### Check Redis

```bash
# List all keys
redis-cli -u $UPSTASH_REDIS_REST_URL keys "research:*"

# Check list length for a session
redis-cli -u $UPSTASH_REDIS_REST_URL llen "research:YOUR_SESSION_ID"

# Peek at messages (without removing)
redis-cli -u $UPSTASH_REDIS_REST_URL lrange "research:YOUR_SESSION_ID" 0 -1
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm vitest src/lib/research/symbol-extractor.test.ts
```

### Integration Tests

The integration tests verify:
- Mock publisher event structure
- Price delta parsing
- State management (Map updates)
- Symbol extraction from answers
- XSS prevention

```bash
pnpm vitest src/lib/research/live-prices.test.ts
```

## Security

### XSS Prevention

All user-generated text is escaped before rendering:

1. **ResearchPanel**: Uses `escapeHtml()` utility
2. **React**: Auto-escapes JSX text nodes
3. **Price values**: Clamped to 3 significant digits (numeric only)
4. **Symbol names**: Uppercase-only, filtered against known list

### Feature Flag Safety

- Feature is **OFF by default**
- Requires explicit server AND client flags
- Mock publisher only works in dev/preview (not production)
- WebSocket endpoint returns 404 if flag is disabled

### Rate Limiting

The WebSocket endpoint does not implement rate limiting (relies on SSE connection limit). For production, consider:
- Limiting concurrent connections per IP
- Adding authentication/session validation
- Monitoring Redis Pub/Sub load

## Performance

### Redis Usage

- **LPOP polling**: 1 request/second per active connection
- **RPUSH (mock)**: 1 write/second per active mock publisher
- **Cleanup**: Messages are consumed (LPOP), no manual cleanup needed
- **Max duration**: Mock publisher runs for 20 seconds, then stops

### Client Performance

- **EventSource**: Native browser API, efficient
- **State updates**: React Map (O(1) lookups)
- **Reconnect backoff**: Prevents rapid reconnection storms
- **Heartbeat**: Detects stale connections, triggers reconnect

### Recommendations

- **Production**: Use actual market data feed (not mock publisher)
- **Scaling**: Consider Redis Pub/Sub instead of polling (requires WebSocket, not SSE)
- **Caching**: Store recent deltas in Redis with TTL for reconnecting clients

## Troubleshooting

### WebSocket Won't Connect

1. Check feature flags in `.env.local` and `.env`
2. Verify both server and client flags are set to `1`
3. Restart Next.js dev server after changing env vars
4. Check browser console for errors

### No Price Updates

1. Verify symbols are extracted: Check DevTools > Console for `symbols` array
2. Check WebSocket connection: DevTools > Network > EventStream
3. Trigger mock publisher manually (see "Test with Mock Publisher" above)
4. Check Redis: `redis-cli lrange research:SESSION_ID 0 -1`

### Heartbeat Timeout

- Default: 25s client timeout, 20s server ping interval
- If timeout occurs, client auto-reconnects with exponential backoff
- Check server logs for errors
- Verify Upstash Redis is accessible

### Feature Flag Not Working

```bash
# Server-side flag
echo $FEATURE_LIVE_PRICES  # Should output: 1

# Client-side flag (must restart dev server after changing)
echo $NEXT_PUBLIC_FEATURE_LIVE_PRICES  # Should output: 1

# Verify in browser console
console.log(process.env.NEXT_PUBLIC_FEATURE_LIVE_PRICES);  // Should output: "1"
```

## Production Considerations

### Before Deploying to Production

1. **Replace mock publisher** with real market data feed
2. **Add authentication** to WebSocket endpoint (session validation)
3. **Implement rate limiting** on connections and Redis operations
4. **Monitor Redis usage** (LPOP polling can be expensive at scale)
5. **Consider Redis Pub/Sub** for true publish-subscribe (requires WebSocket upgrade)
6. **Add error tracking** (Sentry integration for WebSocket errors)
7. **Set up alerts** for connection failures, Redis errors, etc.

### Environment Variables in Production

Ensure both flags are set in your deployment platform (Vercel, etc.):

```bash
FEATURE_LIVE_PRICES=1
NEXT_PUBLIC_FEATURE_LIVE_PRICES=1
UPSTASH_REDIS_REST_URL=https://your-production-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-production-token
```

## Limits

- **Max symbols per session**: No hard limit (depends on answer content)
- **Max concurrent connections**: Limited by Upstash Redis plan
- **Price precision**: 3 significant digits (via `toPrecision(3)`)
- **Heartbeat interval**: 20 seconds (server) / 25s timeout (client)
- **Reconnect backoff**: 1s → 2s → 4s → 5s (max)
- **Mock publisher duration**: 20 seconds

## API Reference

### GET `/api/research/ws`

**Query Parameters:**
- `sessionId` (required): Unique session identifier

**Response:**
- Content-Type: `text/event-stream`
- Events:
  - `price-delta`: Price update event
    ```json
    {
      "symbol": "CHARIZARD",
      "priceChange": 12.4,
      "percentChange": 3.7,
      "timestamp": 1700000000000
    }
    ```
  - `ping`: Heartbeat event (no data)
  - `error`: Error event
    ```json
    {
      "error": "Connection error"
    }
    ```

### GET `/api/research/mock-prices`

**Query Parameters:**
- `symbols` (required): Comma-separated list of symbols (e.g., `CHARIZARD,UMBREON`)
- `sessionId` (required): Session ID to publish to

**Response:**
```json
{
  "ok": true,
  "message": "Publishing price deltas for 2 symbols over 20 seconds",
  "symbols": ["CHARIZARD", "UMBREON"],
  "sessionId": "abc-123",
  "channel": "research:abc-123"
}
```

**Restrictions:**
- Only available in `development` or `preview` environments
- Returns `403 Forbidden` in production

## License

MIT
