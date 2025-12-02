'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { ResourceCard } from '@/components/library/ResourceCard';
import { ResourceGridSkeleton } from '@/components/library/ResourceCardSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  Filter,
  ChevronDown,
  X,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  Plus,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  'All',
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
];

const GRADE_LEVELS = [
  'All',
  'Pre-K',
  'Kindergarten',
  'Elementary (1-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'Higher Education',
  'Adult Learning',
];

const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'lesson_plan', label: 'Lesson Plan' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'template', label: 'Template' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'top_rated', label: 'Highest Rated' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
];

type SortOption = 'newest' | 'oldest' | 'popular' | 'top_rated' | 'most_downloaded';
type ResourceType = 'lesson_plan' | 'worksheet' | 'video' | 'article' | 'presentation' | 'assessment' | 'template' | 'other';

// ============================================================================
// BROWSE PAGE CONTENT (with useSearchParams)
// ============================================================================

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract filters from URL or use defaults
  const urlSearch = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || 'All';
  const urlGradeLevel = searchParams.get('grade') || 'All';
  const urlResourceType = searchParams.get('type') || '';
  const urlSort = (searchParams.get('sort') as SortOption) || 'newest';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search input (allows debouncing)
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the search input (500ms delay)
  const debouncedSearch = useDebounce(localSearch, 500);

  // Sync debounced search to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) {
      params.set('q', debouncedSearch);
    } else {
      params.delete('q');
    }

    // Reset to page 1 when search changes
    if (debouncedSearch !== urlSearch) {
      params.delete('page');
    }

    const newUrl = `${pathname}?${params.toString()}`;
    const currentUrl = `${pathname}?${searchParams.toString()}`;

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearch, urlSearch, pathname, router, searchParams]);

  // Sync URL search param to local state when navigating
  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  // Build filters object for tRPC query
  const filters = {
    category: urlCategory !== 'All' ? urlCategory : undefined,
    gradeLevel: urlGradeLevel !== 'All' ? urlGradeLevel : undefined,
    resourceType: urlResourceType as ResourceType | undefined || undefined,
  };

  // tRPC Query with pagination
  const { data, isLoading, error, isFetching } = api.apexCommons.listResources.useQuery(
    {
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      ) as typeof filters,
      search: debouncedSearch || undefined,
      sort: urlSort,
      pagination: { page: urlPage, limit: 12 },
    },
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  // URL Update Handler
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'All' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Page Change Handler
  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(newPage));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setLocalSearch('');
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Check if any filters are active
  const hasActiveFilters =
    debouncedSearch ||
    urlCategory !== 'All' ||
    urlGradeLevel !== 'All' ||
    urlResourceType !== '';

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (urlCategory !== 'All' ? 1 : 0) +
    (urlGradeLevel !== 'All' ? 1 : 0) +
    (urlResourceType !== '' ? 1 : 0);

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header & Search */}
        <div className="mb-12 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            DISCOVERY_ENGINE // APEX_COMMONS
          </div>

          <h1 className="mb-4 text-4xl md:text-5xl font-black tracking-tight">
            <span className="text-white">Public Knowledge </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Library
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Open educational resources curated by the community.
            Share a URL to instantly retrieve specific filtered views.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-full rounded-full border border-white/10 bg-white/5 px-14 py-4 text-white placeholder-slate-500 backdrop-blur focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur">
          <div className="flex flex-wrap gap-3">
            {/* Category Select */}
            <div className="relative">
              <select
                value={urlCategory}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-2 pr-10 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Grade Level Select */}
            <div className="relative">
              <select
                value={urlGradeLevel}
                onChange={(e) => updateFilter('grade', e.target.value)}
                className="appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-2 pr-10 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                {GRADE_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-slate-900">
                    {level === 'All' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Resource Type Select */}
            <div className="relative">
              <select
                value={urlResourceType}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-2 pr-10 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Sort & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort:</span>
              <div className="relative">
                <select
                  value={urlSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="appearance-none rounded-lg border-none bg-transparent py-2 pr-8 text-sm font-medium text-cyan-400 focus:ring-0 cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
              </div>
            </div>

            <Link
              href="/library/contribute"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <Plus className="w-4 h-4" />
              Contribute
            </Link>
          </div>
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {debouncedSearch && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm border border-cyan-500/30">
                <Search className="w-3 h-3" />
                &quot;{debouncedSearch}&quot;
                <button
                  onClick={() => setLocalSearch('')}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {urlCategory !== 'All' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm border border-purple-500/30">
                {urlCategory}
                <button
                  onClick={() => updateFilter('category', 'All')}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {urlGradeLevel !== 'All' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30">
                {urlGradeLevel}
                <button
                  onClick={() => updateFilter('grade', 'All')}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {urlResourceType && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm border border-yellow-500/30">
                {RESOURCE_TYPES.find((t) => t.value === urlResourceType)?.label}
                <button
                  onClick={() => updateFilter('type', '')}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Resource Grid */}
        <div className="min-h-[400px]">
          {isLoading ? (
            // Skeleton Loading State
            <ResourceGridSkeleton count={8} />
          ) : error ? (
            // Error State
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Failed to load resources</h3>
              <p className="text-slate-400 mb-4">{error.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : data?.resources.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No resources found</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query to find what you\'re looking for.'
                  : 'Be the first to contribute a resource to the library!'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border border-cyan-500/40 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors"
                >
                  Clear all filters
                </button>
              ) : (
                <Link
                  href="/library/contribute"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Contribute Resource
                </Link>
              )}
            </div>
          ) : (
            // Data Render
            <>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                {data?.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(urlPage - 1)}
                      disabled={urlPage === 1}
                      className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (data.pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (urlPage <= 3) {
                          pageNum = i + 1;
                        } else if (urlPage >= data.pagination.totalPages - 2) {
                          pageNum = data.pagination.totalPages - 4 + i;
                        } else {
                          pageNum = urlPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              pageNum === urlPage
                                ? 'bg-cyan-500 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage(urlPage + 1)}
                      disabled={urlPage === data.pagination.totalPages}
                      className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  <p className="text-sm text-slate-500">
                    Showing {(urlPage - 1) * 12 + 1} - {Math.min(urlPage * 12, data.pagination.total)} of {data.pagination.total} resources
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* URL Sharing Info */}
        <div className="mt-16 text-center border-t border-white/5 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-400 text-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Share this URL to let others see your exact filtered view</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT (with Suspense boundary for useSearchParams)
// ============================================================================

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-12 text-center">
              <div className="h-8 w-64 mx-auto bg-slate-800/50 rounded animate-pulse mb-6" />
              <div className="h-12 w-96 mx-auto bg-slate-800/50 rounded animate-pulse mb-4" />
              <div className="h-6 w-80 mx-auto bg-slate-800/50 rounded animate-pulse mb-8" />
              <div className="h-14 max-w-2xl mx-auto bg-slate-800/50 rounded-full animate-pulse" />
            </div>
            <div className="h-16 w-full bg-slate-800/50 rounded-xl animate-pulse mb-8" />
            <ResourceGridSkeleton count={8} />
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
