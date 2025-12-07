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
  User,
  ShoppingCart,
  Lock,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Crown,
  Star,
} from 'lucide-react';

interface PremiumIntelReport {
  id: string;
  xPostUrl: string;
  xAuthor: string | null;
  title: string | null;
  content: string;
  summary: string | null;
  reportType: string;
  tags: string[];
  price: string;
  views: string;
  qualityScore: string | null;
  createdAt: string;
  publishedAt: string | null;
  contributorId: string;
  isPurchased: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RCMarketPage() {
  const [reports, setReports] = useState<PremiumIntelReport[]>([]);
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
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const fetchReports = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        source: 'rc_market',
        sortBy,
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
      setIsAuthenticated(data.isAuthenticated || false);
      setIsPremiumUser(data.isPremiumUser || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for development
      setReports(getMockRCMarketReports());
      setPagination({
        page: 1,
        limit: 20,
        total: 8,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(pagination.page);
  }, [reportTypeFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage);
    }
  };

  const handlePurchase = async (reportId: string) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login?redirect=/rc-market';
      return;
    }

    // In production, this would call an API to process the purchase
    alert(`Purchase functionality coming soon for report ${reportId}`);
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

  const getQualityStars = (score: string | null) => {
    if (!score) return 0;
    const numScore = parseFloat(score);
    return Math.round(numScore * 5);
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-neon-pink" />
            <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] text-glow-pink">
              RC Market
            </h1>
          </div>
          <p className="text-xl text-gray-400">
            Premium intelligence marketplace. Purchase exclusive market insights
            and analysis with Reputation Credits.
          </p>
        </motion.div>

