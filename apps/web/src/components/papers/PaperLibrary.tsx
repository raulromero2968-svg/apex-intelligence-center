"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PaperLibraryProps {
  onSelectPaper?: (paper: PaperSummary) => void;
}

interface PaperSummary {
  id: string;
  title: string;
  abstract?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  researchTopic: string;
  citationStyle: string;
  format: string;
  citationCount: number;
  synthesisCount: number;
  isValid: boolean;
  ipfsCid?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Clock },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
  published: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle2 },
  archived: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
};

export default function PaperLibrary({ onSelectPaper }: PaperLibraryProps) {
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchPapers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      });
      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/papers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      setPapers(data.papers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.perPage, statusFilter]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this paper?')) return;

      try {
        const response = await fetch(`/api/papers/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete paper');
        }

        setPapers((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    []
  );

  const filteredPapers = papers.filter((paper) =>
    searchQuery
      ? paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.researchTopic.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="rounded-xl border border-neon-cyan/30 bg-cyber-dark/80 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-gray-700/50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/20">
              <FileText className="h-5 w-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Paper Library
              </h2>
              <p className="text-sm text-gray-400">
                {pagination.total} paper{pagination.total !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers..."
              className="w-full rounded-lg border border-gray-700 bg-cyber-darker py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            {(['draft', 'review', 'published', 'archived'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(statusFilter === status ? null : status)
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-colors ${
                    statusFilter === status
                      ? `${STATUS_STYLES[status].bg} ${STATUS_STYLES[status].text}`
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchPapers}
              className="mt-3 text-sm text-neon-cyan hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-400">No papers found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-neon-cyan hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => {
              const statusStyle = STATUS_STYLES[paper.status];
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper?.(paper)}
                  className="group cursor-pointer rounded-lg border border-gray-700/50 bg-cyber-darker/50 p-4 transition-all hover:border-neon-cyan/30 hover:bg-cyber-darker"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate font-medium text-white group-hover:text-neon-cyan">
                          {paper.title}
                        </h3>
                        <span
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs capitalize ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {paper.status}
                        </span>
                      </div>
                      <p className="mb-2 truncate text-sm text-gray-500">
                        {paper.researchTopic}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{paper.citationCount} citations</span>
                        <span>{paper.synthesisCount} synthesis</span>
                        <span className="uppercase">{paper.citationStyle}</span>
                        <span>
                          {new Date(paper.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {paper.ipfsCid && (
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${paper.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-2 text-gray-500 hover:bg-gray-700 hover:text-neon-cyan"
                          title="View on IPFS"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={(e) => handleDelete(paper.id, e)}
                        className="rounded p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                        title="Delete paper"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-700/50 px-6 py-4">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="rounded-lg bg-gray-700/50 p-2 text-gray-400 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="rounded-lg bg-gray-700/50 p-2 text-gray-400 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
