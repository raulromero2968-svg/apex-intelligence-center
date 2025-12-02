'use client';

import Link from 'next/link';
import { Clock, Zap, BookOpen, AlertCircle } from 'lucide-react';

interface MarketReportCardProps {
  id: string;
  title: string;
  slug: string;
  reportType: 'daily_snapshot' | 'weekly_deep_dive' | 'flash_alert';
  summary: string;
  publishedAt: Date | string;
  keyTakeaways?: string[];
  viewCount?: number;
  citationCount?: number;
}

/**
 * Market Report Card
 *
 * Displays AI-generated market report previews.
 * Links to full Perplexity-style article with citations.
 */
export function MarketReportCard({
  title,
  slug,
  reportType,
  summary,
  publishedAt,
  keyTakeaways,
  viewCount,
}: MarketReportCardProps) {
  const typeConfig = {
    daily_snapshot: {
      icon: Clock,
      label: 'Daily Snapshot',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
    },
    weekly_deep_dive: {
      icon: BookOpen,
      label: 'Deep Dive',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
    },
    flash_alert: {
      icon: Zap,
      label: 'Flash Alert',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
    },
  };

  const config = typeConfig[reportType];
  const Icon = config.icon;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/market/${slug}`} className="group block">
      <article className="relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-cyan-500/50 hover:bg-black/60 transition-all duration-300">
        {/* Type Badge */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
          <span className="text-xs text-white/40">{formatDate(publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-white/60 mb-4 line-clamp-3">{summary}</p>

        {/* Key Takeaways Preview */}
        {keyTakeaways && keyTakeaways.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {keyTakeaways.slice(0, 2).map((takeaway, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-white/50">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span className="line-clamp-1">{takeaway}</span>
              </div>
            ))}
            {keyTakeaways.length > 2 && (
              <div className="text-xs text-cyan-400">+{keyTakeaways.length - 2} more insights</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-white/40">
            {viewCount !== undefined && <span>{viewCount.toLocaleString()} views</span>}
          </div>
          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Read Full Report &rarr;
          </span>
        </div>

        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </article>
    </Link>
  );
}

/**
 * Featured Report Card (Larger variant for hero placement)
 */
export function FeaturedReportCard({
  title,
  slug,
  reportType,
  summary,
  publishedAt,
  keyTakeaways,
}: MarketReportCardProps) {
  const typeConfig = {
    daily_snapshot: {
      icon: Clock,
      label: 'Daily Snapshot',
      gradient: 'from-blue-500/20 to-blue-600/10',
    },
    weekly_deep_dive: {
      icon: BookOpen,
      label: 'Deep Dive',
      gradient: 'from-purple-500/20 to-purple-600/10',
    },
    flash_alert: {
      icon: Zap,
      label: 'Flash Alert',
      gradient: 'from-amber-500/20 to-amber-600/10',
    },
  };

  const config = typeConfig[reportType];
  const Icon = config.icon;

  return (
    <Link href={`/market/${slug}`} className="group block">
      <article
        className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${config.gradient} backdrop-blur-md p-6 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/10">
              <Icon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs text-cyan-400 font-medium">{config.label}</span>
              <div className="text-xs text-white/40">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
            {title}
          </h2>

          {/* Summary */}
          <p className="text-white/70 mb-6">{summary}</p>

          {/* Key Takeaways */}
          {keyTakeaways && keyTakeaways.length > 0 && (
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Key Takeaways
              </h4>
              {keyTakeaways.map((takeaway, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center gap-2 text-cyan-400 font-medium group-hover:gap-3 transition-all">
            Read Full Analysis
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
