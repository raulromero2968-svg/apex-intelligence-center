import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Intel Card Component
 *
 * A molecule-level component for displaying intelligence content.
 * Designed for the X-to-Intel transformation workflow where social media
 * content is converted into actionable market intelligence.
 *
 * Visual Hierarchy (top to bottom):
 * 1. Source badge + timestamp
 * 2. Title/headline
 * 3. Body content (truncated)
 * 4. Category tags
 * 5. Data row (sentiment, relevance, engagement)
 *
 * Part of the "Institutional Futurism" design system.
 */

export type IntelSource = "twitter" | "reddit" | "news" | "research" | "internal" | "analyst";
export type IntelSentiment = "bullish" | "bearish" | "neutral";
export type IntelCategory = "earnings" | "macro" | "sector" | "technical" | "regulatory" | "geopolitical";

export interface IntelCardProps {
  /** Unique identifier for the intel */
  id: string;
  /** Source of the intelligence */
  source: IntelSource;
  /** Original author/handle */
  author?: string;
  /** Headline or title */
  title: string;
  /** Body content (will be truncated) */
  content: string;
  /** When the intel was captured */
  timestamp: Date;
  /** Market sentiment classification */
  sentiment?: IntelSentiment;
  /** Relevance score (0-100) */
  relevanceScore?: number;
  /** Category tags */
  categories?: IntelCategory[];
  /** Number of engagements (likes, retweets, etc.) */
  engagements?: number;
  /** Whether the intel has been verified */
  verified?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const sourceConfig: Record<IntelSource, { label: string; color: string }> = {
  twitter: { label: "X", color: "text-[#00F0FF]" },
  reddit: { label: "Reddit", color: "text-[#FF4500]" },
  news: { label: "News", color: "text-[#FFB020]" },
  research: { label: "Research", color: "text-[#7000FF]" },
  internal: { label: "Internal", color: "text-[#00C050]" },
  analyst: { label: "Analyst", color: "text-[#F8FAFC]" },
};

const sentimentConfig: Record<IntelSentiment, { label: string; color: string; bgColor: string }> = {
  bullish: {
    label: "Bullish",
    color: "text-[#00C050]",
    bgColor: "bg-[#00C050]/10 border-[#00C050]/20",
  },
  bearish: {
    label: "Bearish",
    color: "text-[#FF453A]",
    bgColor: "bg-[#FF453A]/10 border-[#FF453A]/20",
  },
  neutral: {
    label: "Neutral",
    color: "text-[#94A3B8]",
    bgColor: "bg-[#1E293B] border-[#1E293B]",
  },
};

const categoryColors: Record<IntelCategory, string> = {
  earnings: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20",
  macro: "bg-[#7000FF]/10 text-[#7000FF] border-[#7000FF]/20",
  sector: "bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/20",
  technical: "bg-[#00C050]/10 text-[#00C050] border-[#00C050]/20",
  regulatory: "bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20",
  geopolitical: "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20",
};

/**
 * Format relative time (e.g., "2h ago", "3d ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format large numbers (e.g., 1.2K, 3.4M)
 */
function formatCompact(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Source Icon Component
 */
const SourceIcon = ({ source }: { source: IntelSource }) => {
  // X (Twitter) icon
  if (source === "twitter") {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  // Default document icon for other sources
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
};

/**
 * Verified Badge Component
 */
const VerifiedBadge = () => (
  <svg className="w-4 h-4 text-[#00F0FF]" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Intel Card
 *
 * @example
 * <IntelCard
 *   id="intel-001"
 *   source="twitter"
 *   author="@elonmusk"
 *   title="Tesla Q4 Production Update"
 *   content="Record deliveries in Q4, exceeding analyst expectations..."
 *   timestamp={new Date()}
 *   sentiment="bullish"
 *   relevanceScore={92}
 *   categories={["earnings", "sector"]}
 *   engagements={45000}
 *   verified
 *   onClick={() => console.log("Card clicked")}
 * />
 */
export const IntelCard = React.forwardRef<HTMLDivElement, IntelCardProps>(
  (
    {
      id,
      source,
      author,
      title,
      content,
      timestamp,
      sentiment,
      relevanceScore,
      categories = [],
      engagements,
      verified = false,
      onClick,
      className,
    },
    ref
  ) => {
    const sourceInfo = sourceConfig[source];
    const sentimentInfo = sentiment ? sentimentConfig[sentiment] : null;
    const isInteractive = !!onClick;

    return (
      <div
        ref={ref}
        role={isInteractive ? "button" : "article"}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-labelledby={`${id}-title`}
        className={cn(
          // Base card styles - flat with subtle border
          "relative bg-[#0B0E14] border border-[#1E293B] rounded-[0.25rem]",
          "p-4",
          // Interactive states
          isInteractive && [
            "cursor-pointer",
            "transition-all duration-150 ease-out",
            "hover:border-[#00F0FF]/30 hover:bg-[#0F1318]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]",
            "active:scale-[0.995]",
          ],
          // Reduced motion
          "motion-reduce:transition-none motion-reduce:transform-none",
          className
        )}
      >
        {/* Header: Source + Timestamp */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Source badge */}
            <div className={cn("flex items-center gap-1.5", sourceInfo.color)}>
              <SourceIcon source={source} />
              <span className="text-xs font-medium uppercase tracking-wider">
                {sourceInfo.label}
              </span>
            </div>
            {/* Author */}
            {author && (
              <>
                <span className="text-[#1E293B]">·</span>
                <span className="text-xs text-[#94A3B8] truncate max-w-[120px]">
                  {author}
                </span>
              </>
            )}
            {/* Verified badge */}
            {verified && <VerifiedBadge />}
          </div>
          {/* Timestamp */}
          <time
            dateTime={timestamp.toISOString()}
            className="text-xs text-[#64748B] font-mono"
          >
            {formatRelativeTime(timestamp)}
          </time>
        </div>

        {/* Title */}
        <h3
          id={`${id}-title`}
          className="text-[#F8FAFC] font-medium text-sm leading-snug mb-2 line-clamp-2"
        >
          {title}
        </h3>

        {/* Content (truncated) */}
        <p className="text-[#94A3B8] text-sm leading-relaxed mb-3 line-clamp-3">
          {content}
        </p>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map((category) => (
              <span
                key={category}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  "border rounded-sm",
                  "font-mono",
                  categoryColors[category]
                )}
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Data Row */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]/50">
          <div className="flex items-center gap-4">
            {/* Sentiment */}
            {sentimentInfo && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    sentiment === "bullish" && "bg-[#00C050]",
                    sentiment === "bearish" && "bg-[#FF453A]",
                    sentiment === "neutral" && "bg-[#94A3B8]"
                  )}
                  aria-hidden="true"
                />
                <span className={cn("text-xs font-medium", sentimentInfo.color)}>
                  {sentimentInfo.label}
                </span>
              </div>
            )}

            {/* Relevance Score */}
            {relevanceScore !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                  REL
                </span>
                <span
                  className={cn(
                    "text-xs font-mono font-medium",
                    relevanceScore >= 80 && "text-[#00F0FF]",
                    relevanceScore >= 50 && relevanceScore < 80 && "text-[#FFB020]",
                    relevanceScore < 50 && "text-[#94A3B8]"
                  )}
                >
                  {relevanceScore}%
                </span>
              </div>
            )}
          </div>

          {/* Engagements */}
          {engagements !== undefined && (
            <div className="flex items-center gap-1 text-[#64748B]">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-xs font-mono">{formatCompact(engagements)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

IntelCard.displayName = "IntelCard";

export default IntelCard;
