'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';

interface FibonacciResearchProps {
  suggestions?: string[];
  className?: string;
}

interface ResearchResult {
  answer: string;
  sources: Array<{
    index: number;
    title: string;
    url?: string;
    score: number;
  }>;
}

const DEFAULT_SUGGESTIONS = [
  'Fibonacci phyllotaxis in plants',
  'Overfitting patterns in finance data',
  'Animal perception of symmetry',
  'Fibonacci spirals in DNA',
  'Pattern recognition limits',
  'Golden ratio in nature',
];

/**
 * FibonacciResearch - RAG-powered research form for Fibonacci patterns
 *
 * Features:
 * - Pre-filled query suggestions for Fibonacci in biology/nature
 * - SSE streaming response support
 * - Source citation display
 * - Error handling with specific messages for rate limits and safety refusals
 * - Safety disclaimer about curated corpus and ethical constraints
 */
export function FibonacciResearch({
  suggestions = DEFAULT_SUGGESTIONS,
  className = '',
}: FibonacciResearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<{ message: string; type: 'rate_limit' | 'refused' | 'error' } | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const handleResearch = useCallback(async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStreamingText('');

    try {
      const res = await fetch('/api/philosophy/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery }),
      });

      // Handle specific HTTP error codes
      if (!res.ok) {
        if (res.status === 429) {
          throw { message: "You've hit the research rate limit. Try again in a minute.", type: 'rate_limit' as const };
        }
        if (res.status === 400) {
          const err = await res.json().catch(() => ({}));
          throw {
            message: err.error || "We can't answer that query. Please try a different question about Fibonacci patterns.",
            type: 'refused' as const
          };
        }
        const err = await res.json().catch(() => ({}));
        throw { message: err.error || 'Research query failed', type: 'error' as const };
      }

      // Check if streaming response
      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = res.body?.getReader();
        if (!reader) throw { message: 'No response body', type: 'error' as const };

        const decoder = new TextDecoder();
        let fullText = '';
        let sources: ResearchResult['sources'] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Check for __SOURCES__ marker
          if (chunk.includes('__SOURCES__')) {
            const [textPart, sourcesPart] = chunk.split('__SOURCES__');
            fullText += textPart;
            setStreamingText(fullText);

            try {
              sources = JSON.parse(sourcesPart.trim());
            } catch {
              // Sources parsing failed, continue without
            }
          } else if (chunk.includes('__ERROR__')) {
            const errorMsg = chunk.split('__ERROR__')[1]?.trim();
            throw { message: errorMsg || 'Research failed', type: 'error' as const };
          } else {
            fullText += chunk;
            setStreamingText(fullText);
          }
        }

        setResult({ answer: fullText.trim(), sources });
      } else {
        // Handle JSON response
        const data = await res.json();
        setResult({
          answer: data.answer || data.response || 'No response received',
          sources: data.sources || [],
        });
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'type' in err) {
        setError(err as { message: string; type: 'rate_limit' | 'refused' | 'error' });
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Something broke on our side. Try again later.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleResearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && query.trim()) {
      handleResearch();
    }
  };

  return (
    <div className={`fibonacci-research ${className}`}>
      {/* Query Input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Research Fibonacci patterns in nature and biology..."
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg pl-12 pr-28 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-sm"
            aria-label="Research query"
          />
          <button
            type="button"
            onClick={() => handleResearch()}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 text-sm font-mono font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>QUERYING</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>RESEARCH</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="mt-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">
            Suggested queries:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(sq)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-cyan-500/30 rounded-full text-slate-400 hover:text-cyan-400 transition-all font-mono disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              error.type === 'rate_limit'
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : error.type === 'refused'
                ? 'bg-purple-500/10 border border-purple-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              error.type === 'rate_limit'
                ? 'text-yellow-400'
                : error.type === 'refused'
                ? 'text-purple-400'
                : 'text-red-400'
            }`} />
            <div className="flex-1">
              <span className={`text-sm ${
                error.type === 'rate_limit'
                  ? 'text-yellow-300'
                  : error.type === 'refused'
                  ? 'text-purple-300'
                  : 'text-red-300'
              }`}>{error.message}</span>
            </div>
            {error.type === 'error' && (
              <button
                type="button"
                onClick={() => handleResearch()}
                className="text-xs underline text-slate-400 hover:text-slate-300"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State with Streaming Text */}
      <AnimatePresence>
        {loading && streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-6 bg-slate-900/50 border border-cyan-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">
                Processing research query...
              </span>
            </div>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Answer */}
            <div className="p-6 bg-slate-900/50 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">
                  Research Results
                </span>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </div>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="p-4 bg-slate-950/50 border border-slate-700/50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-mono">
                  Sources ({result.sources.length})
                </div>
                <div className="space-y-2">
                  {result.sources.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-slate-800/30 rounded text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-mono">[{source.index}]</span>
                        <span className="text-slate-300">{source.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {(source.score * 100).toFixed(0)}% relevance
                        </span>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                            aria-label={`Open source: ${source.title}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4 opacity-30">
            <Sparkles className="w-12 h-12 mx-auto text-cyan-400" />
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto font-mono">
            Query our knowledge base to explore Fibonacci patterns in biology,
            animal sentience, and the universal mathematics of nature.
          </p>
        </div>
      )}

      {/* Safety Disclaimer */}
      <p className="mt-6 text-[11px] text-slate-500 leading-relaxed">
        This console summarizes a small, vetted set of research notes and articles.
        It will refuse queries that involve harming humans or animals, and its answers
        may be incomplete or outdated. Results come from a curated corpus, not the open web.
      </p>
    </div>
  );
}

export default FibonacciResearch;
