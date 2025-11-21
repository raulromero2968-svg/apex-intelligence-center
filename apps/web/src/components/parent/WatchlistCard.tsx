/**
 * Watchlist Card - Display child's watchlist items
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface WatchlistItem {
  id: string;
  cardName: string;
  cardSet: string;
  targetPrice: number;
  currentPrice: number;
  direction: 'above' | 'below';
  isTriggered: boolean;
}

interface WatchlistCardProps {
  childId: string;
}

export function WatchlistCard({ childId }: WatchlistCardProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, [childId]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);

      // In production, this would fetch from /api/watchlist?userId=[childId]
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock data
      setItems([
        {
          id: 'w1',
          cardName: 'Charizard',
          cardSet: 'Base Set',
          targetPrice: 15000,
          currentPrice: 14250,
          direction: 'above',
          isTriggered: false,
        },
        {
          id: 'w2',
          cardName: 'Pikachu VMAX',
          cardSet: 'Vivid Voltage',
          targetPrice: 200,
          currentPrice: 185,
          direction: 'below',
          isTriggered: true,
        },
        {
          id: 'w3',
          cardName: 'Lugia EX',
          cardSet: 'Silver Tempest',
          targetPrice: 500,
          currentPrice: 520,
          direction: 'above',
          isTriggered: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-ink/95 border border-purple-500/20 rounded-lg p-6 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-purple-500/20 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-16 bg-purple-500/20 rounded"></div>
            <div className="h-16 bg-purple-500/20 rounded"></div>
            <div className="h-16 bg-purple-500/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink/95 border border-purple-500/20 rounded-lg p-6 backdrop-blur-xl hover:border-purple-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Eye className="h-6 w-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Watchlist</h2>
        <span className="ml-auto text-sm text-slate-400">{items.length} items</span>
      </div>

      {/* Watchlist Items */}
      {items.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No watchlist items</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => {
            const isPriceMet =
              item.direction === 'above'
                ? item.currentPrice >= item.targetPrice
                : item.currentPrice <= item.targetPrice;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.isTriggered
                    ? 'bg-green-500/10 border-green-400/30'
                    : 'bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{item.cardName}</h3>
                      {item.isTriggered && (
                        <AlertCircle className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.cardSet}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {item.direction === 'above' ? (
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-purple-400" />
                      )}
                      <p className="text-sm text-slate-400">
                        Target: ${item.targetPrice.toLocaleString()}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        isPriceMet ? 'text-green-400' : 'text-white'
                      }`}
                    >
                      ${item.currentPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
