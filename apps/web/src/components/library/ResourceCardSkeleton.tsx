'use client';

/**
 * Skeleton loading component that matches the ResourceCard layout.
 * Uses layout-matching skeletons to reduce perceived latency.
 */
export function ResourceCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm flex flex-col animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="relative w-full h-40 overflow-hidden border-b border-cyan-900/30 bg-slate-800/50">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/30 to-transparent skeleton-shimmer" />
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Type and Category badges skeleton */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="h-6 w-20 rounded-full bg-slate-800/60" />
          <div className="h-6 w-16 rounded-full bg-slate-800/60" />
        </div>

        {/* Title skeleton */}
        <div className="h-6 w-3/4 rounded bg-slate-800/60 mb-2" />

        {/* Description skeleton - two lines */}
        <div className="space-y-2 mb-3 flex-1">
          <div className="h-4 w-full rounded bg-slate-800/60" />
          <div className="h-4 w-2/3 rounded bg-slate-800/60" />
        </div>

        {/* Meta info skeleton */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="h-4 w-16 rounded bg-slate-800/60" />
          <div className="h-4 w-20 rounded bg-slate-800/60" />
        </div>

        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1 mb-3">
          <div className="h-5 w-12 rounded bg-slate-800/60" />
          <div className="h-5 w-16 rounded bg-slate-800/60" />
          <div className="h-5 w-10 rounded bg-slate-800/60" />
        </div>

        {/* Stats skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-4 w-8 rounded bg-slate-800/60" />
            <div className="h-4 w-8 rounded bg-slate-800/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-8 rounded bg-slate-800/60" />
            <div className="h-4 w-8 rounded bg-slate-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for loading state.
 * Renders a specified number of skeleton cards in a responsive grid.
 */
export function ResourceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  );
}
