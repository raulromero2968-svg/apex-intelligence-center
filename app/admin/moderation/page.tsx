/**
 * Admin Moderation Queue - Review and moderate pending reports
 *
 * Features:
 * - Real-time updates via WebSocket
 * - Batch approve/reject actions
 * - Filter by category and market
 * - Full content preview
 * - Audit trail visibility
 *
 * Reference: knowledge-05-security-oauth2-jwt.md (RBAC)
 *
 * @module app/admin/moderation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModerationQueue } from '@/hooks/useRealTimeReports';

// =============================================================================
// TYPES
// =============================================================================

interface PendingReport {
  id: string;
  userId: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tier: string;
  postedTo: string;
  game: string;
  tags: string[];
  createdAt: string;
  publishedAt: string;
  author: {
    name: string;
    avatar: string;
    isTrusted: boolean;
  };
}

interface ModerationAction {
  reportId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

// =============================================================================
// MODERATION PAGE COMPONENT
// =============================================================================

export default function ModerationPage() {
  // State
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    postedTo: '',
  });

  // Real-time updates
  const { pendingReports: newPendingReports, isConnected } = useModerationQueue({
    onNewPending: (report) => {
      // Add new pending report to the top of the list
      setReports((prev) => {
        const exists = prev.some((r) => r.id === report.id);
        if (exists) return prev;
        return [{
          id: report.id,
          userId: report.authorId,
          title: report.title,
          slug: report.slug,
          summary: report.summary,
          content: '',
          category: report.category,
          tier: report.tier,
          postedTo: report.postedTo,
          game: report.game,
          tags: report.tags,
          createdAt: report.publishedAt,
          publishedAt: report.publishedAt,
          author: {
            name: report.authorName || 'Unknown',
            avatar: '',
            isTrusted: false,
          },
        }, ...prev];
      });
    },
  });

  // Fetch pending reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.category && { category: filters.category }),
        ...(filters.postedTo && { postedTo: filters.postedTo }),
      });

      const response = await fetch(`/api/moderate/report?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.reports);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle single report moderation
  const handleModerate = async (reportId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (status === 'rejected' && !reason) {
      setError('Rejection requires a reason');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('/api/moderate/report', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status, reason }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Moderation failed');
      }

      // Remove from list
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setSelectedReports((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
      setExpandedReport(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moderation failed');
    } finally {
      setProcessing(false);
    }
  };

  // Handle batch moderation
  const handleBatchModerate = async (status: 'approved' | 'rejected') => {
    if (selectedReports.size === 0) return;

    if (status === 'rejected' && !rejectReason) {
      setError('Rejection requires a reason');
      return;
    }

    try {
      setProcessing(true);
      const actions: ModerationAction[] = Array.from(selectedReports).map((reportId) => ({
        reportId,
        status,
        ...(status === 'rejected' && { reason: rejectReason }),
      }));

      const response = await fetch('/api/moderate/report', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: actions }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Batch moderation failed');
      }

      // Remove processed reports
      const processed = new Set(data.results.filter((r: any) => r.success).map((r: any) => r.reportId));
      setReports((prev) => prev.filter((r) => !processed.has(r.id)));
      setSelectedReports(new Set());
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch moderation failed');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle report selection
  const toggleSelection = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  // Select all visible reports
  const selectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map((r) => r.id)));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      market_analysis: 'bg-blue-600',
      price_prediction: 'bg-purple-600',
      breaking_news: 'bg-red-600',
      tutorial: 'bg-green-600',
      opinion: 'bg-yellow-600',
      research: 'bg-indigo-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Moderation Queue</h1>
            <p className="text-gray-400 mt-1">
              Review and moderate pending reports
              {isConnected && (
                <span className="ml-2 inline-flex items-center text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                  Live
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {reports.length} pending
            </span>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-400 hover:text-red-300 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="market_analysis">Market Analysis</option>
            <option value="price_prediction">Price Prediction</option>
            <option value="breaking_news">Breaking News</option>
            <option value="tutorial">Tutorial</option>
            <option value="opinion">Opinion</option>
            <option value="research">Research</option>
          </select>

          <select
            value={filters.postedTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, postedTo: e.target.value }))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Markets</option>
            <option value="commons">Commons</option>
            <option value="rc_market">RC Market</option>
          </select>
        </div>

        {/* Batch actions */}
        {selectedReports.size > 0 && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg flex items-center gap-4">
            <span className="text-gray-300">
              {selectedReports.size} selected
            </span>
            <button
              onClick={() => handleBatchModerate('approved')}
              disabled={processing}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg transition"
            >
              Approve All
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => handleBatchModerate('rejected')}
                disabled={processing || !rejectReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition"
              >
                Reject All
              </button>
            </div>
            <button
              onClick={() => setSelectedReports(new Set())}
              className="ml-auto text-gray-400 hover:text-white"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold mb-2">Queue is empty!</h2>
            <p className="text-gray-400">All reports have been moderated.</p>
          </div>
        )}

        {/* Reports list */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {/* Select all header */}
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedReports.size === reports.length}
                onChange={selectAll}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">Select all</span>
            </div>

            {/* Report cards */}
            {reports.map((report) => (
              <div
                key={report.id}
                className={`p-4 bg-gray-800 rounded-lg border ${
                  selectedReports.has(report.id)
                    ? 'border-blue-500'
                    : 'border-gray-700'
                } transition`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReports.has(report.id)}
                    onChange={() => toggleSelection(report.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(report.category)}`}>
                        {report.category.replace('_', ' ')}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {report.postedTo === 'both' ? 'Commons & RC' : report.postedTo}
                      </span>
                      {report.author.isTrusted && (
                        <span className="px-2 py-1 text-xs bg-yellow-600 rounded">
                          Trusted Author
                        </span>
                      )}
                      <span className="text-gray-500 text-sm ml-auto">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    {/* Title and author */}
                    <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">
                      by {report.author.name || 'Anonymous'}
                    </p>

                    {/* Summary */}
                    <p className="text-gray-300 mb-3">{report.summary}</p>

                    {/* Tags */}
                    {report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {report.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-700 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded content */}
                    {expandedReport === report.id && (
                      <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                        <h4 className="font-semibold mb-2">Full Content</h4>
                        <div className="prose prose-invert prose-sm max-w-none">
                          {report.content || 'Content not loaded'}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => handleModerate(report.id, 'approved')}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg transition text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setExpandedReport(
                          expandedReport === report.id ? null : report.id
                        )}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                      >
                        {expandedReport === report.id ? 'Collapse' : 'Expand'}
                      </button>
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="text"
                          placeholder="Reason for rejection..."
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-red-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                              handleModerate(report.id, 'rejected', e.currentTarget.value);
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input.value) {
                              handleModerate(report.id, 'rejected', input.value);
                            }
                          }}
                          disabled={processing}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
