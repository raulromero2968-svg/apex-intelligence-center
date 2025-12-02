'use client';

import Link from 'next/link';
import { api } from '@/trpc/react';
import {
  Award,
  BookOpen,
  ThumbsUp,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  Shield,
  AlertCircle,
} from 'lucide-react';

const contributorLevelColors: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  silver: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  platinum: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const LEVEL_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 2000,
};

export function Dashboard() {
  const { data, isLoading, error } = api.apexCommons.getDashboardStats.useQuery();
  const { data: leaderboard } = api.apexCommons.getLeaderboard.useQuery({ type: 'reputation', limit: 5 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-2">Failed to load dashboard</p>
        <p className="text-slate-500 text-sm">{error.message}</p>
        <Link
          href="/login"
          className="inline-block mt-4 text-cyan-400 hover:text-cyan-300"
        >
          Please sign in to view your dashboard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { profile, resourceStats, recentTransactions, pendingResourcesCount } = data;
  const levelColors = contributorLevelColors[profile.contributorLevel];

  // Calculate progress to next level
  const currentLevel = profile.contributorLevel;
  const levels = ['bronze', 'silver', 'gold', 'platinum'] as const;
  const currentLevelIndex = levels.indexOf(currentLevel);
  const nextLevel = currentLevelIndex < 3 ? levels[currentLevelIndex + 1] : null;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : LEVEL_THRESHOLDS.platinum;
  const progressToNext = nextLevel
    ? ((profile.reputationCredits - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  return (
    <div className="space-y-8">
      {/* Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RC Card */}
        <div className={`p-6 rounded-xl ${levelColors.bg} border ${levelColors.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${levelColors.bg}`}>
                <Award className={`w-8 h-8 ${levelColors.text}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Reputation Credits</p>
                <p className={`text-3xl font-bold ${levelColors.text}`}>
                  {profile.reputationCredits.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={levelColors.text}>
                {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
              </span>
              {nextLevel && (
                <span className="text-slate-400">
                  {nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} ({nextThreshold - profile.reputationCredits} RC needed)
                </span>
              )}
            </div>
            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${levelColors.text.replace('text', 'bg')} transition-all duration-500`}
                style={{ width: `${Math.min(100, progressToNext)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Resources</p>
              <p className="text-2xl font-bold text-white">{resourceStats?.total || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-white">{resourceStats?.totalViews || 0}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" /> Views
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{resourceStats?.totalDownloads || 0}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Downloads
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{resourceStats?.totalUpvotes || 0}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Upvotes
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-purple-500/30">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/library/contribute"
              className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Resource
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/library/governance"
              className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                View Proposals
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Moderator Section */}
      {['moderator', 'admin'].includes(profile.role) && pendingResourcesCount > 0 && (
        <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-bold text-white">Moderation Queue</h3>
                <p className="text-sm text-slate-400">
                  {pendingResourcesCount} resource{pendingResourcesCount !== 1 ? 's' : ''} pending review
                </p>
              </div>
            </div>
            <Link
              href="/library/moderation"
              className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Review Queue
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Activity
          </h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 ? (
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white">
                        {tx.reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount} RC
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No recent activity</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-purple-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            Top Contributors
          </h3>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((user, index) => {
                const colors = contributorLevelColors[user.contributorLevel];
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-500/30 text-yellow-400'
                            : index === 1
                            ? 'bg-slate-400/30 text-slate-300'
                            : index === 2
                            ? 'bg-orange-500/30 text-orange-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {user.rank}
                      </span>
                      <div>
                        <p className="text-sm text-white">{user.name}</p>
                        <p className={`text-xs ${colors.text}`}>
                          {user.contributorLevel.charAt(0).toUpperCase() + user.contributorLevel.slice(1)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-cyan-400">
                      {user.reputationCredits.toLocaleString()} RC
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No contributors yet</p>
          )}
          <Link
            href="/library/leaderboard"
            className="block mt-4 text-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View Full Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
