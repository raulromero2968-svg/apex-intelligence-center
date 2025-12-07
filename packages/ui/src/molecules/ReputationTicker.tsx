import * as React from "react";
import { cn } from "../lib/utils";

/**
 * ReputationTicker - The "Ledger Update" Component
 *
 * Design Philosophy:
 * - In the "Value Inversion" economy, RC is the currency of human value
 * - Earning RC must feel weighty, permanent, and significant
 * - Visual metaphor: mechanical odometer tallying up
 * - NOT a slot machine - a Bank Ledger Update
 *
 * Visual Language:
 * - Electric Cyan (#00F0FF) represents "Meaning Money"
 * - Monospace numbers for perfect scanning (tabular-nums)
 * - Stiff spring physics create mechanical feel
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ReputationTickerProps {
  /** Current RC value */
  value: number;
  /** Previous value (for animation delta calculation) */
  previousValue?: number;
  /** Display size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show USD equivalent */
  showUsdEquivalent?: boolean;
  /** USD conversion rate (default: 0.10 per RC) */
  usdRate?: number;
  /** Show the gem icon */
  showIcon?: boolean;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Layout ID for shared element transitions */
  layoutId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SIZE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

const sizeConfig = {
  sm: {
    text: "text-xs",
    icon: "w-3 h-3",
    label: "text-[8px]",
    usd: "text-[8px]",
    gap: "gap-1",
  },
  md: {
    text: "text-sm",
    icon: "w-4 h-4",
    label: "text-[10px]",
    usd: "text-[9px]",
    gap: "gap-1.5",
  },
  lg: {
    text: "text-2xl font-bold",
    icon: "w-6 h-6",
    label: "text-xs",
    usd: "text-[10px]",
    gap: "gap-2",
  },
  xl: {
    text: "text-4xl font-black tracking-tighter",
    icon: "w-8 h-8",
    label: "text-lg",
    usd: "text-sm",
    gap: "gap-3",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// ANIMATED DIGIT COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface AnimatedDigitProps {
  digit: string;
  duration: number;
  delay: number;
}

function AnimatedDigit({ digit, duration, delay }: AnimatedDigitProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [displayDigit, setDisplayDigit] = React.useState(digit);

  React.useEffect(() => {
    if (digit !== displayDigit) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayDigit(digit);
        setIsAnimating(false);
      }, duration + delay);
      return () => clearTimeout(timer);
    }
  }, [digit, displayDigit, duration, delay]);

  return (
    <span
      className={cn(
        "inline-block transition-transform",
        isAnimating && "animate-[digit-flip_150ms_ease-out]"
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {displayDigit}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REPUTATION CREDIT ICON (Gem)
// ═══════════════════════════════════════════════════════════════════

function RCIcon({
  className,
  isGlowing,
}: {
  className?: string;
  isGlowing?: boolean;
}) {
  return (
    <svg
      className={cn(
        "transition-all duration-300",
        isGlowing && "drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]",
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hexagonal gem shape - represents crystallized value */}
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

/**
 * ReputationTicker - Displays RC with ledger-style animation
 *
 * @example
 * ```tsx
 * // Navbar display
 * <ReputationTicker value={2450} size="md" />
 *
 * // Hero display with USD
 * <ReputationTicker
 *   value={10000}
 *   previousValue={9500}
 *   size="xl"
 *   showUsdEquivalent
 * />
 *
 * // Compact for cards
 * <ReputationTicker value={25} size="sm" showIcon={false} />
 * ```
 */
export function ReputationTicker({
  value,
  previousValue = 0,
  size = "md",
  showUsdEquivalent = false,
  usdRate = 0.1,
  showIcon = true,
  animateOnMount = true,
  animationDuration = 1500,
  className,
  layoutId,
}: ReputationTickerProps) {
  const config = sizeConfig[size];
  const [displayValue, setDisplayValue] = React.useState(
    animateOnMount ? previousValue : value
  );
  const [isAnimating, setIsAnimating] = React.useState(false);
  const animationRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);

  // Easing function for smooth animation (ease-out)
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  // Animate value change
  React.useEffect(() => {
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    setIsAnimating(true);
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = Math.round(
        startValue + (endValue - startValue) * easedProgress
      );
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        startTimeRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animationDuration]);

  const usdValue = value * usdRate;
  const isPositiveChange = value > previousValue;

  // Format with locale-aware separators
  const formattedValue = displayValue.toLocaleString("en-US");

  return (
    <div
      className={cn(
        "inline-flex items-center font-mono text-primary",
        config.gap,
        className
      )}
      data-layout-id={layoutId}
    >
      {/* RC Icon with glow effect on change */}
      {showIcon && (
        <div
          className={cn(
            "relative transition-transform duration-300",
            isAnimating && isPositiveChange && "scale-110"
          )}
        >
          <RCIcon
            className={cn(config.icon, "text-primary")}
            isGlowing={isAnimating && isPositiveChange}
          />
          {/* Pulse ring on positive change */}
          {isAnimating && isPositiveChange && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          )}
        </div>
      )}

      {/* Value Display */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          {/* Animated Number */}
          <span
            className={cn(
              "tabular-nums relative z-10",
              config.text,
              isAnimating && "text-primary"
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {formattedValue}
          </span>

          {/* RC Label */}
          <span
            className={cn(
              "text-muted-foreground font-sans font-medium",
              config.label
            )}
          >
            RC
          </span>
        </div>

        {/* USD Equivalent */}
        {showUsdEquivalent && (
          <span
            className={cn(
              "text-muted-foreground/60 font-sans tabular-nums",
              config.usd
            )}
          >
            ≈ ${usdValue.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELTA INDICATOR
// ═══════════════════════════════════════════════════════════════════

export interface ReputationDeltaProps {
  /** The delta value (+10, -5, etc.) */
  delta: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show the animation */
  animate?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ReputationDelta - Shows the "+10 RC" float animation
 *
 * Uses the rcFloat keyframe from design tokens for the
 * upward float-and-fade effect when RC is earned.
 *
 * @example
 * ```tsx
 * <ReputationDelta delta={10} animate />
 * ```
 */
export function ReputationDelta({
  delta,
  size = "md",
  animate = true,
  onAnimationComplete,
  className,
}: ReputationDeltaProps) {
  const isPositive = delta > 0;

  React.useEffect(() => {
    if (animate && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [animate, onAnimationComplete]);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-bold",
        isPositive
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-danger/15 text-danger border border-danger/30",
        animate && "animate-[rcFloat_800ms_ease-out_forwards]",
        sizeClasses[size],
        className
      )}
    >
      {isPositive ? "+" : ""}
      {delta} RC
    </span>
  );
}

export default ReputationTicker;
