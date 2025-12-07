import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Apex Badge Variants
 *
 * Design Rationale:
 * - Badges are status indicators, not decorations
 * - Color-coding follows instrumentation principles (not candy)
 * - Monospace font for grades/metrics ensures perfect alignment
 * - Subtle glow on important states draws attention without distraction
 */
const badgeVariants = cva(
  [
    "inline-flex items-center rounded-md px-2 py-0.5",
    "text-xs font-medium transition-colors",
    "border",
  ],
  {
    variants: {
      variant: {
        // Default: Primary brand color
        default: [
          "border-primary/30 bg-primary/10 text-primary",
          "hover:bg-primary/20",
        ],

        // Secondary: Muted, informational
        secondary: [
          "border-border bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
        ],

        // Outline: Subtle, border-only
        outline: [
          "border-border bg-transparent text-foreground",
        ],

        // Destructive: Alerts, errors
        destructive: [
          "border-destructive/30 bg-destructive/10 text-destructive",
        ],

        // Success: Positive states, bullish sentiment
        success: [
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        ],

        // Warning: Caution states
        warning: [
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        ],

        // Grade badges: For report quality indicators
        "grade-s": [
          "border-primary/50 bg-primary/10 text-primary font-mono font-bold",
          "shadow-[0_0_8px_rgba(0,240,255,0.2)]",
        ],
        "grade-a": [
          "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-mono font-bold",
        ],
        "grade-b": [
          "border-amber-500/50 bg-amber-500/10 text-amber-400 font-mono font-bold",
        ],
        "grade-c": [
          "border-slate-600/50 bg-slate-800/50 text-slate-400 font-mono font-bold",
        ],

        // Premium: Purple accent for premium content
        premium: [
          "border-[#7000FF]/30 bg-[#7000FF]/10 text-[#A855F7]",
        ],

        // Verified: Human-verified indicator
        verified: [
          "border-primary/40 bg-primary/5 text-primary",
          "gap-1",
        ],
      },

      size: {
        default: "px-2 py-0.5 text-xs",
        sm: "px-1.5 py-0 text-[10px]",
        lg: "px-2.5 py-1 text-sm",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional icon to display before the text
   */
  icon?: React.ReactNode;
}

/**
 * Apex Badge - Status indicators with instrumentation aesthetics
 *
 * @example
 * ```tsx
 * // Sentiment indicator
 * <Badge variant="success">BULLISH</Badge>
 *
 * // Grade indicator
 * <Badge variant="grade-s">S</Badge>
 *
 * // Verified badge
 * <Badge variant="verified" icon={<Fingerprint className="h-3 w-3" />}>
 *   Verified
 * </Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {icon}
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

/**
 * Sentiment Badge - Specialized badge for market sentiment
 */
interface SentimentBadgeProps extends Omit<BadgeProps, "variant"> {
  sentiment: "bullish" | "bearish" | "neutral";
}

const SentimentBadge = React.forwardRef<HTMLDivElement, SentimentBadgeProps>(
  ({ sentiment, className, ...props }, ref) => {
    const variant = {
      bullish: "success" as const,
      bearish: "destructive" as const,
      neutral: "secondary" as const,
    }[sentiment];

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn("uppercase tracking-widest", className)}
        {...props}
      >
        {sentiment}
      </Badge>
    );
  }
);
SentimentBadge.displayName = "SentimentBadge";

/**
 * Grade Badge - Specialized badge for report quality grades
 */
interface GradeBadgeProps extends Omit<BadgeProps, "variant"> {
  grade: "S" | "A" | "B" | "C";
}

const GradeBadge = React.forwardRef<HTMLDivElement, GradeBadgeProps>(
  ({ grade, className, ...props }, ref) => {
    const variant = {
      S: "grade-s" as const,
      A: "grade-a" as const,
      B: "grade-b" as const,
      C: "grade-c" as const,
    }[grade];

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn("min-w-[1.5rem] justify-center", className)}
        {...props}
      >
        {grade}
      </Badge>
    );
  }
);
GradeBadge.displayName = "GradeBadge";

export { Badge, badgeVariants, SentimentBadge, GradeBadge };
