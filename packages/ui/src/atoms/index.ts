/**
 * Apex Design System - Atoms
 *
 * Atomic primitives: Button, Input, Badge, Skeleton
 * These are the smallest building blocks of the interface.
 *
 * Following Atomic Design methodology:
 * - Atoms are basic HTML elements styled with the Apex Design System
 * - They cannot be broken down any further without losing functionality
 *
 * Design Philosophy: "Aerospace Dark"
 * - Buttons are triggers for value creation (contained plasma glow)
 * - Badges are instrumentation, not decoration
 * - Skeletons are ghost UIs that maintain trust
 */

// ═══════════════════════════════════════════════════════════════════
// BUTTON - The trigger for value creation
// ═══════════════════════════════════════════════════════════════════
export { Button, buttonVariants } from "./Button";
export type { ButtonProps } from "./Button";

// ═══════════════════════════════════════════════════════════════════
// BADGE - Status indicators with instrumentation aesthetics
// ═══════════════════════════════════════════════════════════════════
export { Badge, badgeVariants, SentimentBadge, GradeBadge } from "./Badge";
export type { BadgeProps } from "./Badge";

// ═══════════════════════════════════════════════════════════════════
// SKELETON - Ghost UI loading states
// ═══════════════════════════════════════════════════════════════════
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonMetric,
} from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";
