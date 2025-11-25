/**
 * Mobile Performance Domain Pack
 *
 * RAG knowledge base for React Native performance optimization.
 * Implements knowledge-08-mobile-performance domain integration.
 *
 * Features:
 * - Core knowledge documents for mobile performance
 * - Semantic search across optimization patterns
 * - Prompt templates for LLM-powered assistance
 *
 * @see knowledge-08-mobile-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import {
  mobileKnowledge,
  type MobileKnowledge,
  type NewMobileKnowledge,
} from '@/db/schema/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'concept'
  | 'api_reference'
  | 'code_example'
  | 'best_practice'
  | 'troubleshooting';

export type Category =
  | 'list_optimization'
  | 'render_prevention'
  | 'bridge'
  | 'hermes'
  | 'offline'
  | 'images'
  | 'memory'
  | 'profiling';

export interface KnowledgeQuery {
  query: string;
  category?: Category;
  documentType?: DocumentType;
  platform?: 'ios' | 'android' | 'both';
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

// ============================================================================
// CORE KNOWLEDGE DOCUMENTS
// ============================================================================

export const CORE_KNOWLEDGE: Array<Omit<NewMobileKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'FlatList Performance Optimization',
    content: `FlatList is React Native's virtualized list component for rendering large datasets efficiently.

## Key Props for Performance

1. **windowSize** (default: 21): Number of items rendered outside viewport. Lower = less memory, higher = smoother scrolling.

2. **maxToRenderPerBatch** (default: 10): Max items to render per scroll batch. Reduce for better responsiveness.

3. **updateCellsBatchingPeriod** (default: 50ms): Time between batch renders. Increase for less frequent updates.

4. **removeClippedSubviews**: Unmounts off-screen items (Android). Use cautiously on iOS.

5. **getItemLayout**: Skip measurement for fixed-height items. Major performance boost.

6. **initialNumToRender**: Items to render before first paint. Balance with above-fold content.

## Best Practices

- Always use \`keyExtractor\` with stable IDs
- Memoize \`renderItem\` with \`useCallback\`
- Use \`React.memo\` on item components
- Avoid inline functions/objects in props
- Use \`getItemLayout\` for fixed heights
- Consider \`FlashList\` from Shopify for better performance`,
    documentType: 'best_practice',
    category: 'list_optimization',
    platform: 'both',
    tags: ['flatlist', 'virtualization', 'scrolling', 'lists'],
    relatedTopics: ['render_prevention', 'memory'],
    codeExamples: [
      {
        language: 'typescript',
        code: `const renderItem = useCallback(({ item }) => (
  <MemoizedItem item={item} />
), []);

const keyExtractor = useCallback((item) => item.id, []);

const getItemLayout = useCallback((data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout}
  windowSize={11}
  maxToRenderPerBatch={5}
  removeClippedSubviews={Platform.OS === 'android'}
  initialNumToRender={10}
/>`,
        description: 'Optimized FlatList configuration',
      },
    ],
    rnVersion: '0.70+',
    isVerified: true,
  },
  {
    title: 'React.memo and Memoization Patterns',
    content: `Memoization prevents unnecessary re-renders by caching component output.

## React.memo

Wraps functional components to skip re-render if props haven't changed.

\`\`\`tsx
const MyComponent = React.memo(({ data }) => {
  return <View>{data.name}</View>;
});
\`\`\`

### Custom Comparison

\`\`\`tsx
const MyComponent = React.memo(({ data }) => {
  return <View>{data.name}</View>;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
\`\`\`

## useMemo

Memoize expensive calculations:

\`\`\`tsx
const sortedItems = useMemo(() =>
  items.sort((a, b) => a.price - b.price),
  [items]
);
\`\`\`

## useCallback

Memoize functions to maintain referential equality:

\`\`\`tsx
const handlePress = useCallback((id) => {
  navigation.navigate('Detail', { id });
}, [navigation]);
\`\`\`

## When to Use

- List item components (always)
- Components receiving callback props
- Expensive computations
- Context consumers

## When NOT to Use

- Components that always re-render anyway
- Simple components with primitive props
- Over-memoizing (adds overhead)`,
    documentType: 'concept',
    category: 'render_prevention',
    platform: 'both',
    tags: ['memo', 'useMemo', 'useCallback', 'optimization', 're-renders'],
    relatedTopics: ['list_optimization', 'profiling'],
    codeExamples: [
      {
        language: 'typescript',
        code: `// Card component with proper memoization
interface CardProps {
  card: Card;
  onPress: (id: string) => void;
}

const CardItem = React.memo<CardProps>(({ card, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(card.id);
  }, [card.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{card.name}</Text>
      <Text>{card.price}</Text>
    </TouchableOpacity>
  );
});

// Parent component
function CardList({ cards }) {
  const handleCardPress = useCallback((id: string) => {
    navigation.navigate('CardDetail', { id });
  }, [navigation]);

  const renderCard = useCallback(({ item }) => (
    <CardItem card={item} onPress={handleCardPress} />
  ), [handleCardPress]);

  return (
    <FlatList
      data={cards}
      renderItem={renderCard}
      keyExtractor={card => card.id}
    />
  );
}`,
        description: 'Complete memoization pattern for list items',
      },
    ],
    rnVersion: '0.60+',
    isVerified: true,
  },
  {
    title: 'JS-Native Bridge Optimization',
    content: `The JavaScript-Native bridge is a critical performance bottleneck in React Native.

## How the Bridge Works

1. JS thread serializes data to JSON
2. Data crosses async bridge to native
3. Native deserializes and processes
4. Response follows reverse path

## Performance Issues

- Each crossing has ~5-10ms overhead
- Large payloads increase serialization cost
- High-frequency calls cause queue backup
- Sync calls block the JS thread

## Optimization Strategies

### 1. Batch Operations

\`\`\`tsx
// Bad: Multiple individual calls
items.forEach(item => NativeModule.save(item));

// Good: Single batched call
NativeModule.saveAll(items);
\`\`\`

### 2. Use InteractionManager

\`\`\`tsx
InteractionManager.runAfterInteractions(() => {
  // Heavy native work after animations complete
  NativeModule.processData(data);
});
\`\`\`

### 3. Debounce Frequent Updates

\`\`\`tsx
const debouncedUpdate = useMemo(
  () => debounce(NativeModule.update, 100),
  []
);
\`\`\`

### 4. Use Turbo Modules (New Architecture)

JSI provides synchronous, direct native access without bridge serialization.

## Measuring Bridge Traffic

Use Flipper's "Bridge Traffic" plugin or custom logging:

\`\`\`tsx
// In development
MessageQueue.spy((msg) => {
  console.log('Bridge:', msg);
});
\`\`\``,
    documentType: 'concept',
    category: 'bridge',
    platform: 'both',
    tags: ['bridge', 'native', 'jsi', 'turbo-modules', 'performance'],
    relatedTopics: ['hermes', 'profiling'],
    codeExamples: [
      {
        language: 'typescript',
        code: `import { InteractionManager } from 'react-native';

// Batch API calls
async function syncCards(cards: Card[]) {
  // Wait for animations to complete
  await InteractionManager.runAfterInteractions();

  // Batch the sync operation
  const batches = chunk(cards, 50);

  for (const batch of batches) {
    await NativeCardModule.syncBatch(batch);
    // Allow UI thread to breathe between batches
    await new Promise(r => setTimeout(r, 16));
  }
}

// Debounce real-time updates
const useRealtimePrices = (cardIds: string[]) => {
  const updatePrices = useMemo(
    () => debounce((prices) => {
      NativePriceModule.updatePrices(prices);
    }, 100),
    []
  );

  useEffect(() => {
    const subscription = priceStream.subscribe(updatePrices);
    return () => subscription.unsubscribe();
  }, [cardIds, updatePrices]);
};`,
        description: 'Bridge optimization patterns',
      },
    ],
    rnVersion: '0.68+',
    isVerified: true,
  },
  {
    title: 'Hermes Engine Configuration',
    content: `Hermes is Facebook's JavaScript engine optimized for React Native.

## Benefits

- **Faster startup**: AOT compilation to bytecode
- **Lower memory**: Optimized for mobile
- **Smaller bundle**: Bytecode is compact
- **Better GC**: Incremental garbage collection

## Enabling Hermes

### Expo (SDK 48+)

\`\`\`json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
\`\`\`

### Bare React Native

**Android** (android/app/build.gradle):
\`\`\`gradle
project.ext.react = [
    enableHermes: true
]
\`\`\`

**iOS** (Podfile):
\`\`\`ruby
:hermes_enabled => true
\`\`\`

## GC Tuning

Configure garbage collection for your app's memory profile:

\`\`\`
hermesc -O -emit-binary \\
  -max-heap-size=512 \\
  -gc-sanitize-handles=true
\`\`\`

## Debugging with Hermes

1. Use Chrome DevTools via \`hermes-inspector\`
2. Enable source maps for bytecode debugging
3. Use Flipper for integrated debugging

## Limitations

- No JIT compilation (intentional for security)
- Some ES6+ features may need polyfills
- Intl API requires separate package`,
    documentType: 'api_reference',
    category: 'hermes',
    platform: 'both',
    tags: ['hermes', 'javascript', 'engine', 'bytecode', 'startup'],
    relatedTopics: ['bridge', 'memory'],
    codeExamples: [
      {
        language: 'json',
        code: `{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    },
    "plugins": [
      ["expo-build-properties", {
        "android": {
          "enableProguardInReleaseBuilds": true
        }
      }]
    ]
  }
}`,
        description: 'Expo app.json Hermes configuration',
      },
    ],
    rnVersion: '0.70+',
    expoVersion: '48+',
    isVerified: true,
  },
  {
    title: 'Image Optimization Strategies',
    content: `Images are often the largest performance bottleneck in React Native apps.

## expo-image (Recommended)

\`\`\`tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  cachePolicy="memory-disk"
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
\`\`\`

### Cache Policies

- \`none\`: No caching
- \`disk\`: Disk cache only
- \`memory\`: Memory cache only
- \`memory-disk\`: Both (recommended)

## FastImage (Bare RN)

\`\`\`tsx
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.high }}
  style={{ width: 200, height: 200 }}
  resizeMode={FastImage.resizeMode.cover}
/>
\`\`\`

## Best Practices

1. **Resize on server**: Don't load 4K images for thumbnails
2. **Use WebP format**: 30% smaller than JPEG
3. **Lazy load**: Only load visible images
4. **Placeholder strategy**: Use blurhash or skeleton
5. **Preload critical images**: Load hero images early
6. **Recycle images in lists**: Use \`recyclingKey\` prop

## Memory Management

\`\`\`tsx
// Clear cache when needed
Image.clearDiskCache();
Image.clearMemoryCache();

// Prefetch important images
Image.prefetch([url1, url2, url3]);
\`\`\``,
    documentType: 'best_practice',
    category: 'images',
    platform: 'both',
    tags: ['images', 'caching', 'expo-image', 'fastimage', 'optimization'],
    relatedTopics: ['memory', 'list_optimization'],
    codeExamples: [
      {
        language: 'typescript',
        code: `import { Image } from 'expo-image';

// Generate blurhash placeholder on server
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface CardImageProps {
  uri: string;
  width: number;
  height: number;
}

const CardImage = React.memo(({ uri, width, height }: CardImageProps) => (
  <Image
    source={{ uri }}
    style={{ width, height }}
    cachePolicy="memory-disk"
    placeholder={blurhash}
    contentFit="cover"
    transition={200}
    recyclingKey={uri}
  />
));

// Preload card images before showing
async function preloadCardImages(cards: Card[]) {
  const urls = cards.slice(0, 20).map(c => c.imageUrl);
  await Image.prefetch(urls);
}`,
        description: 'expo-image optimization for card images',
      },
    ],
    rnVersion: '0.70+',
    expoVersion: '48+',
    isVerified: true,
  },
  {
    title: 'Memory Management and Leak Prevention',
    content: `Memory leaks cause degraded performance and crashes in React Native apps.

## Common Leak Sources

### 1. Uncleared Timers

\`\`\`tsx
// Bad
useEffect(() => {
  setInterval(fetchData, 5000);
}, []);

// Good
useEffect(() => {
  const id = setInterval(fetchData, 5000);
  return () => clearInterval(id);
}, []);
\`\`\`

### 2. Event Listeners

\`\`\`tsx
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  return () => subscription.remove();
}, []);
\`\`\`

### 3. Async Operations on Unmounted Components

\`\`\`tsx
useEffect(() => {
  let isMounted = true;

  fetchData().then(data => {
    if (isMounted) setData(data);
  });

  return () => { isMounted = false; };
}, []);
\`\`\`

### 4. Closures Capturing State

\`\`\`tsx
// Use refs for values needed in cleanup
const stateRef = useRef(state);
stateRef.current = state;

useEffect(() => {
  return () => {
    // Use ref, not stale closure
    saveState(stateRef.current);
  };
}, []);
\`\`\`

## Detection Tools

1. **Flipper Memory Plugin**: Track allocations
2. **React DevTools Profiler**: Component renders
3. **Xcode Instruments**: iOS memory profiling
4. **Android Studio Profiler**: Android heap analysis

## Best Practices

- Always clean up in useEffect
- Use weak references where applicable
- Monitor memory in CI/CD
- Test on low-memory devices`,
    documentType: 'troubleshooting',
    category: 'memory',
    platform: 'both',
    tags: ['memory', 'leaks', 'cleanup', 'useEffect', 'debugging'],
    relatedTopics: ['profiling', 'render_prevention'],
    codeExamples: [
      {
        language: 'typescript',
        code: `// Custom hook for safe async state updates
function useSafeState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState] as const;
}

// Usage
function CardDetail({ cardId }) {
  const [card, setCard] = useSafeState<Card | null>(null);
  const [loading, setLoading] = useSafeState(true);

  useEffect(() => {
    setLoading(true);
    fetchCard(cardId)
      .then(setCard)
      .finally(() => setLoading(false));
  }, [cardId]);

  return loading ? <Skeleton /> : <CardView card={card} />;
}`,
        description: 'Safe state hook to prevent memory leaks',
      },
    ],
    rnVersion: '0.60+',
    isVerified: true,
  },
  {
    title: 'Offline-First Architecture',
    content: `Building apps that work without network connectivity is essential for mobile.

## Core Principles

1. **Cache First**: Always check cache before network
2. **Optimistic Updates**: Update UI before server confirms
3. **Queue Operations**: Store failed requests for retry
4. **Conflict Resolution**: Handle concurrent modifications

## Data Layer Architecture

\`\`\`
┌─────────────────────────────────────┐
│            UI Layer                 │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│        Repository Layer             │
│  (Decides cache vs network)         │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───┐         ┌─────▼─────┐
│ Cache │         │  Network  │
│ (SQLite/        │   (API)   │
│  MMKV) │         └───────────┘
└────────┘
\`\`\`

## Storage Options

- **AsyncStorage**: Simple key-value, small data
- **MMKV**: Fast key-value, larger data
- **SQLite**: Complex queries, relational data
- **WatermelonDB**: Reactive, SQLite-based

## Sync Strategies

1. **Eager**: Sync immediately when online
2. **Lazy**: Sync on explicit user action
3. **Background**: Periodic sync with BackgroundFetch
4. **On-demand**: Sync when data is accessed`,
    documentType: 'concept',
    category: 'offline',
    platform: 'both',
    tags: ['offline', 'caching', 'sync', 'storage', 'resilience'],
    relatedTopics: ['bridge', 'memory'],
    codeExamples: [
      {
        language: 'typescript',
        code: `import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const storage = new MMKV();

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class OfflineRepository<T> {
  constructor(
    private key: string,
    private fetcher: () => Promise<T>,
    private ttlMs: number = 5 * 60 * 1000
  ) {}

  async get(): Promise<T> {
    // Try cache first
    const cached = this.getFromCache();
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // Check network
    const { isConnected } = await NetInfo.fetch();

    if (isConnected) {
      try {
        const fresh = await this.fetcher();
        this.saveToCache(fresh);
        return fresh;
      } catch (e) {
        // Network failed, use stale cache
        if (cached) return cached.data;
        throw e;
      }
    }

    // Offline: return stale cache or throw
    if (cached) return cached.data;
    throw new Error('No cached data and offline');
  }

  private getFromCache(): CacheEntry<T> | null {
    const json = storage.getString(this.key);
    return json ? JSON.parse(json) : null;
  }

  private saveToCache(data: T) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
    };
    storage.set(this.key, JSON.stringify(entry));
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }
}`,
        description: 'Offline-first repository pattern',
      },
    ],
    rnVersion: '0.68+',
    isVerified: true,
  },
  {
    title: 'Performance Profiling with Flipper',
    content: `Flipper is Facebook's debugging platform for mobile apps.

## Setup

### Expo (Development Build)

\`\`\`bash
npx expo install expo-dev-client
npx expo run:ios  # or run:android
\`\`\`

### Bare React Native

Flipper is included by default. Disable in production:

\`\`\`ruby
# ios/Podfile
flipper_config = ENV['NO_FLIPPER'] == "1" ? FlipperConfiguration.disabled : FlipperConfiguration.enabled
\`\`\`

## Key Plugins

### 1. React DevTools

- Component tree inspection
- Props and state viewing
- Profiler for render performance

### 2. Network

- Request/response inspection
- Mock responses
- Network performance

### 3. Layout

- View hierarchy
- Accessibility info
- Layout debugging

### 4. Databases

- AsyncStorage viewer
- SQLite browser
- Realm inspection

### 5. Hermes Debugger

- JS debugging with Hermes
- Breakpoints and stepping
- Console access

## Performance Plugin

Track:
- FPS graph
- Memory usage
- CPU usage
- Bridge traffic

## Custom Metrics

\`\`\`tsx
import { addPlugin } from 'react-native-flipper';

addPlugin({
  getId: () => 'my-perf-plugin',
  onConnect: (connection) => {
    // Send custom metrics
    connection.send('metric', { fps: 60, memory: 256 });
  },
  onDisconnect: () => {},
});
\`\`\``,
    documentType: 'api_reference',
    category: 'profiling',
    platform: 'both',
    tags: ['flipper', 'debugging', 'profiling', 'devtools', 'performance'],
    relatedTopics: ['memory', 'bridge', 'render_prevention'],
    codeExamples: [
      {
        language: 'typescript',
        code: `// Custom performance tracking hook
import { useEffect, useRef } from 'react';

interface PerfMetrics {
  componentName: string;
  renderCount: number;
  avgRenderTime: number;
  lastRenderTime: number;
}

const metricsStore = new Map<string, PerfMetrics>();

export function usePerformanceTracking(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    renderCount.current++;
    renderTimes.current.push(renderTime);

    // Keep last 100 measurements
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }

    const avgRenderTime =
      renderTimes.current.reduce((a, b) => a + b, 0) /
      renderTimes.current.length;

    metricsStore.set(componentName, {
      componentName,
      renderCount: renderCount.current,
      avgRenderTime,
      lastRenderTime: renderTime,
    });

    // Log slow renders
    if (renderTime > 16) {
      console.warn(\`Slow render: \${componentName} took \${renderTime.toFixed(2)}ms\`);
    }
  });

  // Reset timer at start of each render
  startTime.current = performance.now();
}

// Usage
function CardList() {
  usePerformanceTracking('CardList');
  // ... component code
}`,
        description: 'Custom performance tracking hook',
      },
    ],
    rnVersion: '0.62+',
    isVerified: true,
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  optimize_component: {
    id: 'optimize_component',
    name: 'Component Optimization',
    description: 'Analyze and optimize a React Native component',
    template: `Analyze this React Native component for performance issues and provide optimization suggestions.

Component Code:
\`\`\`tsx
{code}
\`\`\`

Platform: {platform}
Target FPS: {targetFps}

Please identify:
1. Unnecessary re-renders
2. Missing memoization opportunities
3. Expensive operations in render
4. Bridge call optimizations
5. Memory leak risks

Provide optimized code with explanations.`,
    variables: ['code', 'platform', 'targetFps'],
  },
  diagnose_performance: {
    id: 'diagnose_performance',
    name: 'Performance Diagnosis',
    description: 'Diagnose performance issues from metrics',
    template: `Diagnose performance issues based on these metrics:

Average FPS: {avgFps}
Memory Usage: {memoryMb}MB
Re-render Count: {reRenderCount}
Bridge Calls: {bridgeCalls}
Platform: {platform}
Device Tier: {deviceTier}

Provide:
1. Root cause analysis
2. Severity assessment
3. Prioritized fix recommendations
4. Code examples for top issues`,
    variables: ['avgFps', 'memoryMb', 'reRenderCount', 'bridgeCalls', 'platform', 'deviceTier'],
  },
  list_optimization: {
    id: 'list_optimization',
    name: 'List Optimization',
    description: 'Optimize FlatList or SectionList performance',
    template: `Optimize this list implementation for {platform}:

Current Code:
\`\`\`tsx
{code}
\`\`\`

List Size: {itemCount} items
Item Height: {itemHeight}px (if fixed)
Current FPS: {currentFps}
Target FPS: {targetFps}

Provide:
1. Optimal FlatList props configuration
2. Item component memoization
3. keyExtractor and getItemLayout implementation
4. Any additional optimizations`,
    variables: ['code', 'platform', 'itemCount', 'itemHeight', 'currentFps', 'targetFps'],
  },
  offline_strategy: {
    id: 'offline_strategy',
    name: 'Offline Strategy',
    description: 'Design offline-first architecture',
    template: `Design an offline-first strategy for this feature:

Feature: {featureName}
Data Types: {dataTypes}
Sync Frequency: {syncFrequency}
Conflict Resolution: {conflictStrategy}

Requirements:
- Work fully offline
- Sync when connection available
- Handle conflicts gracefully
- Minimize battery usage

Provide:
1. Storage architecture
2. Sync strategy code
3. Conflict resolution logic
4. UI feedback patterns`,
    variables: ['featureName', 'dataTypes', 'syncFrequency', 'conflictStrategy'],
  },
};

// ============================================================================
// KNOWLEDGE MANAGEMENT
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeMobileKnowledge(): Promise<{ documentsLoaded: number }> {
  let count = 0;

  for (const doc of CORE_KNOWLEDGE) {
    const existing = await db
      .select()
      .from(mobileKnowledge)
      .where(eq(mobileKnowledge.title, doc.title))
      .execute();

    if (existing.length === 0) {
      await db.insert(mobileKnowledge).values(doc);
      count++;
    }
  }

  return { documentsLoaded: count };
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<MobileKnowledge[]> {
  const { query: searchQuery, category, documentType, platform, limit = 10 } = query;

  const conditions = [];

  // Text search
  if (searchQuery) {
    conditions.push(
      or(
        ilike(mobileKnowledge.title, `%${searchQuery}%`),
        ilike(mobileKnowledge.content, `%${searchQuery}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(mobileKnowledge.category, category));
  }

  if (documentType) {
    conditions.push(eq(mobileKnowledge.documentType, documentType));
  }

  if (platform) {
    conditions.push(
      or(
        eq(mobileKnowledge.platform, platform),
        eq(mobileKnowledge.platform, 'both')
      )
    );
  }

  return db
    .select()
    .from(mobileKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(
  category: Category
): Promise<MobileKnowledge[]> {
  return db
    .select()
    .from(mobileKnowledge)
    .where(eq(mobileKnowledge.category, category))
    .execute();
}

/**
 * Get knowledge by document type
 */
