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
  Eye,
  User,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface PublicIntelReport {
  id: string;
  xPostUrl: string;
  xAuthor: string | null;
  title: string | null;
  content: string;
  summary: string | null;
  reportType: string;
  tags: string[];
  views: string;
  createdAt: string;
  publishedAt: string | null;
  contributorId: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CommonsPage() {
  const [reports, setReports] = useState<PublicIntelReport[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');

  const fetchReports = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        source: 'commons',
      });

      if (reportTypeFilter !== 'all') {
        params.append('reportType', reportTypeFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/intel/public?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.data || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for development
      setReports(getMockCommonsReports());
      setPagination({
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(pagination.page);
  }, [reportTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage);
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

  const getReportTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      market_intel: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      price_alert: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      trend_analysis: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      breaking_news: 'bg-red-500/20 text-red-400 border-red-500/50',
      insider_tip: 'bg-green-500/20 text-green-400 border-green-500/50',
      community_update: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      other: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return classes[type] || classes.other;
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
            Apex Commons
          </h1>
          <p className="text-xl text-gray-400">
            Community-shared intelligence from the TCG market. Free access to
            crowd-sourced market insights and analysis.
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card-cyber p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
            <p className="text-2xl font-bold text-white">{pagination.total}</p>
            <p className="text-sm text-gray-400">Total Reports</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <User className="w-6 h-6 mx-auto mb-2 text-neon-purple" />
            <p className="text-2xl font-bold text-white">
              {new Set(reports.map((r) => r.contributorId)).size}
            </p>
            <p className="text-sm text-gray-400">Contributors</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-neon-pink" />
            <p className="text-2xl font-bold text-white">
              {reports.reduce((acc, r) => acc + parseInt(r.views || '0'), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Total Views</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-white">
              {reports.filter(
                (r) =>
                  new Date(r.createdAt) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </p>
            <p className="text-sm text-gray-400">Today</p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                  placeholder="Search the commons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                           text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none
                           focus:shadow-neon-cyan transition-all backdrop-blur-md"
                />
              </div>
            </form>

            {/* Report Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
                className="px-4 py-3 bg-cyber-dark/50 border border-neon-cyan/30 rounded-lg
                         text-white focus:border-neon-cyan focus:outline-none transition-all"
              >
                <option value="all">All Types</option>
                <option value="market_intel">Market Intel</option>
                <option value="price_alert">Price Alert</option>
                <option value="trend_analysis">Trend Analysis</option>
                <option value="breaking_news">Breaking News</option>
                <option value="community_update">Community Update</option>
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
            className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400"
          >
            Using cached data - {error}
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
              No public intel reports found in the commons. Be the first to
              contribute!
            </p>
            <Link
              href="/x-intel-history"
              className="btn-primary inline-flex items-center"
            >
              Share Your Intel
            </Link>
          </motion.div>
        ) : (
          /* Reports Grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-cyber group cursor-pointer h-full flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getReportTypeBadgeClass(report.reportType)}`}
                  >
                    {getReportTypeLabel(report.reportType)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye size={12} />
                    {report.views}
                  </span>
                </div>

                {/* Title */}
                {report.title && (
                  <h3 className="text-lg font-bold font-[family-name:var(--font-orbitron)] mb-2 text-white group-hover:text-neon-cyan transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                )}

                {/* Content Preview */}
                <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                  {report.summary || report.content}
                </p>

                {/* Tags */}
                {report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {report.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-0.5 rounded text-xs bg-cyber-dark/50 text-gray-500 border border-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {report.tags.length > 3 && (
                      <span className="px-2 py-0.5 rounded text-xs text-gray-500">
                        +{report.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neon-cyan/20 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {report.xAuthor && (
                      <span className="flex items-center gap-1">
                        <User size={12} />@{report.xAuthor}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={report.xPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-cyan hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                  </a>
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
            transition={{ delay: 0.4 }}
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 relative rounded-2xl p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 backdrop-blur-xl" />
          <div className="absolute inset-0 neon-border" />

          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-cyan">
              Share Your Intel
            </h2>
            <p className="text-gray-300 mb-8">
              Found valuable market intel? Contribute to the commons and earn
              reputation credits from the community.
            </p>
            <Link
              href="/x-intel-history"
              className="btn-primary inline-flex items-center"
            >
              Start Contributing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Mock data for development
function getMockCommonsReports(): PublicIntelReport[] {
  return [
    {
      id: '1',
      xPostUrl: 'https://x.com/pokemon/status/123456789',
      xAuthor: 'pokemon',
      title: 'Prismatic Evolutions Pre-Order Alert',
      content:
        'Major restock incoming for Prismatic Evolutions at major retailers. Expected price point $5.99 per pack.',
      summary:
        'Prismatic Evolutions restock alert with pricing analysis and investment recommendations.',
      reportType: 'price_alert',
      tags: ['Pokemon', 'Prismatic Evolutions', 'Pre-Order'],
      views: '2345',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      contributorId: 'user-1',
    },
    {
      id: '2',
      xPostUrl: 'https://x.com/tcgmarket/status/987654321',
      xAuthor: 'tcgmarket',
      title: 'Surging Sparks Singles Spike',
      content:
        'Key chase cards from Surging Sparks showing significant price movement this week.',
      summary: 'Market analysis of Surging Sparks singles market.',
      reportType: 'market_intel',
      tags: ['Pokemon', 'Surging Sparks', 'Price Spike'],
      views: '1567',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      contributorId: 'user-2',
    },
    {
      id: '3',
      xPostUrl: 'https://x.com/collector/status/456789123',
      xAuthor: 'collector',
      title: 'Japanese Booster Box Pull Rate Analysis',
      content:
        'Completed analysis of 20 Japanese booster boxes. Pull rates are notably different from English.',
      summary: 'Detailed pull rate comparison between Japanese and English boxes.',
      reportType: 'trend_analysis',
      tags: ['Japanese', 'Pull Rates', 'Analysis'],
      views: '892',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      contributorId: 'user-3',
    },
    {
      id: '4',
      xPostUrl: 'https://x.com/news/status/111222333',
      xAuthor: 'tcgnews',
      title: 'New Pokemon Set Announced for Q2 2025',
      content:
        'Official announcement of a new collaboration set coming in Q2 2025. Features unique artwork.',
      summary: 'Breaking announcement of new Pokemon TCG set.',
      reportType: 'breaking_news',
      tags: ['Announcement', 'New Set', '2025'],
      views: '4521',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      contributorId: 'user-1',
    },
    {
      id: '5',
      xPostUrl: 'https://x.com/market/status/444555666',
      xAuthor: 'marketwatch',
      title: 'TCGPlayer Holiday Sale Impact',
      content:
        'Analysis of how the TCGPlayer holiday sale affected card prices across multiple TCGs.',
      summary: 'Holiday sale market impact analysis.',
      reportType: 'market_intel',
      tags: ['TCGPlayer', 'Sale', 'Market Analysis'],
      views: '1123',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      contributorId: 'user-4',
    },
    {
      id: '6',
      xPostUrl: 'https://x.com/community/status/777888999',
      xAuthor: 'tcgcommunity',
      title: 'Weekly Community Roundup',
      content:
        'This weeks highlights from the TCG community including notable sales and finds.',
      summary: 'Community update with weekly highlights.',
      reportType: 'community_update',
      tags: ['Community', 'Weekly', 'Highlights'],
      views: '654',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      contributorId: 'user-5',
    },
  ];
}
