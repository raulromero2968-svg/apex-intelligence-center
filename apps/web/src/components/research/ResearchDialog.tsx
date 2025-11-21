'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { extractSymbols } from '@/lib/research';

interface ResearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onContrarianQuery?: (query: string) => void;
}

interface Source {
  index: number;
  title: string;
  url: string;
  relevance?: number; // Percentage (0-100) - computed from score if needed
  score?: number; // API returns score (0-1)
  sourceType?: string;
}

export default function ResearchDialog({ isOpen, onClose, initialQuery = '' }: ResearchDialogProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // error banners + retry UX
  const [errorType, setErrorType] =
    useState<'rate-limit' | 'stream-interrupted' | 'general' | null>(null);

  // live-prices websocket session support
  const [sessionId, setSessionId] = useState<string>('');

  // textarea focus & keyboard handling
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const streamStartTimeRef = useRef<number | null>(null);

  // Normalize sources: convert score (0-1) to relevance (0-100) if needed
  const normalizeSources = (sourcesData: any[]): Source[] => {
    return sourcesData.map((source) => ({
      ...source,
      relevance: source.relevance ?? (source.score ? Math.round(source.score * 100) : undefined),
    }));
  };

  // Extract symbols from the result
  const symbols = useMemo(() => {
    if (!result) return [];
    return extractSymbols(result);
  }, [result]);

  // WebSocket connection for live prices
  const { deltas, isConnected } = useLivePrices({
    sessionId,
    enabled: isOpen && !!result && symbols.length > 0,
  });

  // Track panel open event and handle initial query
  useEffect(() => {
    if (isOpen) {
      // Track research_panel_open event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'research_panel_open', {
          event_category: 'engagement',
          event_label: 'research_panel',
        });
      }

      // Set initial query if provided
      if (initialQuery) {
        setQuery(initialQuery);
      }

      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closed
      setQuery('');
      setResult(null);
      setSources([]);
      setIsLoading(false);
      setErrorType(null);
      streamStartTimeRef.current = null;
    }
  }, [isOpen, initialQuery]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap: Keep focus within dialog
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * Robust SSE parser that handles split markers and keeps __SOURCES__ and __ERROR__ until end
   */
  const parseSSEStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let sourcesJsonBuffer = '';
    let hasSourcesMarker = false;
    let hasErrorMarker = false;
    const sourcesMarker = '__SOURCES__';
    const errorMarker = '__ERROR__';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream ended - check if it was interrupted unexpectedly
          if (!hasSourcesMarker && !hasErrorMarker && answer.trim()) {
            setErrorType('stream-interrupted');
          }
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Check for error marker first
        if (!hasErrorMarker && !hasSourcesMarker) {
          const errorMarkerIndex = buffer.indexOf(errorMarker);
          if (errorMarkerIndex !== -1) {
            // Extract answer up to error marker
            answer += buffer.slice(0, errorMarkerIndex);
            buffer = buffer.slice(errorMarkerIndex + errorMarker.length);
            hasErrorMarker = true;
            setResult(answer.trim());
            setErrorType('general');
            // Process error message after marker
            if (buffer.trim()) {
              const errorMessage = buffer.trim();
              setResult((prev) => (prev || '') + '\n\n' + errorMessage);
              buffer = '';
            }
            continue;
          }

          // Check if error marker might be split
          let processedError = false;
          for (let i = 1; i < errorMarker.length && buffer.length >= i; i++) {
            const suffix = buffer.slice(-i);
            const prefix = errorMarker.slice(0, i);
            if (suffix === prefix) {
              const toProcess = buffer.slice(0, -i);
              answer += toProcess;
              buffer = suffix;
              setResult(answer.trim());
              processedError = true;
              break;
            }
          }
          if (processedError) continue;
        }

        // Check if we've hit the sources marker (may be split across chunks)
        if (!hasSourcesMarker && !hasErrorMarker) {
          const sourcesMarkerIndex = buffer.indexOf(sourcesMarker);
          if (sourcesMarkerIndex !== -1) {
            // Extract answer up to marker
            answer += buffer.slice(0, sourcesMarkerIndex);
            // Remove marker and everything before it
            buffer = buffer.slice(sourcesMarkerIndex + sourcesMarker.length);
            hasSourcesMarker = true;
            setResult(answer.trim());
            // Continue processing remaining buffer as JSON
            if (buffer.trim()) {
              sourcesJsonBuffer += buffer;
              buffer = '';
            }
          } else {
            // Before marker, accumulate answer
            // Check if marker might be split (end of buffer matches start of marker)
            let processed = false;
            for (let i = 1; i < sourcesMarker.length && buffer.length >= i; i++) {
              const suffix = buffer.slice(-i);
              const prefix = sourcesMarker.slice(0, i);
              if (suffix === prefix) {
                // Potential split - keep suffix in buffer, process rest
                const toProcess = buffer.slice(0, -i);
                answer += toProcess;
                buffer = suffix;
                setResult(answer.trim());
                processed = true;
                break;
              }
            }
            if (!processed) {
              // No split detected, process complete lines
              let newlineIndex;
              while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex + 1);
                buffer = buffer.slice(newlineIndex + 1);
                answer += line;
                setResult(answer.trim());
              }
            }
          }
        } else if (hasSourcesMarker && !hasErrorMarker) {
          // After marker, accumulate JSON (may be split across chunks)
          sourcesJsonBuffer += buffer;
          buffer = '';
          
          // Try to parse JSON (may be incomplete)
          try {
            const trimmed = sourcesJsonBuffer.trim();
            if (trimmed && (trimmed.startsWith('[') || trimmed.startsWith('{'))) {
              const sourcesData = JSON.parse(trimmed);
              setSources(normalizeSources(Array.isArray(sourcesData) ? sourcesData : []));
            }
          } catch {
            // JSON incomplete, keep accumulating
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        if (hasSourcesMarker && !hasErrorMarker) {
          sourcesJsonBuffer += buffer;
          try {
            const trimmed = sourcesJsonBuffer.trim();
            if (trimmed) {
              const sourcesData = JSON.parse(trimmed);
              setSources(normalizeSources(Array.isArray(sourcesData) ? sourcesData : []));
            }
          } catch (error) {
            console.error('Failed to parse sources JSON:', error);
          }
        } else if (!hasErrorMarker) {
          answer += buffer;
          setResult(answer.trim());
        }
      }
    } catch (error) {
      console.error('SSE parsing error:', error);
      setErrorType('stream-interrupted');
      setResult((prev) => (prev || '') + '\n\nError: Stream parsing failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setSources([]);
    setErrorType(null);
    streamStartTimeRef.current = Date.now();

    // Generate session ID for this research query
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    try {
      // Track research_query_submitted event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'research_query_submitted', {
          event_category: 'engagement',
          event_label: 'research_query',
          value: query.length,
        });
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, sessionId: newSessionId }),
      });

      // Check for rate limit (429)
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        setErrorType('rate-limit');
        setResult(`Rate limited: ${data.error || 'Too many requests. Please try again in 60 seconds.'}`);
        setIsLoading(false);
        streamStartTimeRef.current = null;
        return;
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
        // Handle SSE stream
        const reader = response.body?.getReader();
        if (reader) {
          await parseSSEStream(reader);

          // Track stream duration
          if (streamStartTimeRef.current) {
            const duration = Date.now() - streamStartTimeRef.current;
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'research_stream_duration_ms', {
                event_category: 'performance',
                event_label: 'research_stream',
                value: duration,
              });
            }
            streamStartTimeRef.current = null;
          }
        }
      } else {
        // Handle JSON response (fallback)
        const data = await response.json();

        if (data.ok) {
          setResult(data.answer);
          if (data.sources) {
            setSources(normalizeSources(Array.isArray(data.sources) ? data.sources : []));
          }
        } else {
          setErrorType('general');
          setResult(`Error: ${data.error || 'Failed to process research query'}`);
        }
      }
    } catch (error) {
      setErrorType('general');
      setResult('Error: Failed to submit research query. Please try again.');
      console.error('Research query error:', error);
    } finally {
      setIsLoading(false);
      streamStartTimeRef.current = null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              ref={dialogRef}
              className="w-full max-w-2xl bg-ink/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-400/10 pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="research-dialog-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 id="research-dialog-title" className="text-2xl font-bold text-white">Ask Research</h2>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Error Banners */}
                {errorType === 'rate-limit' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Rate Limited</strong>
                        <p className="text-red-300/80 mt-1">
                          Too many requests. Please wait 60 seconds before trying again.
                        </p>
                      </div>
                      <button
                        onClick={() => setErrorType(null)}
                        className="ml-4 text-red-300/70 hover:text-red-300 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {errorType === 'stream-interrupted' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Stream Interrupted</strong>
                        <p className="text-yellow-300/80 mt-1">
                          The connection was interrupted. You can retry your query.
                        </p>
                      </div>
                      <button
                        onClick={() => setErrorType(null)}
                        className="ml-4 text-yellow-300/70 hover:text-yellow-300 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {errorType === 'general' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Error</strong>
                        <p className="text-red-300/80 mt-1">
                          An error occurred. Please try again.
                        </p>
                      </div>
                      <button
                        onClick={() => setErrorType(null)}
                        className="ml-4 text-red-300/70 hover:text-red-300 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="research-query"
                      className="block text-sm font-medium text-white/70 mb-2"
                    >
                      What would you like to research?
                    </label>
                    <textarea
                      id="research-query"
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Should I grade my Charizard Base Set card? What's the ROI on sealed Pokemon 151?"
                      className="w-full h-32 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                      disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-white/50">
                      Ask any question about TCG market analysis, grading, investments, or
                      portfolio management
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="w-full px-6 py-3 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50 rounded-lg text-cyan-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Research Query
                      </>
                    )}
                  </button>
                </form>

                {/* Result */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/20">
                      <h3 className="text-sm font-semibold text-cyan-400 mb-2">Research Result</h3>
                      <p className="text-white/80 whitespace-pre-wrap text-sm">{result}</p>
                    </div>

                    {/* Sources */}
                    {sources.length > 0 && (
                      <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/20">
                        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Sources</h4>
                        <ul className="space-y-2">
                          {sources.map((source) => (
                            <li key={source.index} className="text-xs">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline"
                              >
                                [{source.index}] {source.title}
                              </a>
                              {source.relevance && (
                                <span className="text-white/50 ml-2">
                                  ({source.relevance}% relevant)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Live Price Deltas */}
                    {symbols.length > 0 && (
                      <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-cyan-400">
                            Live Prices
                          </h3>
                          {isConnected && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {symbols.map((symbol) => {
                            const delta = deltas.get(symbol);
                            const isPositive = delta && delta.priceChange > 0;
                            const isNegative = delta && delta.priceChange < 0;

                            return (
                              <div
                                key={symbol}
                                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  delta
                                    ? isPositive
                                      ? 'bg-green-500/20 border border-green-500/50'
                                      : isNegative
                                      ? 'bg-red-500/20 border border-red-500/50'
                                      : 'bg-white/5 border border-white/10'
                                    : 'bg-white/5 border border-white/10'
                                }`}
                              >
                                <span className="font-medium text-white">
                                  {symbol.charAt(0) + symbol.slice(1).toLowerCase()}
                                </span>
                                {delta ? (
                                  <>
                                    {isPositive ? (
                                      <TrendingUp className="w-4 h-4 text-green-400" />
                                    ) : isNegative ? (
                                      <TrendingDown className="w-4 h-4 text-red-400" />
                                    ) : null}
                                    <span
                                      className={
                                        isPositive
                                          ? 'text-green-400'
                                          : isNegative
                                          ? 'text-red-400'
                                          : 'text-white/70'
                                      }
                                    >
                                      {isPositive ? '+' : ''}
                                      ${delta.priceChange.toPrecision(3)} (
                                      {delta.percentChange.toPrecision(3)}%)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-white/50 text-xs">No data</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <p className="text-xs text-white/50 text-center">
                  Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


