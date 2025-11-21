# Apex Intelligence Codebase Exploration - AgentChat Component Guide

## 1. LAMP-Related Components & Locations

### Current Status
- No existing LAMP-specific components found
- No `/api/lamp/` routes exist yet (ready for creation)
- **Ready for implementation** - clean slate with established patterns to follow

### Related Agent Infrastructure
- **Location**: `/home/user/apex-intelligence-center/apps/web/lib/maker/agents/`
  - `arbitrage/` - Micro-agent pattern for arbitrage scanning
  - `fetch-card.ts` - Card fetching agent example
  - `types.ts` - MAKER Framework type definitions
  
- **Pattern**: Multi-Agent Knowledge Ensemble Refinement (MAKER) framework
  - Each agent is a small, focused function
  - Chainable agents for complex workflows
  - Uses Zod for schema validation

### Dialog/Modal Components
- **Research Dialog**: `/home/user/apex-intelligence-center/apps/web/src/components/research/ResearchDialog.tsx`
  - Full-featured modal with SSE streaming
  - Error handling with retry logic
  - Real-time price deltas integration
  - ~670 lines - excellent reference implementation

---

## 2. Styling Patterns (PS5-Dark Theme with Cyan/Purple Gradients)

### Tailwind Configuration
**File**: `/home/user/apex-intelligence-center/apps/web/tailwind.config.js`

```javascript
colors: {
  ink: '#0A0E1A',        // PS5-dark base color
  magenta: { 500: '#FF00FF' },
  cyan: { 400: '#00D9FF', 500: '#00D9FF' },
  purple: { 500: '#9333EA' }
}

animation: {
  float: 'float 3s ease-in-out infinite'
}
```

### Common Styling Patterns in Components

**Dark Modal Background**:
```tailwind
bg-ink/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-400/10
```

**Button Styles** (Cyan gradient):
```tailwind
bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 text-cyan-400
```

**Content Cards**:
```tailwind
rounded-xl border border-cyan-500/20 overflow-hidden 
hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 
bg-black/40 backdrop-blur-sm
```

**Error Banners**:
```tailwind
bg-red-500/20 border border-red-500/50 text-red-400
```

**Info/Success States**:
```tailwind
bg-green-500/20 border border-green-500/50
```

### Typography & Spacing
- Base text: `text-white` with opacity variants (e.g., `text-white/70`, `text-white/50`)
- Borders: Use opacity (`border-white/10`, `border-cyan-500/20`)
- Rounded: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`
- Spacing: Standard Tailwind (p-4, p-6, mt-6, gap-2, gap-4, gap-6)

### Animation Libraries
- **Framer Motion**: `motion`, `AnimatePresence` for smooth dialogs
- **Lucide React**: Icons (X, Send, Loader2, TrendingUp, TrendingDown)

---

## 3. API Routes Under `/api/lamp/` (Ready to Create)

### Existing Pattern to Follow: Research API
**Reference**: `/home/user/apex-intelligence-center/apps/web/src/app/api/research/route.ts`

Structure:
```
/api/research          → POST with JSON or SSE response
/api/research/ws       → WebSocket-style SSE with query param
/api/research/mock-prices → Mock data endpoint
```

### Real-Time Streaming APIs (SSE Pattern)

**Three Production Examples**:

1. **`/api/realtime/route.ts`** - Price updates (most relevant)
   - ReadableStream with EventSource
   - Redis pub/sub ready (mocked in current version)
   - Keep-alive heartbeat (15s)
   - JWT authentication
   - Rate limiting per subscription tier

2. **`/api/research/ws/route.ts`** - WebSocket simulation via SSE
   - SessionId query parameter
   - Price delta polling from Redis keys
   - 20s heartbeat
   - Automatic cleanup on disconnect

3. **`/api/watchlist/stream/route.ts`** - User watchlist updates
   - Redis subscriber pattern
   - Per-card channel subscriptions
   - 30s heartbeat

### Recommended `/api/lamp/` Structure

```
/api/lamp/
├── chat/route.ts          → POST: initiate LAMP conversation, GET: SSE stream
├── session/route.ts       → GET: create session, DELETE: close session
├── message/route.ts       → POST: send message, GET: fetch history
└── tools/route.ts         → GET: available tools, POST: execute tool
```

### Key Implementation Details for LAMP Routes

**Headers for SSE**:
```typescript
{
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',  // Disable nginx buffering
}
```

**Event Format**:
```
event: message-type\ndata: {JSON payload}\n\n
event: connected\ndata: {...}\n\n
: keepalive\n\n
```

---

## 4. TypeScript Types for Agent Messages

### Core Message Interfaces (Models)

**Location**: `/home/user/apex-intelligence-center/apps/web/src/lib/redis/index.ts`

```typescript
export interface PriceUpdatePayload {
  cardId: string;
  price: number;
  previousPrice?: number;
  changePercent: number;
  timestamp: string;
  source: string;
}

export interface PriceDelta {
  symbol: string;
  priceChange: number;
  percentChange: number;
  timestamp: number;
}
```

### Existing Message Types in Codebase

**From `ResearchDialog.tsx`**:
```typescript
interface Source {
  index: number;
  title: string;
  url: string;
  relevance?: number;  // 0-100
  score?: number;      // 0-1 from API
  sourceType?: string;
}

interface ErrorType = 'rate-limit' | 'stream-interrupted' | 'general' | null
```

### Recommended AgentMessage Types

```typescript
// Base message type
interface AgentMessage {
  id: string;           // UUID
  sessionId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  type: 'text' | 'tool-call' | 'tool-result' | 'error';
  metadata?: {
    toolName?: string;
    toolInput?: Record<string, any>;
    toolOutput?: Record<string, any>;
    timestamp: string;
    latencyMs?: number;
  };
  citations?: Source[];  // Reuse existing Source type
  createdAt: string;
}

