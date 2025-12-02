'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { ResourceCard } from './ResourceCard';
import { Search, Filter, ChevronDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const SUBJECTS = [
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
  'Pre-K',
  'Kindergarten',
  'Elementary (1-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'Higher Education',
  'Adult Learning',
];

const RESOURCE_TYPES = [
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
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
];

type SortOption = 'newest' | 'oldest' | 'popular' | 'top_rated' | 'most_downloaded';
type ResourceType = 'lesson_plan' | 'worksheet' | 'video' | 'article' | 'presentation' | 'assessment' | 'template' | 'other';

export function ResourceGrid() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<{
    subject?: string;
    gradeLevel?: string;
    resourceType?: ResourceType;
    category?: string;
  }>({});
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, error } = api.apexCommons.listResources.useQuery({
    filters,
    search: debouncedSearch || undefined,
    sort,
    pagination: { page, limit: 12 },
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || debouncedSearch;

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="appearance-none px-4 py-3 pr-10 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400/60 cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'bg-slate-900/50 border-cyan-500/30 text-white hover:border-cyan-400/60'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-white rounded-full">
              {Object.values(filters).filter(Boolean).length + (debouncedSearch ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
              <select
                value={filters.subject || ''}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400/60"
              >
                <option value="">All Subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject} className="bg-slate-800">
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Grade Level</label>
              <select
                value={filters.gradeLevel || ''}
                onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400/60"
              >
                <option value="">All Grades</option>
                {GRADE_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-slate-800">
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <select
                value={filters.resourceType || ''}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400/60"
              >
                <option value="">All Types</option>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-800">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading resources...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">Failed to load resources</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.resources.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
          <p className="text-slate-400 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms'
              : 'Be the first to contribute a resource!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Resource Grid */}
      {!isLoading && !error && data && data.resources.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-slate-400">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Results count */}
          <p className="text-center text-sm text-slate-500">
            Showing {data.resources.length} of {data.pagination.total} resources
          </p>
        </>
      )}
    </div>
  );
}
