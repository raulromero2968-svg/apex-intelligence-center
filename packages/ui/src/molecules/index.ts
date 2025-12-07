/**
 * Apex Design System - Molecules
 *
 * Composite components: IntelCard, HeroInput, etc.
 * These combine atoms to create more complex, reusable UI patterns.
 *
 * Following Atomic Design methodology:
 * - Molecules are groups of atoms bonded together
 * - They serve a specific, reusable function in the interface
 *
 * Design Philosophy: "Aerospace Dark"
 * - Intel Cards are containers of wealth with "Split Brain" layout
 * - Hero Input is the gateway to intelligence (the "Aha Moment")
 * - Dense information display without visual clutter
 * - Monospace numbers for perfect scanning
 */

// ═══════════════════════════════════════════════════════════════════
// INTEL CARD - The container of wealth
// ═══════════════════════════════════════════════════════════════════
export { IntelCard, IntelCardSkeleton } from "./IntelCard";
export type {
  IntelCardProps,
  IntelGrade,
  IntelSentiment,
} from "./IntelCard";

// ═══════════════════════════════════════════════════════════════════
// HERO INPUT - The "Aha Moment" entry point
// ═══════════════════════════════════════════════════════════════════
export { HeroInput, HeroSection } from "./HeroInput";
export type { HeroInputProps, HeroSectionProps } from "./HeroInput";