// SSE event types
interface AgentMessageEvent {
  event: 'message' | 'tool-started' | 'tool-completed' | 'error' | 'connected';
  data: AgentMessage | ToolEvent | ErrorEvent;
}
```

### User/Auth Types
**From**: `/home/user/apex-intelligence-center/packages/auth/src/types.ts`

```typescript
export interface UserWithTier {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
```

### Database Types for Agent Storage
**From**: `/home/user/apex-intelligence-center/apps/web/src/db/schema.ts`

Pattern to follow for AgentConversation table:
```typescript
export const agent_conversations = pgTable('agent_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  sessionId: uuid('session_id').notNull(),
  tool: text('tool').notNull(),  // e.g., 'lamp', 'research'
  messagesCount: integer('messages_count').default(0),
  lastMessage: timestamp('last_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('idx_conversations_user_created')
    .on(table.userId, table.createdAt),
}));
```

---

## 5. Component Patterns for Real-Time Updates / SSE

### Hook Pattern: useLivePrices
**File**: `/home/user/apex-intelligence-center/apps/web/src/hooks/useLivePrices.ts`

**Pattern Template**:
```typescript
export function useLivePrices({
  sessionId,
  enabled = true,
  onDelta,
}: UseLivePricesOptions) {
  const [deltas, setDeltas] = useState<Map<string, PriceDelta>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    // ... cleanup intervals
  }, []);

  const connect = useCallback(() => {
    // Check feature flag
    if (process.env.NEXT_PUBLIC_FEATURE_LIVE_PRICES !== '1') return;
    
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.addEventListener('price-delta', (event) => {
      const delta: PriceDelta = JSON.parse(event.data);
      setDeltas((prev) => {
        const next = new Map(prev);
        next.set(delta.symbol, delta);
        return next;
      });
    });
    
    eventSource.onerror = () => {
      setIsConnected(false);
      cleanup();
      // Auto-reconnect with exponential backoff
    };
  }, [sessionId, enabled, cleanup]);
  
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);
  
  return { deltas, isConnected, error };
}
```

### Dialog Component Pattern
**File**: `/home/user/apex-intelligence-center/apps/web/src/components/research/ResearchDialog.tsx`

**Key Features**:
- Modal using `motion.div` with `AnimatePresence`
- Backdrop overlay with blur
- Focus trap (Shift+Tab wraps)
- Escape key closes dialog
- SSE streaming with robust parser (handles split markers)
- Error banners with dismiss capability
- Loading states with spinner icon
- Live price deltas displayed in real-time

**SSE Parser Pattern**:
```typescript
const parseSSEStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
  const decoder = new TextDecoder();
  let buffer = '';
  
  // Handle split markers (__SOURCES__, __ERROR__)
  const sourcesMarker = '__SOURCES__';
  const errorMarker = '__ERROR__';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Check for markers and parse accordingly
    const sourcesMarkerIndex = buffer.indexOf(sourcesMarker);
    if (sourcesMarkerIndex !== -1) {
      // Extract answer, mark sources, parse JSON
    }
  }
};
```

### Real-Time Event Integration
**Pattern** (from ResearchDialog):
```typescript
const symbols = useMemo(() => {
  if (!result) return [];
  return extractSymbols(result);  // Parse response for ticker symbols
}, [result]);

const { deltas, isConnected } = useLivePrices({
  sessionId,
  enabled: isOpen && !!result && symbols.length > 0,
});

// Render live prices with icons
{isConnected && (
  <span className="flex items-center gap-1 text-xs text-green-400">
    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
    Live
  </span>
)}
```

### Authentication Pattern
**Used in all APIs**:
```typescript
import { getUserFromRequest } from '@/lib/auth';

const user = await getUserFromRequest(request);
if (!user) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

### Rate Limiting Pattern
**From `/api/realtime/route.ts`**:
```typescript
import { getLimitForTier, ratelimit } from '@/lib/rate-limit';

const limit = getLimitForTier(user.subscriptionTier);
const { success } = await ratelimit(limit, `realtime:${user.id}`, 60);

if (!success) {
  return new NextResponse('Rate limit exceeded', { status: 429 });
}
```

---

## Summary: Ready-to-Use Patterns

### For AgentChat Component

1. **Dialog Structure**: Copy from ResearchDialog (~670 lines)
2. **SSE Streaming**: Use `/api/realtime/route.ts` as template
3. **Real-Time Hook**: Adapt useLivePrices hook pattern
4. **Styling**: Use PS5-dark (ink), cyan-400 accents, borders with cyan-500/20
5. **Message Types**: Define based on Agent Message types above
6. **Error Handling**: 3-tier banners (rate-limit, stream-interrupted, general)
7. **Auth**: getUserFromRequest() middleware pattern
8. **Rate Limiting**: getLimitForTier() + ratelimit() functions

### File Locations to Reference
- Component example: `/home/user/apex-intelligence-center/apps/web/src/components/research/ResearchDialog.tsx`
- SSE API example: `/home/user/apex-intelligence-center/apps/web/src/app/api/realtime/route.ts`
- Hook pattern: `/home/user/apex-intelligence-center/apps/web/src/hooks/useLivePrices.ts`
- Styling: `/home/user/apex-intelligence-center/apps/web/tailwind.config.js`
- Types: `/home/user/apex-intelligence-center/apps/web/lib/redis/index.ts`

### Create These Files
1. `/api/lamp/chat/route.ts` - Main chat SSE endpoint
2. `/src/components/lamp/AgentChat.tsx` - Chat component
3. `/src/hooks/useAgentChat.ts` - Chat hook with SSE
4. `/src/lib/lamp/types.ts` - Message interfaces
