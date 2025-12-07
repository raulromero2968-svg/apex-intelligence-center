import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";
import { Badge, SentimentBadge, GradeBadge } from "../atoms/Badge";

/**
 * Intel Card - The container of wealth
 *
 * Design Rationale:
 * - "Split Brain" Layout: Left signals source, center signals value, footer signals economy
 * - Color-coded borders indicate report grading (similar to TCG card grades)
 * - Monospace numbers (RC, Price, Views) ensure perfect scanning
 * - Hover state subtly elevates to signal interactivity
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type IntelGrade = "S" | "A" | "B" | "C";
export type IntelSentiment = "bullish" | "bearish" | "neutral";

export interface IntelCardProps {
  /** Report title - the hook */
  title: string;
  /** Report excerpt/preview */
  excerpt: string;
  /** Author/analyst name */
  author: string;
  /** Author avatar URL (optional) */
  avatarUrl?: string;
  /** Price in Research Credits */
  rcPrice: number;
  /** Price in USD */
  usdPrice: number;
  /** View count */
  views: number;
  /** Market sentiment */
  sentiment: IntelSentiment;
  /** Quality grade */
  grade: IntelGrade;
  /** Whether the report is verified by a human */
  verified?: boolean;
  /** Whether the report is locked (requires purchase) */
  locked?: boolean;
  /** Callback when unlock button is clicked */
  onUnlock?: () => void;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Timestamp of publication */
  publishedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════
// GRADE STYLING
// ═══════════════════════════════════════════════════════════════════

const gradeStyles = {
  S: "border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]",
  A: "border-emerald-500/40",
  B: "border-amber-500/30",
  C: "border-slate-700",
} as const;

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Avatar placeholder with shimmer animation
 */
function AvatarPlaceholder({ avatarUrl, author }: { avatarUrl?: string; author: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={author}
        className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
      />
    );
  }

  // Placeholder with first letter
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-border">
      {author.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Verified indicator (Human Touch icon)
 */
function VerifiedBadge() {
  return (
    <Badge variant="verified" size="sm">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {/* Fingerprint icon - signifies human verification */}
        <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
        <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
        <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
        <path d="M2 12a10 10 0 0 1 18-6" />
        <path d="M2 16h.01" />
        <path d="M21.8 16c.2-2 .131-5.354 0-6" />
        <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
        <path d="M8.65 22c.21-.66.45-1.32.57-2" />
        <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
      </svg>
      Verified
    </Badge>
  );
}

/**
 * Metric display with icon
 */
function Metric({
  icon,
  value,
  className,
}: {
  icon: React.ReactNode;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
      {icon}
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

/**
 * IntelCard - Display intelligence reports with economic context
 *
 * The card solves the core challenge: How to display density without clutter.
 * It uses a "Split Brain" layout where different sections communicate
 * different types of value.
 *
 * @example
 * ```tsx
 * <IntelCard
 *   title="Apple Vision Pro Supply Chain Analysis"
 *   excerpt="Deep dive into the component suppliers and manufacturing bottlenecks..."
 *   author="TechInsider"
 *   rcPrice={250}
 *   usdPrice={12.50}
 *   views={1420}
 *   sentiment="bullish"
 *   grade="S"
 *   verified
 *   onUnlock={() => handlePurchase()}
 * />
 * ```
 */
export function IntelCard({
  title,
  excerpt,
  author,
  avatarUrl,
  rcPrice,
  usdPrice,
  views,
  sentiment,
  grade,
  verified = false,
  locked = true,
  onUnlock,
  onClick,
  className,
  publishedAt,
}: IntelCardProps) {
  return (
    <article
      className={cn(
        // Base card styling
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground",
        // Transition and hover effects
        "transition-all duration-300 ease-out",
        "hover:scale-[1.01] hover:bg-accent/5",
        // Grade-specific border styling
        gradeStyles[grade],
        // Clickable styling
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* HEADER: Identity & Status */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <AvatarPlaceholder avatarUrl={avatarUrl} author={author} />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {author}
          </span>
          {verified && <VerifiedBadge />}
        </div>

        <div className="flex items-center gap-2">
          <SentimentBadge sentiment={sentiment} size="sm" />
          <GradeBadge grade={grade} size="sm" />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* BODY: The Hook */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-3 p-4">
        <h3 className="text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* FOOTER: The Economy */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto grid grid-cols-2 border-t border-border">
        {/* Metrics Section */}
        <div className="flex items-center gap-4 border-r border-border p-3">
          <Metric
            icon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
            value={views.toLocaleString()}
          />
          {publishedAt && (
            <Metric
              icon={
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              }
              value={formatTimeAgo(publishedAt)}
            />
          )}
        </div>

        {/* Action / Price Section */}
        <div className="flex items-center justify-between bg-muted/30 p-2 pl-4">
          <div className="flex flex-col items-end">
            <span className="font-mono text-sm font-bold text-foreground">
              ${usdPrice.toFixed(2)}
            </span>
            <span className="font-mono text-[10px] text-primary">
              {rcPrice.toLocaleString()} RC
            </span>
          </div>

          {locked ? (
            <Button
              size="sm"
              variant="terminal"
              className="ml-2 h-7"
              onClick={(e) => {
                e.stopPropagation();
                onUnlock?.();
              }}
            >
              Unlock
              <svg
                className="ml-1 h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-7 text-emerald-400"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Read
              <svg
                className="ml-1 h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SKELETON VARIANT
// ═══════════════════════════════════════════════════════════════════

/**
 * IntelCardSkeleton - Loading state that maintains card layout
 *
 * Design Rationale:
 * - Shimmer animation perceives as "faster" than a blank screen
 * - Maintains exact layout to prevent content shift
 * - Subtler than standard skeletons (aerospace aesthetic)
 */
export function IntelCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {/* Header Skeleton */}
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 animate-pulse rounded bg-muted" />
          <div className="h-5 w-6 animate-pulse rounded bg-muted" />
        </div>
      </header>

      {/* Body Skeleton */}
      <div className="flex-1 space-y-3 p-4">
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <footer className="mt-auto grid grid-cols-2 border-t border-border">
        <div className="flex items-center gap-4 border-r border-border p-3">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between bg-muted/30 p-2 pl-4">
          <div className="space-y-1">
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        </div>
      </footer>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Format a date as relative time (e.g., "2h ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default IntelCard;
