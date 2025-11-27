'use client';

import { useEffect, useState } from 'react';

interface DiscordMessage {
  messageId: string;
  author: string;
  content: string;
  sentimentScore: number | null;
  channelId: string;
  createdAt: string;
}

interface SentimentData {
  avgScore: number;
  messageCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  latestMessages: DiscordMessage[];
}

export default function DiscordSentimentFeed() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/trpc/projectO.getDiscordSentiment?input=' + encodeURIComponent(JSON.stringify({ limit: 50 })));
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const result = await response.json();
        setData(result.result?.data || {
          avgScore: 0,
          messageCount: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          latestMessages: [],
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg border border-cyan-500/20 bg-black/40">
        <h3 className="text-lg font-semibold text-white mb-4">Discord Sentiment</h3>
        <div className="text-white/50 text-sm">Loading sentiment data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-500/20 bg-black/40">
        <h3 className="text-lg font-semibold text-white mb-4">Discord Sentiment</h3>
        <div className="text-red-400/70 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.messageCount === 0) {
    return (
      <div className="p-6 rounded-lg border border-cyan-500/20 bg-black/40">
        <h3 className="text-lg font-semibold text-white mb-4">Discord Sentiment</h3>
        <div className="text-white/50 text-sm">No sentiment data available</div>
      </div>
    );
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="p-6 rounded-lg border border-cyan-500/20 bg-black/40">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Discord Sentiment</h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getSentimentColor(data.avgScore)}`}>
            {data.avgScore.toFixed(2)}
          </div>
          <div className="text-xs text-white/60">{getSentimentLabel(data.avgScore)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 rounded bg-green-500/10 border border-green-500/20">
          <div className="text-lg font-semibold text-green-400">{data.positiveCount}</div>
          <div className="text-xs text-white/60">Positive</div>
        </div>
        <div className="text-center p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
          <div className="text-lg font-semibold text-yellow-400">{data.neutralCount}</div>
          <div className="text-xs text-white/60">Neutral</div>
        </div>
        <div className="text-center p-3 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-lg font-semibold text-red-400">{data.negativeCount}</div>
          <div className="text-xs text-white/60">Negative</div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-medium text-white/70 mb-2">Latest Messages</h4>
        {data.latestMessages.map((message) => (
          <div
            key={message.messageId}
            className="p-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-sm font-medium text-white">{message.author}</div>
              {message.sentimentScore !== null && (
                <div className={`text-xs ${getSentimentColor(message.sentimentScore)}`}>
                  {message.sentimentScore.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-sm text-white/80 mb-1">{message.content}</div>
            <div className="text-xs text-white/50">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-white/60 text-center">
        {data.messageCount} messages analyzed
      </div>
    </div>
  );
}

