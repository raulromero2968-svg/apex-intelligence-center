'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';

interface ResearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResearchDialog({ isOpen, onClose }: ResearchDialogProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'rate-limit' | 'stream-interrupted' | 'general' | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track panel open event
  useEffect(() => {
    if (isOpen) {
      // Track research_panel_open event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'research_panel_open', {
          event_category: 'engagement',
          event_label: 'research_panel',
        });
      }

      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closed
      setQuery('');
      setResult(null);
      setIsLoading(false);
      setErrorType(null);
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setErrorType(null);

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
        body: JSON.stringify({ query }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const data = await response.json();
        setErrorType('rate-limit');
        setResult(null);
        return;
      }

      // Check if response is SSE stream or JSON
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (!reader) {
          throw new Error('Stream reader not available');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            // Check for error marker
            if (fullText.includes('__ERROR__')) {
              const errorText = fullText.split('__ERROR__')[1]?.trim() || 'Stream error occurred';
              setResult(errorText);
              setErrorType('general');
              return;
            }

            // Check for sources marker (end of stream)
            if (fullText.includes('__SOURCES__')) {
              const [answer] = fullText.split('__SOURCES__');
              setResult(answer.trim());
              return;
            }

            // Update result with current content
            setResult(fullText);
          }
        } catch (streamError) {
          setErrorType('stream-interrupted');
          setResult(fullText || null);
        }
      } else {
        // Handle JSON response
        const data = await response.json();

        if (data.ok) {
          setResult(data.answer);
          setErrorType(null);
        } else {
          setResult(`Error: ${data.error || 'Failed to process research query'}`);
          setErrorType('general');
        }
      }
    } catch (error) {
      setResult('Error: Failed to submit research query. Please try again.');
      setErrorType('general');
    } finally {
      setIsLoading(false);
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
              className="w-full max-w-2xl bg-ink/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-400/10 pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Ask Research</h2>
                <button
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
                    className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
                  >
                    <p className="text-amber-400 text-sm font-medium">
                      Rate limit reached. Please try again in 60 seconds.
                    </p>
                  </motion.div>
                )}

                {errorType === 'stream-interrupted' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30"
                  >
                    <p className="text-orange-400 text-sm font-medium">
                      Stream interrupted. Please retry your query.
                    </p>
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
                    className="p-4 rounded-lg bg-white/5 border border-cyan-500/20"
                  >
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Research Result</h3>
                    <p className="text-white/80 whitespace-pre-wrap text-sm">{result}</p>
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

