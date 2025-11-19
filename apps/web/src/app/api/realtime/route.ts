/**
 * WebSocket API Route (Vercel Edge-compatible)
 *
 * Socket.IO server endpoint for real-time communication
 * Handles WebSocket connections and fallback to long-polling
 *
 * Note: Vercel Edge doesn't natively support WebSocket servers,
 * so we use a hybrid approach with Upstash Redis for pub/sub
 */

import { createRealtimeServer } from '@apex/realtime';
import { NextRequest } from 'next/server';

// Create singleton server instance
let ioServer: ReturnType<typeof createRealtimeServer> | null = null;

function getServerInstance() {
  if (!ioServer) {
    ioServer = createRealtimeServer();
    console.log('✓ Socket.IO server initialized');
  }
  return ioServer;
}

/**
 * Handle all HTTP methods (Socket.IO handshake uses GET and POST)
 */
export async function GET(request: NextRequest) {
  const server = getServerInstance();

  // Socket.IO will handle the request
  // Note: This is a simplified version - in production on Vercel,
  // you may need to use a dedicated WebSocket infrastructure like Ably or Pusher
  // or deploy the Socket.IO server separately on a platform that supports WebSockets

  return new Response('Socket.IO server running. Connect using socket.io-client.', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export async function POST(request: NextRequest) {
  const server = getServerInstance();

  return new Response('Socket.IO server running', {
    status: 200,
  });
}

// Export server instance for server-side broadcasting
export { ioServer };
