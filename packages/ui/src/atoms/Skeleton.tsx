import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Apex Skeleton - Ghost UI loading states
 *
 * Design Rationale:
 * - Nothing kills "Institutional Trust" like a spinning wheel
 * - Shimmer animation perceives as "faster" than blank screens
 * - Subtle gradient animation (aerospace aesthetic, not playful)
 * - Maintains layout structure to prevent content shift
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   * - "default": Standard shimmer
   * - "pulse": Simple pulse animation
   * - "glow": Subtle cyan glow pulse
   */
  variant?: "default" | "pulse" | "glow";
}

/**
 * Base Skeleton component with aerospace-styled loading animation
 *
 * @example
 * ```tsx
 * // Simple placeholder
 * <Skeleton className="h-4 w-full" />
 *
 * // Card placeholder
 * <Skeleton className="h-48 w-full rounded-lg" />
 *
 * // With glow variant
 * <Skeleton variant="glow" className="h-8 w-32" />
 * ```
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: [
        "animate-shimmer",
        "bg-gradient-to-r from-muted via-muted/50 to-muted",
        "bg-[length:200%_100%]",
      ],
      pulse: "animate-pulse bg-muted",
      glow: [
        "animate-pulse bg-muted",
        "shadow-[0_0_10px_rgba(0,240,255,0.05)]",
      ],
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// ═══════════════════════════════════════════════════════════════════
// COMPOUND SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Text line skeleton - mimics a line of text
 */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? "75%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton - circular placeholder
 */
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeStyles = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton className={cn("rounded-full", sizeStyles[size], className)} />
  );
}

/**
 * Button skeleton - matches button dimensions
 */
export function SkeletonButton({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeStyles = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton className={cn("rounded-md", sizeStyles[size], className)} />
  );
}

/**
 * Card skeleton - full card placeholder with header, body, footer
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/20 p-4">
        <SkeletonAvatar size="sm" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={3} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border p-3">
        <Skeleton className="h-4 w-20" />
        <SkeletonButton size="sm" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton - for data grids
 */
export function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            flex: i === 0 ? 2 : 1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Metric skeleton - for number displays
 */
export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-24" variant="glow" />
    </div>
  );
}

export { Skeleton };
