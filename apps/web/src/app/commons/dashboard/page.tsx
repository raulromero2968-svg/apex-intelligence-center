'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  TrendingUp,
  Eye,
  Download,
  ThumbsUp,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { trpc } from '@/lib/trpc';
import { RC_CONFIG } from '@/lib/commons/constants';

export default function TeacherDashboardPage() {
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('success');

  const { data: stats, isLoading } = trpc.commons.user.getStats.useQuery();
  const { data: myResources } = trpc.commons.resource.browse.useQuery({
    status: 'approved',
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-64 bg-slate-800 rounded" />
            <div className="grid md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = stats?.profile;
  const resources = stats?.resources ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
  const engagement = stats?.engagement ?? { totalViews: 0, totalDownloads: 0, totalUpvotes: 0, totalDownvotes: 0 };
  const rcLast30Days = stats?.rcLast30Days ?? 0;

  // Calculate contributor level progress
  const currentLevel = profile?.contributorLevel ?? 'bronze';
  const currentRc = profile?.reputationCredits ?? 0;
  const levelConfig = RC_CONFIG.LEVELS[currentLevel as keyof typeof RC_CONFIG.LEVELS];
  const nextLevel = currentLevel === 'bronze' ? 'silver' : currentLevel === 'silver' ? 'gold' : currentLevel === 'gold' ? 'platinum' : null;
  const nextLevelConfig = nextLevel ? RC_CONFIG.LEVELS[nextLevel as keyof typeof RC_CONFIG.LEVELS] : null;
  const progressToNext = nextLevelConfig
    ? ((currentRc - levelConfig.min) / (nextLevelConfig.min - levelConfig.min)) * 100
    : 100;

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Success Banner */}
      {successMessage === 'resource_submitted' && (
        <div className="px-6 md:px-12 mb-6">
          <div className="max-w-6xl mx-auto">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400">
                Your resource has been submitted for review! You'll be notified when it's approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-slate-400">
                Track your contributions and impact on the community
              </p>
            </div>
            <Link
              href="/commons/contribute"
              className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
            >
              <Plus className="w-5 h-5" />
              New Resource
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Resources */}
            <HoloCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Resources</p>
                  <p className="text-3xl font-bold text-white">{resources.total}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-green-400">{resources.approved} approved</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400">{resources.pending} pending</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </HoloCard>

            {/* Total Views */}
            <HoloCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-white">{engagement.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">Across all resources</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </HoloCard>

            {/* Total Downloads */}
            <HoloCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Downloads</p>
                  <p className="text-3xl font-bold text-white">{engagement.totalDownloads.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">Files downloaded</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </HoloCard>

            {/* Net Upvotes */}
            <HoloCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Net Upvotes</p>
                  <p className="text-3xl font-bold text-white">
                    {engagement.totalUpvotes - engagement.totalDownvotes >= 0 ? '+' : ''}
                    {engagement.totalUpvotes - engagement.totalDownvotes}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Community rating</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </HoloCard>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Resources */}
              <HoloCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Your Resources</h2>
                  <Link
                    href="/commons/browse"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View all <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {myResources?.resources && myResources.resources.length > 0 ? (
                  <div className="space-y-4">
                    {myResources.resources.map((resource) => (
                      <Link
                        key={resource.id}
                        href={`/commons/resource/${resource.id}`}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{resource.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {resource.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3.5 h-3.5" />
                              {resource.downloadCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {resource.upvotes - resource.downvotes}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">You haven't submitted any resources yet</p>
                    <Link
                      href="/commons/contribute"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Submit your first resource
                    </Link>
                  </div>
                )}
              </HoloCard>

              {/* Pending Review */}
              {resources.pending > 0 && (
                <HoloCard>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Pending Review</h2>
                  </div>
                  <p className="text-slate-400 mb-4">
                    You have {resources.pending} resource{resources.pending > 1 ? 's' : ''} waiting for moderator review.
                  </p>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">
                      Resources are typically reviewed within 24-48 hours. You'll be notified when the review is complete.
                    </p>
                  </div>
                </HoloCard>
              )}

              {/* Rejected Resources (if any) */}
              {resources.rejected > 0 && (
                <HoloCard>
                  <div className="flex items-center gap-3 mb-4">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-bold text-white">Needs Attention</h2>
                  </div>
                  <p className="text-slate-400">
                    You have {resources.rejected} resource{resources.rejected > 1 ? 's' : ''} that {resources.rejected > 1 ? 'were' : 'was'} not approved.
                    Review the feedback and consider updating or resubmitting.
                  </p>
                </HoloCard>
              )}
            </div>

            {/* Right Column - Profile & RC */}
            <div className="space-y-6">
              {/* RC Card */}
              <HoloCard intensity="high">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm mb-4">
                    <Star className="w-4 h-4" />
                    {levelConfig.label} Contributor
                  </div>
                  <p className="text-4xl font-bold text-white mb-1">{currentRc.toLocaleString()}</p>
                  <p className="text-slate-400">Reputation Credits</p>
                </div>

                {/* Progress to next level */}
                {nextLevelConfig && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">{levelConfig.label}</span>
                      <span className="text-slate-400">{nextLevelConfig.label}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(progressToNext, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      {nextLevelConfig.min - currentRc} RC to {nextLevelConfig.label}
                    </p>
                  </div>
                )}

                {/* RC Earned Last 30 Days */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last 30 days</span>
                    <span className="font-bold text-green-400">+{rcLast30Days} RC</span>
                  </div>
                </div>
              </HoloCard>

              {/* How to Earn RC */}
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">Earn More RC</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Resource approved</span>
                    <span className="text-green-400">+{RC_CONFIG.RESOURCE_APPROVED} RC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">First resource bonus</span>
                    <span className="text-green-400">+{RC_CONFIG.FIRST_RESOURCE_BONUS} RC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Resource upvoted</span>
                    <span className="text-green-400">+{RC_CONFIG.RESOURCE_UPVOTE} RC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Resource downloaded</span>
                    <span className="text-green-400">+{RC_CONFIG.RESOURCE_DOWNLOAD} RC</span>
                  </div>
                </div>
              </HoloCard>

              {/* Quick Links */}
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href="/commons/browse"
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <span className="text-slate-300">Browse Library</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                  </Link>
                  <Link
                    href="/commons/governance"
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <span className="text-slate-300">Governance</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                  </Link>
                  <Link
                    href="/commons"
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <span className="text-slate-300">Commons Essays</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                  </Link>
                </div>
              </HoloCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
