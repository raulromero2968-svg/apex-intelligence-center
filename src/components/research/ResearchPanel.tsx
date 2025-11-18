/**
 * Research Panel - PS5-Style Streaming RAG Interface
 *
 * RAG-Fusion → 5 diverse queries → parallel hybrid search → Cohere rerank v3 → gpt-4o streaming
 * Sources rendered as clickable chips with relevance % (rounded)
 * Ctrl+K hotkey toggle (PlayStation UX paradigm)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, ExternalLink, TrendingUp } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    index: number;
    title: string;
    url: string;
    relevance: number;
    sourceType: string;
  }>;
  priceUpdates?: Array<{
    card: string;
    delta: number;
    deltaPercent: number;
  }>;
}

export default function ResearchPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle with Ctrl+K (PS5 quick menu feel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendQuery = async () => {
    if (!query.trim() || streaming) return;

    const userMessage = query;
    setMessages((m) => [...m, { role: 'user', content: userMessage }]);
    setQuery('');
    setStreaming(true);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          sessionId: sessionId.current,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let sources: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Check if chunk contains sources
        if (chunk.includes('__SOURCES__')) {
          const parts = chunk.split('__SOURCES__');
          assistantMessage += parts[0];

          try {
            const sourcesJson = parts[1].trim();
            sources = JSON.parse(sourcesJson);
          } catch (e) {
            console.error('Failed to parse sources:', e);
          }
        } else {
          assistantMessage += chunk;
        }

        // Update messages in real-time
        setMessages((m) => {
          const updated = [...m];
          if (updated[updated.length - 1]?.role === 'assistant') {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
              sources: sources.length > 0 ? sources : undefined,
            };
          } else {
            updated.push({
              role: 'assistant',
              content: assistantMessage,
              sources: sources.length > 0 ? sources : undefined,
            });
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Research query error:', err);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Error: Failed to reach research engine. Please try again.',
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  // Format text with basic markdown support (bold, code, bullets)
  const formatText = (text: string) => {
    // Split by lines
    const lines = text.split('\n');

    return lines.map((line, i) => {
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mb-1">
            <span className="text-cyan-400">•</span>
            <span>{line.trim().slice(2)}</span>
          </div>
        );
      }

      // Headers
      if (line.trim().startsWith('##')) {
        return (
          <h3 key={i} className="text-lg font-bold text-cyan-300 mt-3 mb-2">
            {line.replace(/^#+\s*/, '')}
          </h3>
        );
      }

      // Bold text
      let formatted = line;
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

      // Inline code
      formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm text-cyan-300">$1</code>');

      // Empty lines
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      return (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: formatted }}
          className="mb-1"
        />
      );
    });
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-600 to-purple-700 px-6 py-4 text-white shadow-2xl hover:scale-105 transition-transform"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Research Panel</span>
          <kbd className="px-2 py-1 text-xs bg-white/20 rounded">Ctrl+K</kbd>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-gray-950/95 backdrop-blur-xl border-l border-cyan-800/30 shadow-2xl"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-cyan-800/30 p-6 bg-gradient-to-r from-gray-900 to-gray-950">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Apex Research Engine
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Investment-grade TCG intelligence • Powered by RAG-Fusion
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-32">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
                      <p className="text-lg font-medium mb-2">
                        Ask anything about TCG markets
                      </p>
                      <p className="text-sm text-gray-600">
                        Card pricing • Arbitrage opportunities • Portfolio strategy
                        <br />
                        Grading ROI • Market trends • Investment analysis
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-lg rounded-2xl px-6 py-4 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-600 to-purple-700 text-white'
                            : 'bg-gray-800/80 text-gray-100'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div>{msg.content}</div>
                        ) : (
                          <>
                            <div className="prose prose-invert max-w-none">
                              {formatText(msg.content)}
                            </div>

                            {/* Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                                  <ExternalLink className="w-3 h-3" />
                                  Sources ({msg.sources.length})
                                </div>
                                <div className="space-y-2">
                                  {msg.sources.map((src: any) => (
                                    <a
                                      key={src.index}
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-gray-300 hover:text-cyan-400 transition-colors bg-gray-900/50 rounded-lg px-3 py-2 hover:bg-gray-900"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <span className="font-mono text-cyan-500">
                                            [{src.index}]
                                          </span>
                                          <span className="truncate">
                                            {src.title}
                                          </span>
                                        </div>
                                        <span className="text-cyan-400 font-medium whitespace-nowrap">
                                          {Math.round(src.relevance * 100)}%
                                        </span>
                                      </div>
                                      <div className="text-gray-500 text-[10px] mt-1 ml-8">
                                        {src.sourceType.replace(/_/g, ' ')}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {streaming && (
                    <div className="text-gray-500 italic flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      Analyzing markets...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-cyan-800/30 p-6 bg-gray-950/50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendQuery();
                    }}
                    className="flex gap-4"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Best Pokémon cards to buy before rotation?"
                      className="flex-1 rounded-full bg-gray-900/80 px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-800"
                      autoFocus
                      disabled={streaming}
                    />
                    <button
                      type="submit"
                      disabled={streaming || !query.trim()}
                      className="rounded-full bg-gradient-to-r from-cyan-600 to-purple-700 p-4 text-white hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-transform shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                  <div className="text-xs text-gray-600 mt-3 text-center">
                    Powered by RAG-Fusion • Cohere rerank v3 • GPT-4o
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