export async function getKnowledgeByType(
  documentType: DocumentType
): Promise<MobileKnowledge[]> {
  return db
    .select()
    .from(mobileKnowledge)
    .where(eq(mobileKnowledge.documentType, documentType))
    .execute();
}

/**
 * Get a prompt template
 */
export function getPromptTemplate(templateId: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[templateId] ?? null;
}

/**
 * Fill a prompt template with variables
 */
export function fillPromptTemplate(
  templateId: string,
  variables: Record<string, string>
): string | null {
  const template = PROMPT_TEMPLATES[templateId];
  if (!template) return null;

  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return filled;
}

/**
 * Generate a performance optimization prompt
 */
export async function generateMobilePerfPrompt(
  task: string,
  context?: {
    platform?: Platform;
    deviceTier?: DeviceTier;
    category?: Category;
  }
): Promise<string> {
  // Search for relevant knowledge
  const relevantDocs = await searchKnowledge({
    query: task,
    category: context?.category,
    platform: context?.platform,
    limit: 3,
  });

  const knowledgeContext = relevantDocs
    .map((doc) => `## ${doc.title}\n${doc.content.substring(0, 500)}...`)
    .join('\n\n');

  return `You are a React Native performance optimization expert.

Task: ${task}

Platform: ${context?.platform ?? 'both'}
Device Tier: ${context?.deviceTier ?? 'mid_range'}

Relevant Knowledge:
${knowledgeContext}

Provide specific, actionable recommendations with code examples.
Focus on measurable performance improvements.
Consider the target platform and device capabilities.`;
}
