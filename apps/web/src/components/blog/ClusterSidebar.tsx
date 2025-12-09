/**
 * ClusterSidebar Component
 *
 * Displays related posts within the same topic cluster.
 * Implements the Topic Cluster SEO model by showing:
 * - The pillar page (comprehensive guide) prominently
 * - Related cluster articles for internal linking
 *
 * This contextual navigation:
 * 1. Signals topic authority to search engines
 * 2. Improves user engagement with related content
 * 3. Supports the "Pillar + Cluster" content strategy
 *
 * @see lib/api/blog.ts for data fetching
 * @see packages/db/src/schema/blogPosts.ts for schema
 */

import Link from 'next/link';
import { BookOpen, ArrowRight, Crown, FileText, Clock } from 'lucide-react';
import type { RelatedPost } from '@/lib/api/blog';

// =============================================================================
// Types
// =============================================================================

interface ClusterSidebarProps {
  /** Cluster information */
  cluster: {
    name: string;
    slug: string;
    color?: string | null;
  };
  /** The pillar page for this cluster */
  pillarPost: RelatedPost | null;
  /** Related posts in the same cluster */
  relatedPosts: RelatedPost[];
  /** Current post ID (to highlight or exclude) */
  currentPostId: string;
  /** Whether current post is the pillar */
  isCurrentPillar?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ClusterSidebar({
  cluster,
  pillarPost,
  relatedPosts,
  currentPostId,
  isCurrentPillar = false,
}: ClusterSidebarProps) {
  // Filter out the current post from related posts
  const otherPosts = relatedPosts.filter((post) => post.id !== currentPostId);

  // Determine accent color based on cluster color
  const accentColor = cluster.color || 'cyan';
  const colorClasses = getColorClasses(accentColor);

  // Don't render if no related content
  if (!pillarPost && otherPosts.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-28">
      <div className={`border ${colorClasses.border} bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${colorClasses.border} ${colorClasses.headerBg} flex items-center gap-2`}>
          <BookOpen className={`w-4 h-4 ${colorClasses.text}`} />
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold ${colorClasses.text} uppercase tracking-wider font-sans truncate`}>
              {cluster.name}
            </h4>
            <p className="text-[10px] text-slate-500">Topic Cluster</p>
          </div>
        </div>

        {/* Pillar Post (Comprehensive Guide) */}
        {pillarPost && !isCurrentPillar && (
          <div className="p-3 border-b border-slate-700/50">
            <Link
              href={`/blog/${pillarPost.slug}`}
              className={`group block p-3 rounded-lg ${colorClasses.pillarBg} border ${colorClasses.pillarBorder} hover:border-opacity-100 transition-all`}
            >
              <div className="flex items-start gap-2 mb-2">
                <Crown className={`w-4 h-4 ${colorClasses.pillarIcon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold ${colorClasses.pillarIcon} uppercase tracking-wider`}>
                    Pillar Guide
                  </span>
                  <h5 className={`text-sm font-medium text-slate-200 group-hover:${colorClasses.textHover} transition-colors line-clamp-2 mt-0.5`}>
                    {pillarPost.title}
                  </h5>
                </div>
              </div>
              {pillarPost.excerpt && (
                <p className="text-xs text-slate-400 line-clamp-2 ml-6">
                  {pillarPost.excerpt}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 ml-6 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{pillarPost.readingTimeMinutes} min read</span>
              </div>
            </Link>
          </div>
        )}

        {/* Current Post Indicator (if viewing pillar) */}
        {isCurrentPillar && (
          <div className="p-3 border-b border-slate-700/50">
            <div className={`p-3 rounded-lg bg-slate-800/50 border ${colorClasses.border}`}>
              <div className="flex items-center gap-2">
                <Crown className={`w-4 h-4 ${colorClasses.pillarIcon}`} />
                <span className="text-xs text-slate-400">
                  You&apos;re reading the pillar guide
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts List */}
        {otherPosts.length > 0 && (
          <div className="p-3 space-y-1 max-h-[50vh] overflow-y-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-sans mb-2 px-1">
              Related Articles
            </p>
            {otherPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium text-slate-300 group-hover:${colorClasses.textHover} transition-colors line-clamp-2`}>
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{post.readingTimeMinutes} min</span>
                  </div>
                </div>
                <ArrowRight className={`w-3 h-3 text-slate-600 group-hover:${colorClasses.textHover} flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-all`} />
              </Link>
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-900/30">
          <Link
            href={`/blog?cluster=${cluster.slug}`}
            className={`flex items-center justify-center gap-2 text-xs ${colorClasses.text} hover:${colorClasses.textHover} transition-colors font-sans`}
          >
            <span>View all in {cluster.name}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Cluster Badge */}
      <div className="mt-4 p-3 border border-slate-700/50 bg-slate-900/30 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
          <span>
            <span className={`font-semibold ${colorClasses.text}`}>
              {otherPosts.length + (pillarPost && !isCurrentPillar ? 1 : 0)}
            </span>
            {' '}articles in this topic
          </span>
        </div>
      </div>
    </aside>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get Tailwind color classes for a given accent color
 */
function getColorClasses(color: string): {
  border: string;
  text: string;
  textHover: string;
  headerBg: string;
  pillarBg: string;
  pillarBorder: string;
  pillarIcon: string;
  dot: string;
} {
  const colorMap: Record<string, ReturnType<typeof getColorClasses>> = {
    cyan: {
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      textHover: 'text-cyan-300',
      headerBg: 'bg-cyan-950/30',
      pillarBg: 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10',
      pillarBorder: 'border-cyan-500/30 border-opacity-50',
      pillarIcon: 'text-cyan-400',
      dot: 'bg-cyan-400',
    },
    purple: {
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      textHover: 'text-purple-300',
      headerBg: 'bg-purple-950/30',
      pillarBg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      pillarBorder: 'border-purple-500/30 border-opacity-50',
      pillarIcon: 'text-purple-400',
      dot: 'bg-purple-400',
    },
    emerald: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      textHover: 'text-emerald-300',
      headerBg: 'bg-emerald-950/30',
      pillarBg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
      pillarBorder: 'border-emerald-500/30 border-opacity-50',
      pillarIcon: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    amber: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      textHover: 'text-amber-300',
      headerBg: 'bg-amber-950/30',
      pillarBg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
      pillarBorder: 'border-amber-500/30 border-opacity-50',
      pillarIcon: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    rose: {
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      textHover: 'text-rose-300',
      headerBg: 'bg-rose-950/30',
      pillarBg: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
      pillarBorder: 'border-rose-500/30 border-opacity-50',
      pillarIcon: 'text-rose-400',
      dot: 'bg-rose-400',
    },
    blue: {
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      textHover: 'text-blue-300',
      headerBg: 'bg-blue-950/30',
      pillarBg: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
      pillarBorder: 'border-blue-500/30 border-opacity-50',
      pillarIcon: 'text-blue-400',
      dot: 'bg-blue-400',
    },
  };

  return colorMap[color] || colorMap.cyan;
}

export default ClusterSidebar;
