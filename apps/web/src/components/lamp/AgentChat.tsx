'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * AgentChat Component
 *
 * Real-time scrolling chat window for LAMP (Language Agent Message Protocol) simulation
 *
 * Features:
 * - SSE (Server-Sent Events) streaming from /api/lamp/stream
 * - Auto-scroll to latest messages
 * - PS5-dark theme with cyan/purple gradients
 * - Agent persona avatars
 * - Loading and error states
 * - Auto-reconnect with exponential backoff
 */

// Agent persona types
type AgentPersona = 'analyst' | 'researcher' | 'strategist' | 'oracle' | 'system';

interface AgentMessage {
  id: string;
  sessionId: string;
  persona: AgentPersona;
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
    confidence?: number;
    sources?: string[];
  };
}

interface AgentChatProps {
  sessionId: string;
  className?: string;
  maxHeight?: string;
  autoConnect?: boolean;
}

// Agent persona configurations
const AGENT_PERSONAS: Record<AgentPersona, { name: string; color: string; gradient: string; icon: string }> = {
  analyst: {
    name: 'Analyst',
    color: 'cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    icon: '📊',
  },
  researcher: {
    name: 'Researcher',
    color: 'purple-500',
    gradient: 'from-purple-500/20 to-purple-600/10',
    icon: '🔬',
  },
  strategist: {
    name: 'Strategist',
    color: 'magenta-500',
    gradient: 'from-magenta-500/20 to-magenta-600/10',
    icon: '♟️',
  },
  oracle: {
    name: 'Oracle',
    color: 'cyan-400',
    gradient: 'from-cyan-400/20 via-purple-500/20 to-magenta-500/10',
    icon: '🔮',
  },
  system: {
    name: 'System',
    color: 'white',
    gradient: 'from-white/10 to-white/5',
    icon: '⚙️',
  },
};

export function AgentChat({
  sessionId,
  className = '',
  maxHeight = '600px',
  autoConnect = true,
}: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!autoConnect) return;

    cleanup();
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/lamp/stream?sessionId=${encodeURIComponent(sessionId)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        reconnectDelayRef.current = 1000; // Reset backoff
      };

      // Handle incoming messages
      eventSource.addEventListener('message', (event) => {
        try {
          const message: AgentMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      // Handle connection status
      eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('LAMP stream connected:', data);
        } catch (err) {
          console.error('Failed to parse connected event:', err);
        }
      });

      // Handle errors from server
      eventSource.addEventListener('error', (event) => {
        try {
          const errorData = JSON.parse((event as any).data);
          setError(errorData.error || 'Stream error');
        } catch {
          // Ignore parse errors for network errors
        }
      });

      // Handle connection errors
      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setIsConnected(false);
        setIsLoading(false);
        setError('Connection lost. Reconnecting...');
        cleanup();

        // Exponential backoff reconnect
        const delay = Math.min(reconnectDelayRef.current, 5000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 5000);
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('Failed to connect to LAMP stream');
      setIsLoading(false);
    }
  }, [sessionId, autoConnect, cleanup]);

  // Initialize connection
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`flex flex-col bg-ink/95 backdrop-blur-xl border border-cyan-500/20 rounded-lg overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-magenta-500/10">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🧠</div>
          <div>
            <h3 className="text-white font-semibold text-sm">LAMP Simulation</h3>
            <p className="text-white/50 text-xs">Multi-Agent Intelligence</p>
          </div>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
              <span>Connecting...</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-2 text-cyan-400 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        style={{ minHeight: '300px' }}
      >
        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <p className="text-red-400 text-sm font-semibold">Connection Error</p>
                <p className="text-red-400/70 text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-magenta-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-white/50 text-sm">Initializing LAMP agents...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-white/50 text-sm">Waiting for agent messages...</p>
              <p className="text-white/30 text-xs">LAMP simulation will begin shortly</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const persona = AGENT_PERSONAS[message.persona];
          const isSystem = message.persona === 'system';

          return (
            <div
              key={message.id || `${message.timestamp}-${index}`}
              className={`flex gap-3 ${isSystem ? 'opacity-60' : ''}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${persona.gradient} border border-${persona.color}/30 flex items-center justify-center text-lg shadow-lg`}
                >
                  {persona.icon}
                </div>
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-${persona.color} font-semibold text-sm`}>
                    {persona.name}
                  </span>
                  <span className="text-white/30 text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.metadata?.confidence && (
                    <span className="text-white/40 text-xs">
                      • {Math.round(message.metadata.confidence * 100)}% confidence
                    </span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`bg-gradient-to-br ${persona.gradient} border border-${persona.color}/20 rounded-lg px-4 py-3`}
                >
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Tool metadata */}
                  {message.metadata?.toolName && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-white/40 text-xs">
                        🔧 Tool: <span className="text-white/60">{message.metadata.toolName}</span>
                      </p>
                    </div>
                  )}

                  {/* Sources */}
                  {message.metadata?.sources && message.metadata.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-white/40 text-xs mb-1">📚 Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.metadata.sources.map((source, idx) => (
                          <span
                            key={idx}
                            className="bg-white/10 px-2 py-0.5 rounded text-white/60 text-xs"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-cyan-500/20 bg-ink/50">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{messages.length} messages</span>
          <span>Session: {sessionId.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}

export default AgentChat;
