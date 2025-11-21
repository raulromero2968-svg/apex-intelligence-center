# LAMP Components

Language Agent Message Protocol - Real-time multi-agent chat interface for the Apex Intelligence Center.

## Components

### AgentChat

A real-time scrolling chat window that displays messages from LAMP simulation agents.

#### Features

- ✅ Real-time SSE (Server-Sent Events) streaming from `/api/lamp/stream`
- ✅ Auto-scroll to latest messages
- ✅ PS5-dark theme with cyan/purple gradients
- ✅ Agent persona avatars (Analyst, Researcher, Strategist, Oracle, System)
- ✅ Loading and error states
- ✅ Auto-reconnect with exponential backoff
- ✅ Connection status indicator
- ✅ TypeScript support with full type safety
- ✅ Message metadata (tools, confidence, sources)

#### Usage

```tsx
import { AgentChat } from '@/components/lamp';

function MyPage() {
  const sessionId = 'unique-session-id';

  return (
    <AgentChat
      sessionId={sessionId}
      maxHeight="600px"
      autoConnect={true}
      className="w-full"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sessionId` | `string` | Required | Unique session identifier for the LAMP simulation |
| `className` | `string` | `''` | Additional CSS classes |
| `maxHeight` | `string` | `'600px'` | Maximum height of the chat window |
| `autoConnect` | `boolean` | `true` | Automatically connect to SSE stream on mount |

#### Agent Personas

The component supports 5 agent personas:

- **Analyst** (📊): Cyan gradient - Data analysis and insights
- **Researcher** (🔬): Purple gradient - Research and fact-finding
- **Strategist** (♟️): Magenta gradient - Strategic planning
- **Oracle** (🔮): Multi-gradient - Predictions and forecasting
- **System** (⚙️): White gradient - System messages and status

## API Integration

### SSE Endpoint

The component expects an SSE endpoint at `/api/lamp/stream` that accepts a `sessionId` query parameter:

```typescript
// /api/lamp/stream/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send connected event
      const connectedEvent = `event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectedEvent));

      // Send messages
      const message = {
        id: crypto.randomUUID(),
        sessionId,
        persona: 'analyst',
        content: 'Analysis complete.',
        timestamp: Date.now(),
      };

      const messageEvent = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      controller.enqueue(new TextEncoder().encode(messageEvent));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Message Format

```typescript
interface AgentMessage {
  id: string;
  sessionId: string;
  persona: 'analyst' | 'researcher' | 'strategist' | 'oracle' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
    confidence?: number;
    sources?: string[];
  };
}
```

### SSE Events

The component listens for the following SSE events:

- `message`: Agent messages (required)
- `connected`: Connection confirmation
- `error`: Error messages from server

## Styling

The component uses the PS5-dark theme with Tailwind CSS:

- Background: `ink` (#0A0E1A)
- Primary: `cyan-400` (#00D9FF)
- Secondary: `purple-500` (#9333EA)
- Accent: `magenta-500` (#FF00FF)

## Examples

### Basic Usage

```tsx
<AgentChat sessionId="demo-session" />
```

### Custom Styling

```tsx
<AgentChat
  sessionId="demo-session"
  className="shadow-2xl"
  maxHeight="800px"
/>
```

### With Custom Container

```tsx
<div className="container mx-auto p-4">
  <h1 className="text-2xl font-bold text-white mb-4">
    LAMP Simulation
  </h1>
  <AgentChat sessionId="demo-session" />
</div>
```

## Development

### Testing Locally

You can test the component with a mock SSE endpoint:

```typescript
// Create a test page at app/lamp-test/page.tsx
import { AgentChat } from '@/components/lamp';

export default function LAMPTestPage() {
  return (
    <div className="min-h-screen bg-ink p-8">
      <AgentChat sessionId="test-session-123" />
    </div>
  );
}
```

### Debugging

The component includes console logging for SSE events. Check the browser console for:
- Connection status
- Message parsing errors
- Reconnection attempts

## Error Handling

The component handles:
- Network errors with auto-reconnect
- Malformed message data
- SSE stream interruptions
- Connection timeouts

Errors are displayed in a red banner at the top of the chat window.

## Performance

- Messages are stored in React state (consider Redux/Zustand for large volumes)
- Auto-scroll uses `scrollIntoView` with smooth behavior
- Exponential backoff prevents reconnect spam (max 5s delay)
- Event listeners are properly cleaned up on unmount
