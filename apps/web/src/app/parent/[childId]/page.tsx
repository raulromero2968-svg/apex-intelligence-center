/**
 * Parent Dashboard - Full Access
 *
 * Allows parents to monitor and control their child's account
 * Features:
 * - Real-time portfolio value
 * - Watchlist & alerts
 * - Session history
 * - Parental controls (bedtime, cooldown, spending)
 * - Account freeze button (instant, child cannot unfreeze)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User } from '@/db/schema';
import {
  Shield,
  Clock,
  Moon,
  DollarSign,
  Activity,
  AlertTriangle,
  Eye,
  Snowflake,
  ArrowLeft,
} from 'lucide-react';
import { PortfolioValueCard } from '@/components/parent/PortfolioValueCard';
import { WatchlistCard } from '@/components/parent/WatchlistCard';
import { AlertsCard } from '@/components/parent/AlertsCard';
import { SessionHistoryCard } from '@/components/parent/SessionHistoryCard';
import { ParentalControlsCard } from '@/components/parent/ParentalControlsCard';
import { FreezeAccountButton } from '@/components/parent/FreezeAccountButton';

interface ChildAccount extends User {
  portfolioValue?: number;
}

export default function ParentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params?.childId as string;

  const [child, setChild] = useState<ChildAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (childId) {
      fetchChildData();
    }
  }, [childId, refreshKey]);

  const fetchChildData = async () => {
    try {
      setLoading(true);
      // Fetch child account data
      const response = await fetch(`/api/family/link`);
      if (!response.ok) {
        throw new Error('Failed to fetch child data');
      }

      const data = await response.json();
      const childData = data.children?.find((c: User) => c.id === childId);

      if (!childData) {
        throw new Error('Child account not found');
      }

      setChild(childData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch child data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load child data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ink via-blue-950 to-ink flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-cyan-200 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ink via-red-950 to-ink flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-ink/95 border border-red-500/30 rounded-lg p-8 text-center backdrop-blur-xl">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-300 mb-6">{error || 'Child account not found'}</p>
          <button
            onClick={() => router.push('/parent')}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-colors"
          >
            Back to Parent Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-purple-950 to-ink">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-ink/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/parent')}
                className="p-2 hover:bg-cyan-400/10 rounded-lg transition-colors"
                aria-label="Back to parent portal"
              >
                <ArrowLeft className="h-5 w-5 text-cyan-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Shield className="h-8 w-8 text-cyan-400" />
                  {child.name || 'Child Account'}
                </h1>
                <p className="text-cyan-300 text-sm mt-1 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Parent Dashboard • Full Access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Account Status Badge */}
              {child.accountFrozen ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/50 rounded-lg">
                  <Snowflake className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">Account Frozen</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/50 rounded-lg">
                  <Activity className="h-5 w-5 text-green-400" />
                  <span className="text-green-300 font-semibold">Active</span>
                </div>
              )}

              {/* Freeze/Unfreeze Button */}
              <FreezeAccountButton
                childId={childId}
                isFrozen={child.accountFrozen ?? false}
                onUpdate={handleRefresh}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner if Account is Frozen */}
        {child.accountFrozen && (
          <div className="mb-6 bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Snowflake className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-blue-300 font-semibold">Account Frozen</h3>
                <p className="text-blue-200 text-sm mt-1">
                  This account was frozen on{' '}
                  {child.accountFrozenAt
                    ? new Date(child.accountFrozenAt).toLocaleDateString()
                    : 'an unknown date'}
                  . The child cannot access their portfolio or make any changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Portfolio Value */}
          <PortfolioValueCard childId={childId} />

          {/* Parental Controls */}
          <ParentalControlsCard childId={childId} child={child} onUpdate={handleRefresh} />

          {/* Watchlist */}
          <WatchlistCard childId={childId} />

          {/* Alerts */}
          <AlertsCard childId={childId} />
        </div>

        {/* Session History - Full Width */}
        <SessionHistoryCard childId={childId} />
      </div>
    </div>
  );
}