        {/* Premium Banner */}
        {!isPremiumUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-xl bg-gradient-to-r from-neon-pink/20 via-neon-purple/20 to-neon-cyan/20 border border-neon-pink/30"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Lock className="w-8 h-8 text-neon-pink" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Unlock Premium Intel
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Upgrade to access exclusive market intelligence and insider
                    tips
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-neon-pink/20 border border-neon-pink rounded-lg
                         text-neon-pink hover:bg-neon-pink/30 transition-all font-semibold"
              >
                View Plans
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card-cyber p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-neon-pink" />
            <p className="text-2xl font-bold text-white">{pagination.total}</p>
            <p className="text-sm text-gray-400">Premium Reports</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-white">
              {reports.length > 0
                ? Math.min(
                    ...reports.map((r) => parseFloat(r.price) || 0)
                  ).toFixed(0)
                : '0'}{' '}
              RC
            </p>
            <p className="text-sm text-gray-400">Starting From</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-white">
              {reports.filter((r) => r.qualityScore && parseFloat(r.qualityScore) > 0.8).length}
            </p>
            <p className="text-sm text-gray-400">Top Rated</p>
          </div>
          <div className="card-cyber p-4 text-center">
            <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-neon-cyan" />
            <p className="text-2xl font-bold text-white">
              {reports.filter((r) => r.isPurchased).length}
            </p>
            <p className="text-sm text-gray-400">Purchased</p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-pink"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search premium intel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cyber-dark/50 border border-neon-pink/30 rounded-lg
                           text-white placeholder-gray-500 focus:border-neon-pink focus:outline-none
                           focus:shadow-neon-pink transition-all backdrop-blur-md"
                />
              </div>
            </form>

            {/* Report Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
                className="px-4 py-3 bg-cyber-dark/50 border border-neon-pink/30 rounded-lg
                         text-white focus:border-neon-pink focus:outline-none transition-all"
              >
                <option value="all">All Types</option>
                <option value="market_intel">Market Intel</option>
                <option value="price_alert">Price Alert</option>
                <option value="trend_analysis">Trend Analysis</option>
                <option value="insider_tip">Insider Tip</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-cyber-dark/50 border border-neon-pink/30 rounded-lg
                       text-white focus:border-neon-pink focus:outline-none transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="quality">Highest Quality</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchReports(pagination.page)}
              disabled={loading}
              className="px-4 py-3 bg-neon-pink/20 border border-neon-pink/50 rounded-lg
                       text-neon-pink hover:bg-neon-pink/30 transition-all flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
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
            Using demo data - {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-pink"></div>
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg mb-4">
              No premium intel reports available at the moment.
            </p>
            <Link
              href="/commons"
              className="btn-primary inline-flex items-center"
            >
              Browse Free Intel
            </Link>
          </motion.div>
        ) : (
          /* Reports Grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-cyber group h-full flex flex-col overflow-hidden relative"
              >
                {/* Premium Badge */}
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-neon-pink to-neon-purple px-3 py-1 rounded-bl-lg">
                    <span className="text-xs font-bold text-white">PREMIUM</span>
                  </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-3 pt-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getReportTypeBadgeClass(report.reportType)}`}
                  >
                    {getReportTypeLabel(report.reportType)}
                  </span>
                  {report.qualityScore && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < getQualityStars(report.qualityScore)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600'
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                {report.title && (
                  <h3 className="text-lg font-bold font-[family-name:var(--font-orbitron)] mb-2 text-white group-hover:text-neon-pink transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                )}

                {/* Content Preview (Blurred for non-purchased) */}
                <div className="relative flex-grow">
                  <p
                    className={`text-gray-400 text-sm mb-4 line-clamp-3 ${
                      !report.isPurchased ? 'blur-sm select-none' : ''
                    }`}
                  >
                    {report.summary || report.content}
                  </p>
                  {!report.isPurchased && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-neon-pink/50" />
                    </div>
                  )}
                </div>

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
                  </div>
                )}

                {/* Price and Actions */}
                <div className="pt-3 border-t border-neon-pink/20 mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-neon-pink" />
                      <span className="text-xl font-bold text-neon-pink">
                        {report.price} RC
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Eye size={12} />
                      {report.views}
                    </div>
                  </div>

                  {report.isPurchased ? (
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm font-semibold">
                        Purchased
                      </button>
                      <a
                        href={report.xPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-cyber-dark/50 border border-gray-700 rounded-lg
                                 text-gray-400 hover:text-neon-pink hover:border-neon-pink/50 transition-all"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(report.id)}
                      className="w-full px-4 py-2 bg-neon-pink/20 border border-neon-pink/50 rounded-lg
                               text-neon-pink hover:bg-neon-pink/30 transition-all text-sm font-semibold
                               flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Purchase Intel
                    </button>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
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
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center items-center gap-4 mt-8"
          >
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-cyber-dark/50 border border-neon-pink/30 rounded-lg
                       text-neon-pink disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-neon-pink/20 transition-all flex items-center gap-2"
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
              className="px-4 py-2 bg-cyber-dark/50 border border-neon-pink/30 rounded-lg
                       text-neon-pink disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-neon-pink/20 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* Sell Your Intel CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 relative rounded-2xl p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-neon-purple/10 to-neon-cyan/10 backdrop-blur-xl" />
          <div className="absolute inset-0 neon-border-pink" />

          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-orbitron)] mb-4 text-glow-pink">
              Sell Your Intel
            </h2>
            <p className="text-gray-300 mb-8">
              Have exclusive market intelligence? List it on the RC Market and
              earn Reputation Credits from buyers.
            </p>
            <Link
              href="/x-intel-history"
              className="px-8 py-4 bg-neon-pink/20 border border-neon-pink rounded-lg
                       text-neon-pink hover:bg-neon-pink/30 transition-all font-semibold inline-flex items-center gap-2"
            >
              <DollarSign size={20} />
              List Your Intel
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Mock data for development
function getMockRCMarketReports(): PremiumIntelReport[] {
  return [
    {
      id: '1',
      xPostUrl: 'https://x.com/insider/status/111222333',
      xAuthor: 'insider',
      title: 'Upcoming Pokemon Collaboration Set Details',
      content:
        'Exclusive details about the upcoming collaboration set. Sources confirm unique mechanics and chase cards...',
      summary: 'Insider information about upcoming Pokemon TCG collaboration with major franchise.',
      reportType: 'insider_tip',
      tags: ['Insider', 'Upcoming Sets', 'Collaboration'],
      price: '25.00',
      views: '342',
      qualityScore: '0.95',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      contributorId: 'user-1',
      isPurchased: false,
    },
    {
      id: '2',
      xPostUrl: 'https://x.com/analyst/status/444555666',
      xAuthor: 'analyst',
      title: 'Deep Dive: Vintage WOTC Investment Analysis',
      content:
        'Comprehensive analysis of vintage WOTC market with PSA population data and investment projections...',
      summary: 'Complete vintage WOTC market analysis with data-driven investment recommendations.',
      reportType: 'trend_analysis',
      tags: ['Vintage', 'WOTC', 'Investment'],
      price: '15.00',
      views: '567',
      qualityScore: '0.88',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      contributorId: 'user-2',
      isPurchased: true,
    },
    {
      id: '3',
      xPostUrl: 'https://x.com/market/status/777888999',
      xAuthor: 'marketwatcher',
      title: 'Japanese Market Arbitrage Opportunities',
      content:
        'Current arbitrage opportunities between Japanese and English markets with specific card recommendations...',
      summary: 'Live arbitrage opportunities with buy/sell recommendations.',
      reportType: 'market_intel',
      tags: ['Japanese', 'Arbitrage', 'Buy List'],
      price: '10.00',
      views: '892',
      qualityScore: '0.82',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      contributorId: 'user-3',
      isPurchased: false,
    },
    {
      id: '4',
      xPostUrl: 'https://x.com/expert/status/123123123',
      xAuthor: 'expert',
      title: 'Grading Submission Strategy Guide',
      content:
        'Optimal grading submission strategies based on current PSA turnaround times and market conditions...',
      summary: 'Expert guide on when and what to grade for maximum ROI.',
      reportType: 'trend_analysis',
      tags: ['Grading', 'PSA', 'Strategy'],
      price: '8.00',
      views: '1234',
      qualityScore: '0.90',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      contributorId: 'user-1',
      isPurchased: false,
    },
    {
      id: '5',
      xPostUrl: 'https://x.com/alert/status/456456456',
      xAuthor: 'alerter',
      title: 'Surging Sparks Buylist Alert',
      content:
        'Several major vendors updating buylists with increased offers on Surging Sparks singles...',
      summary: 'Real-time buylist updates with profit margins calculated.',
      reportType: 'price_alert',
      tags: ['Surging Sparks', 'Buylist', 'Profit'],
      price: '5.00',
      views: '2156',
      qualityScore: '0.75',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      contributorId: 'user-4',
      isPurchased: true,
    },
    {
      id: '6',
      xPostUrl: 'https://x.com/data/status/789789789',
      xAuthor: 'datadriven',
      title: 'Q4 2025 Price Prediction Model',
      content:
        'Machine learning model predictions for Q4 2025 TCG prices based on historical patterns...',
      summary: 'AI-powered price predictions for major TCG products.',
      reportType: 'trend_analysis',
      tags: ['Predictions', 'AI', 'Q4 2025'],
      price: '20.00',
      views: '678',
      qualityScore: '0.85',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      publishedAt: new Date(Date.now() - 432000000).toISOString(),
      contributorId: 'user-5',
      isPurchased: false,
    },
  ];
}
