'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Grid, List, BookOpen, Download, ThumbsUp, Eye, ChevronDown, X } from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { trpc } from '@/lib/trpc';
import { DISSERTATION_CHAPTERS } from '@/components/phd/constants';
import { DissertationChapterBadge } from '@/components/phd/DissertationChapterBadge';

const SUBJECTS = [
  { value: '', label: 'All Subjects' },
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'art', label: 'Art' },
  { value: 'pe', label: 'Physical Education' },
  { value: 'other', label: 'Other' },
];

const GRADE_LEVELS = [
  { value: '', label: 'All Grades' },
  { value: 'elementary', label: 'Elementary' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'professional', label: 'Professional' },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'lessonPlan', label: 'Lesson Plans' },
  { value: 'worksheet', label: 'Worksheets' },
  { value: 'assessment', label: 'Assessments' },
  { value: 'activity', label: 'Activities' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'highestRated', label: 'Highest Rated' },
];

export default function BrowseLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [gradeLevel, setGradeLevel] = useState(searchParams.get('grade') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState<'newest' | 'popular' | 'highestRated'>(
    (searchParams.get('sort') as any) || 'newest'
  );
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.commons.resource.browse.useInfiniteQuery(
    {
      search: search || undefined,
      subject: subject || undefined,
      gradeLevel: gradeLevel || undefined,
      category: category || undefined,
      sort,
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const resources = data?.pages.flatMap((page) => page.resources) ?? [];

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (subject) params.set('subject', subject);
    if (gradeLevel) params.set('grade', gradeLevel);
    if (category) params.set('category', category);
    if (sort !== 'newest') params.set('sort', sort);
    router.push(`/commons/browse?${params.toString()}`);
  }, [search, subject, gradeLevel, category, sort, router]);

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setGradeLevel('');
    setCategory('');
    setSort('newest');
    router.push('/commons/browse');
  };

  const hasActiveFilters = search || subject || gradeLevel || category || sort !== 'newest';

  return (
    <div className="relative min-h-screen pt-24 pb-16">
      {/* PhD Framework Badge */}
      <DissertationChapterBadge
        chapter={DISSERTATION_CHAPTERS.LITERATURE_REVIEW}
        variant="floating"
      />

      {/* Header */}
      <section className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Resource Library
              </h1>
              <p className="text-slate-400">
                Discover high-quality educational resources created by educators
              </p>
            </div>
            <Link
              href="/commons/contribute"
              className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
            >
              + Submit Resource
            </Link>
          </div>

          {/* Search & Filters */}
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                )}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-all"
              >
                Search
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Grade Level</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      {GRADE_LEVELS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Clear all filters
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="relative z-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Resources Found</h3>
              <p className="text-slate-400 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to contribute a resource!'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ resource }: { resource: any }) {
  const netVotes = resource.upvotes - resource.downvotes;
  const subjectLabel = SUBJECTS.find((s) => s.value === resource.subject)?.label || resource.subject;
  const gradeLabel = GRADE_LEVELS.find((g) => g.value === resource.gradeLevel)?.label || resource.gradeLevel;

  return (
    <Link
      href={`/commons/resource/${resource.id}`}
      className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Thumbnail */}
      {resource.thumbnailUrl ? (
        <div className="relative w-full h-40 overflow-hidden border-b border-cyan-900/30">
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
      ) : (
        <div className="relative w-full h-40 flex items-center justify-center bg-slate-800/50 border-b border-slate-700">
          <BookOpen className="w-12 h-12 text-slate-600" />
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {subjectLabel}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {gradeLabel}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
          {resource.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>{resource.downloadCount.toLocaleString()}</span>
          </div>
          <div className={`flex items-center gap-1 ${netVotes >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{netVotes >= 0 ? '+' : ''}{netVotes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
