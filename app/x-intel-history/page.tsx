'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Tag,
  DollarSign,
  Eye,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';

interface IntelReport {
  id: string;
  xPostUrl: string;
  xAuthor: string | null;
  title: string | null;
  content: string;
  summary: string | null;
  reportType: string;
  tags: string[];
  postedTo: string[];
  price: string;
  views: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function XIntelHistoryPage() {
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchReports = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/intel?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.data || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for development
      setReports(getMockReports());
      setPagination({
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(pagination.page);
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'flagged':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      market_intel: 'Market Intel',
      price_alert: 'Price Alert',
      trend_analysis: 'Trend Analysis',
      breaking_news: 'Breaking News',
      insider_tip: 'Insider Tip',
      community_update: 'Community Update',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
            X-Intel History
          </h1>
          <p className="text-xl text-gray-400">
            Your captured intelligence reports from X (Twitter). Track, manage, and
            distribute your intel discoveries.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-cyan"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search your intel reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                           text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none
                           focus:shadow-neon-cyan transition-all backdrop-blur-md"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                         text-white focus:border-neon-cyan focus:outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchReports(pagination.page)}
              disabled={loading}
              className="px-4 py-3 bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg
                       text-neon-cyan hover:bg-neon-cyan/30 transition-all flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400"
          >
            {error} - Showing mock data for development.
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg mb-4">
              No intel reports found. Start capturing X posts to build your
              intelligence archive.
            </p>
            <Link
              href="/intel"
              className="btn-primary inline-flex items-center"
            >
              Explore Intel Archive
            </Link>
          </motion.div>
        ) : (
          /* Reports List */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-cyber p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadgeClass(report.status)}`}
                      >
                        {report.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/50">
                        {getReportTypeLabel(report.reportType)}
                      </span>
                      {report.postedTo.includes('commons') && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50">
                          Commons
                        </span>
                      )}
                      {report.postedTo.includes('rc_market') && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/50">
                          RC Market
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {report.title && (
                      <h3 className="text-xl font-bold font-[family-name:var(--font-orbitron)] mb-2 text-white">
                        {report.title}
                      </h3>
                    )}

                    {/* Content Preview */}
                    <p className="text-gray-300 mb-3 line-clamp-3">
                      {report.summary || report.content}
                    </p>

                    {/* Tags */}
                    {report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {report.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 rounded text-xs bg-cyber-dark/50 text-gray-400 border border-gray-700"
                          >
                            <Tag size={10} className="inline mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {report.xAuthor && (
                        <span className="flex items-center gap-1">
                          @{report.xAuthor}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {report.views} views
                      </span>
                      {parseFloat(report.price) > 0 && (
                        <span className="flex items-center gap-1 text-neon-pink">
                          <DollarSign size={14} />
                          {report.price} RC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <a
                      href={report.xPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-cyber-dark/50 border border-gray-700 rounded-lg
                               text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50
                               transition-all flex items-center gap-2 text-sm"
                    >
                      <ExternalLink size={16} />
                      View on X
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-4 mt-8"
          >
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                       text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-neon-cyan/20 transition-all flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <span className="text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                       text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-neon-cyan/20 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="card-cyber p-6 text-center">
            <p className="text-3xl font-bold text-neon-cyan font-[family-name:var(--font-orbitron)]">
              {pagination.total}
            </p>
            <p className="text-gray-400">Total Reports</p>
          </div>
          <div className="card-cyber p-6 text-center">
            <p className="text-3xl font-bold text-green-400 font-[family-name:var(--font-orbitron)]">
              {reports.filter((r) => r.status === 'published').length}
            </p>
            <p className="text-gray-400">Published</p>
          </div>
          <div className="card-cyber p-6 text-center">
            <p className="text-3xl font-bold text-neon-pink font-[family-name:var(--font-orbitron)]">
              {reports.filter((r) => r.postedTo.includes('rc_market')).length}
            </p>
            <p className="text-gray-400">On RC Market</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Mock data for development
function getMockReports(): IntelReport[] {
  return [
    {
      id: '1',
      xPostUrl: 'https://x.com/pokemon/status/123456789',
      xAuthor: 'pokemon',
      title: 'Prismatic Evolutions Pre-Order Alert',
      content:
        'Major restock incoming for Prismatic Evolutions at major retailers. Expected price point $5.99 per pack. This is the first English set featuring...',
      summary:
        'Prismatic Evolutions restock alert with pricing analysis and investment recommendations.',
      reportType: 'price_alert',
      tags: ['Pokemon', 'Prismatic Evolutions', 'Pre-Order'],
      postedTo: ['commons'],
      price: '0.00',
      views: '1234',
      status: 'published',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    },
    {
      id: '2',
      xPostUrl: 'https://x.com/tcgplayer/status/987654321',
      xAuthor: 'tcgplayer',
      title: 'Surging Sparks Market Movement',
      content:
        'Significant price movement detected in Surging Sparks singles. Key chase cards showing 15-20% increase over the past week...',
      summary:
        'Market analysis of Surging Sparks price movements with top gainers and investment outlook.',
      reportType: 'market_intel',
      tags: ['Pokemon', 'Surging Sparks', 'Market Analysis'],
      postedTo: ['commons', 'rc_market'],
      price: '5.00',
      views: '856',
      status: 'published',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      xPostUrl: 'https://x.com/collector/status/456789123',
      xAuthor: 'collector',
      title: 'Japanese Box Break Analysis',
      content:
        'Completed analysis of 10 Japanese booster boxes. Pull rates significantly better than English counterparts...',
      summary: null,
      reportType: 'trend_analysis',
      tags: ['Japanese', 'Pull Rates', 'Analysis'],
      postedTo: ['rc_market'],
      price: '10.00',
      views: '432',
      status: 'draft',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      publishedAt: null,
    },
    {
      id: '4',
      xPostUrl: 'https://x.com/insider/status/111222333',
      xAuthor: 'insider',
      title: 'Upcoming Set Leak Information',
      content:
        'Sources indicate new collaboration set coming Q2 2025. Expected to feature crossover with popular franchise...',
      summary: 'Insider information about upcoming TCG releases and collaboration sets.',
      reportType: 'insider_tip',
      tags: ['Leak', 'Upcoming Sets', 'Collaboration'],
      postedTo: [],
      price: '25.00',
      views: '0',
      status: 'draft',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      publishedAt: null,
    },
    {
      id: '5',
      xPostUrl: 'https://x.com/news/status/444555666',
      xAuthor: 'news',
      title: 'TCGPlayer Platform Update',
      content:
        'TCGPlayer announces new seller tools and fee structure changes effective January 2025...',
      summary: 'Breaking news about TCGPlayer platform changes affecting sellers.',
      reportType: 'breaking_news',
      tags: ['TCGPlayer', 'Platform', 'Sellers'],
      postedTo: ['commons'],
      price: '0.00',
      views: '2156',
      status: 'published',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
    },
  ];
}
