/**
 * Card Detail Page with Manipulation Shield
 *
 * Displays card information with manipulation warning banner when applicable
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ManipulationWarningBanner } from '@/components/ManipulationWarningBanner';
import { ManipulationAlert } from '@/db/schema';
import { TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface CardData {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  game: string;
  artist?: string;
  rarity?: string;
  apexScore?: number;
}

export default function CardDetailPage() {
  const params = useParams();
  const cardId = params?.id as string;

  const [card, setCard] = useState<CardData | null>(null);
  const [manipulationAlert, setManipulationAlert] = useState<ManipulationAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId) {
      fetchCardData();
      checkManipulationAlert();
    }

    // Listen for manipulation alerts (push notifications)
    const handleManipulationAlert = (event: any) => {
      const { cardName, message, combinedScore } = event.detail;
      console.log(`[ManipulationAlert] ${cardName}: ${message} (Score: ${combinedScore})`);

      // Show toast notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              message: `🛡️ ${cardName}: ${message}`,
              type: 'warning',
            },
          })
        );
      }

      // Refresh manipulation alert status
      checkManipulationAlert();
    };

    window.addEventListener('manipulation-alert', handleManipulationAlert);

    return () => {
      window.removeEventListener('manipulation-alert', handleManipulationAlert);
    };
  }, [cardId]);

  const fetchCardData = async () => {
    try {
      // For now, use mock data
      // In production, this would fetch from /api/cards/[id]
      setCard({
        id: cardId,
        name: 'Charizard',
        setName: 'Base Set',
        cardNumber: '4',
        game: 'pokemon',
        artist: 'Mitsuhiro Arita',
        rarity: 'Holo Rare',
        apexScore: 95.5,
      });
    } catch (err) {
      console.error('Failed to fetch card:', err);
      setError('Failed to load card data');
    } finally {
      setLoading(false);
    }
  };

  const checkManipulationAlert = async () => {
    try {
      const response = await fetch(`/api/manipulation/${cardId}`);
      const data = await response.json();

      if (data.hasAlert) {
        setManipulationAlert(data.alert);
      }
    } catch (err) {
      console.error('Failed to check manipulation alert:', err);
      // Silently fail - don't block page load
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-200 text-lg">Loading card data...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/50 border border-red-500/30 rounded-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Card</h2>
          <p className="text-slate-300 mb-4">{error || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-blue-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{card.name}</h1>
              <p className="text-blue-300 text-sm mt-1">
                {card.setName} #{card.cardNumber} • {card.game.toUpperCase()}
              </p>
            </div>
            {card.apexScore && (
              <div className="text-right">
                <div className="text-sm text-blue-300">Apex Score</div>
                <div className="text-3xl font-bold text-blue-400">{card.apexScore.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Manipulation Warning Banner - Non-dismissible */}
        {manipulationAlert && (
          <ManipulationWarningBanner alert={manipulationAlert} />
        )}

        {/* Card Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Card Image */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <div className="aspect-[2.5/3.5] bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="text-6xl mb-2">🃏</div>
                  <p className="text-sm">Card image placeholder</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Artist</span>
                  <span className="text-white">{card.artist || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rarity</span>
                  <span className="text-white">{card.rarity || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Market Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Market Price</h3>
                </div>
                <p className="text-3xl font-bold text-white">$12,450</p>
                <p className="text-xs text-green-400 mt-1">+5.2% (24h)</p>
              </div>

              <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Volume (24h)</h3>
                </div>
                <p className="text-3xl font-bold text-white">142</p>
                <p className="text-xs text-slate-400 mt-1">sales</p>
              </div>

              <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Liquidity</h3>
                </div>
                <p className="text-3xl font-bold text-white">High</p>
                <p className="text-xs text-slate-400 mt-1">Grade 10</p>
              </div>
            </div>

            {/* Price Chart Placeholder */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Price History</h2>
              <div className="h-64 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center">
                <p className="text-slate-500">Price chart placeholder</p>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Sales</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">PSA 10</span>
                  <span className="text-white font-semibold">$12,500</span>
                  <span className="text-slate-400 text-sm">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">PSA 10</span>
                  <span className="text-white font-semibold">$12,300</span>
                  <span className="text-slate-400 text-sm">5 hours ago</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-300">PSA 9</span>
                  <span className="text-white font-semibold">$8,200</span>
                  <span className="text-slate-400 text-sm">8 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
