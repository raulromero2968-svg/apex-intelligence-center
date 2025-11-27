'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, BookOpen, ExternalLink } from 'lucide-react';

interface FibonacciResearchProps {
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

/**
 * FibonacciResearch - RAG-powered research form for Fibonacci patterns
 *
 * Features:
 * - Pre-filled query suggestions for Fibonacci in biology/nature
 * - SSE streaming response support
 * - Source citation display
 * - Error handling with retry
 */
export function FibonacciResearch({ className = '' }: FibonacciResearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const suggestedQueries = [
    'Fibonacci in animal biology',
    'Fibonacci spirals in DNA and neurons',
    'How does the golden ratio appear in animal sentience?',
    'Fibonacci patterns in honeybee ancestry',
    'Neural branching and Fibonacci efficiency',
    'Golden ratio in animal communication patterns',
  ];

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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Research query failed');
      }

      // Check if streaming response
      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

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
            throw new Error(errorMsg || 'Research failed');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleResearch(suggestion);
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
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            placeholder="Research Fibonacci patterns in nature and biology..."
            className="w-full bg-black/50 border border-cyan-500/30 rounded-lg pl-12 pr-28 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 font-mono text-sm"
          />
          <button
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
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sq)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-cyan-500/30 rounded-full text-slate-400 hover:text-cyan-400 transition-all font-mono disabled:opacity-50"
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
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3"
          >
            <span className="text-red-400">Error:</span>
            <span>{error}</span>
            <button
              onClick={() => handleResearch()}
              className="ml-auto text-xs underline hover:text-red-300"
            >
              Retry
            </button>
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
    </div>
  );
}

export default FibonacciResearch;
