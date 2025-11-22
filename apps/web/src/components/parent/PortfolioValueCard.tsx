/**
 * Portfolio Value Card - Real-time portfolio value display
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface Portfolio {
  id: string;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  holdingsCount: number;
}

interface PortfolioValueCardProps {
  childId: string;
}

export function PortfolioValueCard({ childId }: PortfolioValueCardProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPortfolio();
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [childId]);

  const fetchPortfolio = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      // In production, this would fetch from /api/portfolio/[userId]
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      setPortfolio({
        id: 'portfolio-1',
        totalValue: 12450.75,
        totalCost: 10000.0,
        gainLoss: 2450.75,
        gainLossPercent: 24.51,
        holdingsCount: 15,
      });
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-ink/95 border border-cyan-500/20 rounded-lg p-6 backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-cyan-500/20 rounded w-1/2"></div>
          <div className="h-12 bg-cyan-500/20 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-cyan-500/20 rounded"></div>
            <div className="h-4 bg-cyan-500/20 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-ink/95 border border-cyan-500/20 rounded-lg p-6 backdrop-blur-xl">
        <div className="text-center text-slate-400">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No portfolio data available</p>
        </div>
      </div>
    );
  }

  const isPositive = portfolio.gainLoss >= 0;

  return (
    <div className="bg-ink/95 border border-cyan-500/20 rounded-lg p-6 backdrop-blur-xl hover:border-cyan-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Portfolio Value</h2>
        </div>
        <button
          onClick={() => fetchPortfolio(true)}
          disabled={refreshing}
          className="p-2 hover:bg-cyan-400/10 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Refresh portfolio"
        >
          <RefreshCw className={`h-5 w-5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Total Value */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-1">Total Value</p>
        <p className="text-4xl font-bold text-white">
          ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Gain/Loss */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-400 mb-1">Cost Basis</p>
          <p className="text-lg font-semibold text-slate-300">
            ${portfolio.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Gain/Loss</p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <div>
              <p
                className={`text-lg font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ${Math.abs(portfolio.gainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}
                {portfolio.gainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Count */}
      <div className="pt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Total Holdings</p>
          <p className="text-lg font-semibold text-cyan-400">{portfolio.holdingsCount}</p>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Real-time updates every 30s</span>
      </div>
    </div>
  );
}
