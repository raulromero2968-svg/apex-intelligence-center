'use client';

/**
 * TopicClusterNav Component
 *
 * SEO-focused navigation for topic cluster architecture.
 * Shows pillar ↔ cluster relationships for internal linking.
 *
 * Features:
 * - Visual pillar/cluster hierarchy
 * - Related posts navigation
 * - Progress tracking through cluster
 * - SEO-optimized internal links
 *
 * Usage:
 * ```tsx
 * <TopicClusterNav
 *   currentSlug="grading-psa-10-guide"
 *   clusterId="pokemon-grading-cluster"
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  Crown,
  FileText,
  Layers,
  ExternalLink,
  CheckCircle,
  Circle,
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// Types
// ============================================================================

interface ClusterPost {
  id: string;
  slug: string;
  title: string;
  contentType: 'pillar' | 'cluster' | 'insight' | 'analysis';
  readingTimeMinutes: number;
  isRead?: boolean;
}

interface TopicCluster {
  id: string;
  name: string;
  slug: string;
  description?: string;
  targetKeyword: string;
  pillarPost: ClusterPost | null;
  clusterPosts: ClusterPost[];
  totalViews: number;
}

interface TopicClusterNavProps {
  /** Current post slug for highlighting */
  currentSlug: string;
  /** Topic cluster ID to fetch */
  clusterId?: string;
  /** Or provide data directly */
  cluster?: TopicCluster;
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Show as breadcrumb */
  asBreadcrumb?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function TopicClusterNav({
  currentSlug,
  clusterId,
  cluster: providedCluster,
  compact = false,
  asBreadcrumb = false,
}: TopicClusterNavProps) {
  const [cluster, setCluster] = useState<TopicCluster | null>(providedCluster || null);
  const [isLoading, setIsLoading] = useState(!providedCluster && !!clusterId);

  useEffect(() => {
    if (providedCluster) {
      setCluster(providedCluster);
      return;
    }

    if (!clusterId) return;

    const fetchCluster = async () => {
      try {
        const response = await fetch(`/api/blog/cluster/${clusterId}`);
        if (response.ok) {
          const data = await response.json();
          setCluster(data.cluster);
        }
      } catch (error) {
        console.error('Failed to fetch cluster:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCluster();
  }, [clusterId, providedCluster]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-800/50 rounded-xl h-24" />
    );
  }

  if (!cluster) {
    return null;
  }

  // Breadcrumb mode
  if (asBreadcrumb) {
    return (
      <BreadcrumbNav
        cluster={cluster}
        currentSlug={currentSlug}
      />
    );
  }

  // Compact mode for sidebar
  if (compact) {
    return (
      <CompactNav
        cluster={cluster}
        currentSlug={currentSlug}
      />
    );
  }

  // Full navigation
  return (
    <FullNav
      cluster={cluster}
      currentSlug={currentSlug}
    />
  );
}

// ============================================================================
// Breadcrumb Navigation
// ============================================================================

function BreadcrumbNav({
  cluster,
  currentSlug,
}: {
  cluster: TopicCluster;
  currentSlug: string;
}) {
  const currentPost = [cluster.pillarPost, ...cluster.clusterPosts]
    .filter(Boolean)
    .find((p) => p?.slug === currentSlug);

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
      <Link
        href="/blog"
        className="hover:text-cyan-400 transition-colors"
      >
        Blog
      </Link>
      <ChevronRight className="w-4 h-4" />
      <Link
        href={`/blog/topic/${cluster.slug}`}
        className="hover:text-cyan-400 transition-colors"
      >
        {cluster.name}
      </Link>
      {currentPost && currentPost.slug !== cluster.pillarPost?.slug && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white truncate max-w-[200px]">
            {currentPost.title}
          </span>
        </>
      )}
    </nav>
  );
}

// ============================================================================
// Compact Navigation (Sidebar)
// ============================================================================

function CompactNav({
  cluster,
  currentSlug,
}: {
  cluster: TopicCluster;
  currentSlug: string;
}) {
  const allPosts = [cluster.pillarPost, ...cluster.clusterPosts].filter(Boolean) as ClusterPost[];
  const currentIndex = allPosts.findIndex((p) => p.slug === currentSlug);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / allPosts.length) * 100 : 0;

  return (
    <aside className="rounded-xl border border-cyan-500/30 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/30 bg-cyan-950/30">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-400">
            {cluster.name}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {currentIndex + 1} of {allPosts.length} articles
        </p>
      </div>

      {/* Posts List */}
      <nav className="p-2 max-h-80 overflow-y-auto">
        <ul className="space-y-1">
          {allPosts.map((post, index) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className={clsx(
                  'flex items-start gap-2 px-2 py-1.5 rounded-lg text-sm',
                  'transition-colors',
                  post.slug === currentSlug
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                {post.contentType === 'pillar' ? (
                  <Crown className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                ) : (
                  <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-xs text-slate-500 flex items-center justify-center">
                    {index}
                  </span>
                )}
                <span className="flex-1 line-clamp-2">{post.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// ============================================================================
// Full Navigation
// ============================================================================

function FullNav({
  cluster,
  currentSlug,
}: {
  cluster: TopicCluster;
  currentSlug: string;
}) {
  const allPosts = [cluster.pillarPost, ...cluster.clusterPosts].filter(Boolean) as ClusterPost[];

  return (
    <aside className="my-8 rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 to-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">{cluster.name}</h3>
            {cluster.description && (
              <p className="text-sm text-slate-400 mt-0.5">{cluster.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span>{allPosts.length} articles</span>
          <span>·</span>
          <span>
            {allPosts.reduce((acc, p) => acc + p.readingTimeMinutes, 0)} min total read
          </span>
        </div>
      </div>

      {/* Pillar Post */}
      {cluster.pillarPost && (
        <div className="px-6 py-4 border-b border-slate-700/50 bg-yellow-500/5">
          <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pillar Article
          </p>
          <Link
            href={`/blog/${cluster.pillarPost.slug}`}
            className={clsx(
              'block group',
              cluster.pillarPost.slug === currentSlug && 'pointer-events-none'
            )}
          >
            <h4
              className={clsx(
                'font-medium transition-colors',
                cluster.pillarPost.slug === currentSlug
                  ? 'text-cyan-400'
                  : 'text-white group-hover:text-cyan-400'
              )}
            >
              {cluster.pillarPost.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {cluster.pillarPost.readingTimeMinutes} min read
            </p>
          </Link>
        </div>
      )}

      {/* Cluster Posts */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Related Articles
        </p>
        <ul className="space-y-3">
          {cluster.clusterPosts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className={clsx(
                  'flex items-start gap-3 group',
                  post.slug === currentSlug && 'pointer-events-none'
                )}
              >
                {post.isRead ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 text-slate-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h5
                    className={clsx(
                      'text-sm transition-colors',
                      post.slug === currentSlug
                        ? 'text-cyan-400 font-medium'
                        : 'text-slate-300 group-hover:text-white'
                    )}
                  >
                    {post.title}
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {post.readingTimeMinutes} min read
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer - View all in cluster */}
      <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30">
        <Link
          href={`/blog/topic/${cluster.slug}`}
          className="flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>View all in {cluster.name}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { TopicClusterNav, type TopicCluster, type ClusterPost };
