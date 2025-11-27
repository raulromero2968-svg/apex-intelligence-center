'use client';

import { useState, FormEvent } from 'react';

interface ResearchResult {
  insights: string;
  sources: { id: number; snippet: string; score?: number }[];
}

export default function PhilosophyResearchForm() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/philosophy/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Ethical AI for animal sentience"
          className="flex-1 p-3 border border-cyan-500/30 rounded-lg bg-black/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Researching...' : 'Research'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="p-6 bg-black/30 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-3">Insights</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.insights}
              </p>
            </div>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="p-6 bg-black/30 border border-cyan-500/20 rounded-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-3">Sources</h3>
              <ul className="space-y-3">
                {result.sources.map((source) => (
                  <li
                    key={source.id}
                    className="p-3 bg-black/40 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-mono">
                        {source.id}
                      </span>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {source.snippet}...
                      </p>
                    </div>
                    {source.score !== undefined && (
                      <div className="mt-2 ml-9">
                        <span className="text-xs text-gray-500">
                          Relevance: {Math.round(source.score * 100)}%
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
