import * as React from "react";
import { cn } from "../lib/utils";

/**
 * ReputationBadge - The transferable RC element
 *
 * Design Philosophy:
 * - This component represents RC in a "portable" form
 * - Used for layoutId morphing animations (card → navbar)
 * - The badge physically "moves" to represent value transfer
 *
 * Key interaction:
 * When user claims intel, this badge animates from the Intel Card
 * to the user's wallet in the navbar, creating a visceral sense
 * of value being deposited.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ReputationBadgeProps {
  /** The RC amount to display */
  amount: number;
  /** Badge variant - determines styling context */
  variant?: "default" | "earned" | "potential" | "premium" | "spent";
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Show the prefix (+/-) */
  showPrefix?: boolean;
  /** Layout ID for shared element transitions (Framer Motion) */
  layoutId?: string;
  /** Whether to show a subtle pulse animation */
  pulse?: boolean;
  /** Whether to show the gem icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional onClick handler */
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

const variantStyles = {
  // Standard display
  default: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    icon: "text-primary",
    glow: "",
  },
  // Just earned (celebration state)
  earned: {
    bg: "bg-primary/20",
    border: "border-primary/50",
    text: "text-primary",
    icon: "text-primary",
    glow: "shadow-[0_0_15px_rgba(0,240,255,0.4)]",
  },
  // Potential earnings (not yet claimed)
  potential: {
    bg: "bg-primary/5",
    border: "border-primary/20 border-dashed",
    text: "text-primary/70",
    icon: "text-primary/50",
    glow: "",
  },
  // Premium/rare rewards
  premium: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
    text: "text-purple-400",
    icon: "text-purple-400",
    glow: "shadow-[0_0_15px_rgba(112,0,255,0.3)]",
  },
  // Spent/deducted
  spent: {
    bg: "bg-danger/10",
    border: "border-danger/30",
    text: "text-danger",
    icon: "text-danger",
    glow: "",
  },
} as const;

const sizeStyles = {
  sm: {
    container: "px-2 py-0.5 text-xs gap-1",
    icon: "w-3 h-3",
  },
  md: {
    container: "px-3 py-1 text-sm gap-1.5",
    icon: "w-4 h-4",
  },
  lg: {
    container: "px-4 py-2 text-base gap-2",
    icon: "w-5 h-5",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// RC ICON
// ═══════════════════════════════════════════════════════════════════

function RCIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
 * ReputationBadge - Portable RC display for transfer animations
 *
 * @example
 * ```tsx
 * // On Intel Card (potential earnings)
 * <ReputationBadge
 *   amount={10}
 *   variant="potential"
 *   layoutId="rc-badge-intel-123"
 * />
 *
 * // After claim (earned celebration)
 * <ReputationBadge
 *   amount={10}
 *   variant="earned"
 *   showPrefix
 * />
 *
 * // In navbar (default)
 * <ReputationBadge
 *   amount={2450}
 *   layoutId="rc-badge-navbar"
 * />
 * ```
 */
export function ReputationBadge({
  amount,
  variant = "default",
  size = "md",
  showPrefix = false,
  layoutId,
  pulse = false,
  showIcon = true,
  className,
  onClick,
}: ReputationBadgeProps) {
  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  const prefix = showPrefix ? (amount >= 0 ? "+" : "") : "";
  const formattedAmount = Math.abs(amount).toLocaleString("en-US");

  return (
    <div
      className={cn(
        // Base styles
        "inline-flex items-center rounded-full font-mono font-semibold",
        "border transition-all duration-200",
        // Variant styles
        variantConfig.bg,
        variantConfig.border,
        variantConfig.text,
        variantConfig.glow,
        // Size styles
        sizeConfig.container,
        // Interactive styles
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        // Pulse animation for attention
        pulse && "animate-pulse",
        className
      )}
      data-layout-id={layoutId}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && (
        <RCIcon className={cn(sizeConfig.icon, variantConfig.icon)} />
      )}
      <span className="tabular-nums">
        {prefix}
        {formattedAmount}
      </span>
      <span className="text-muted-foreground font-sans font-medium text-[0.7em] uppercase">
        RC
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REWARD PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════

export interface RewardPreviewProps {
  /** RC amount to be earned */
  rcAmount: number;
  /** USD equivalent */
  usdEquivalent: number;
  /** Action label */
  actionLabel?: string;
  /** Whether this is locked/potential */
  locked?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RewardPreview - Shows potential reward before claiming
 *
 * Design Philosophy:
 * - Displays both "Meaning Money" (RC) and "Survival Money" (USD)
 * - Creates anticipation before the claim action
 * - Subtly anchors the USD value to reinforce the hybrid economy
 *
 * @example
 * ```tsx
 * <RewardPreview
 *   rcAmount={10}
 *   usdEquivalent={1.00}
 *   actionLabel="Claim this report"
 *   locked
 * />
 * ```
 */
export function RewardPreview({
  rcAmount,
  usdEquivalent,
  actionLabel = "Potential reward",
  locked = true,
  className,
}: RewardPreviewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg",
        "bg-gradient-to-br from-primary/5 via-transparent to-primary/5",
        "border border-primary/20",
        locked && "border-dashed",
        className
      )}
    >
      {/* Label */}
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {actionLabel}
      </span>

      {/* RC Amount */}
      <ReputationBadge
        amount={rcAmount}
        variant={locked ? "potential" : "earned"}
        size="lg"
        showPrefix={!locked}
      />

      {/* USD Equivalent */}
      <span className="text-xs text-muted-foreground/60 tabular-nums">
        ≈ ${usdEquivalent.toFixed(2)} USD
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STREAK INDICATOR
// ═══════════════════════════════════════════════════════════════════

export interface StreakIndicatorProps {
  /** Current streak count */
  streak: number;
  /** Streak type */
  streakType?: "daily" | "weekly" | "contribution";
  /** Bonus multiplier for the streak */
  bonusMultiplier?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StreakIndicator - Shows user's current streak
 *
 * Streaks encourage consistent engagement without being predatory.
 * The design is subtle (not flashy gamification) to maintain
 * the "Bank Ledger" feel.
 *
 * @example
 * ```tsx
 * <StreakIndicator streak={7} streakType="daily" bonusMultiplier={1.5} />
 * ```
 */
export function StreakIndicator({
  streak,
  streakType = "daily",
  bonusMultiplier,
  className,
}: StreakIndicatorProps) {
  const streakLabels = {
    daily: "Day",
    weekly: "Week",
    contribution: "Contribution",
  };

  const getStreakColor = (count: number) => {
    if (count >= 30) return "text-purple-400 border-purple-400/40"; // Legendary
    if (count >= 14) return "text-cyan-400 border-cyan-400/40"; // Epic
    if (count >= 7) return "text-emerald-400 border-emerald-400/40"; // Rare
    return "text-muted-foreground border-border"; // Common
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md",
        "bg-muted/30 border",
        getStreakColor(streak),
        className
      )}
    >
      {/* Fire icon for streak */}
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>

      <div className="flex flex-col">
        <span className="font-mono font-bold text-sm leading-none">
          {streak} {streakLabels[streakType]}
          {streak !== 1 && "s"}
        </span>
        {bonusMultiplier && bonusMultiplier > 1 && (
          <span className="text-[10px] text-primary/70">
            {bonusMultiplier}x bonus
          </span>
        )}
      </div>
    </div>
  );
}

export default ReputationBadge;
