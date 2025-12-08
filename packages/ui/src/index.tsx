/**
 * @apex/ui - Apex Design System
 *
 * A React component library implementing the "Aerospace Dark" aesthetic.
 * Built with Atomic Design principles for scalable, consistent interfaces.
 *
 * Architecture:
 * - base/      Design tokens (colors, typography, spacing, shadows)
 * - tokens/    Extended semantic tokens (Aerospace Dark Mode, rarity, RC)
 * - atoms/     Primitives (Button, Badge, Skeleton)
 * - molecules/ Composite (IntelCard)
 * - organisms/ Complex (MarketChart, DataGrid)
 * - lib/       Utilities (cn, formatters)
 *
 * Design Philosophy:
 * - "Institutional Futurism" meets "Aerospace Dark"
 * - Human-in-the-Loop: AI as substrate, human curation as signal
 * - Buttons are triggers for value creation
 * - Cards are containers of wealth
 * - Every interaction should feel like a cockpit command
 */

// =============================================================================
// DESIGN TOKENS - Base Layer (Institutional Futurism)
// =============================================================================
export * from "./base";

// =============================================================================
// DESIGN TOKENS - Extended Layer (Aerospace Dark Mode)
// Human-in-the-Loop semantic tokens for AI vs Human content distinction
// =============================================================================
export {
  tokens,
  primitives,
  semantic,
  typography as aerospaceTypography,
  spacing as aerospaceSpacing,
  animation,
  shadows as aerospaceShadows,
  breakpoints as aerospaceBreakpoints,
  zIndex as aerospaceZIndex,
  components as componentTokens,
} from './tokens/design-tokens';

export type {
  Tokens,
  Primitives,
  Semantic,
  Typography as AerospaceTypography,
  Spacing as AerospaceSpacing,
  Animation,
  Shadows as AerospaceShadows,
  Breakpoints as AerospaceBreakpoints,
  ZIndex as AerospaceZIndex,
  Components as ComponentTokens,
} from './tokens/design-tokens';

// =============================================================================
// UTILITIES
// =============================================================================
export * from "./lib";

// Additional semantic utilities for the design system

/**
 * Returns the appropriate text color class for positive/negative values
 */
export function getChangeColor(value: number): string {
  if (value > 0) return 'text-positive';
  if (value < 0) return 'text-negative';
  return 'text-slate-400';
}

/**
 * Returns the appropriate rarity color class
 */
export function getRarityColor(
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
): string {
  const colors = {
    common: 'text-rarity-common',
    uncommon: 'text-rarity-uncommon',
    rare: 'text-rarity-rare',
    epic: 'text-rarity-epic',
    legendary: 'text-rarity-legendary',
    mythic: 'text-rarity-mythic',
  };
  return colors[rarity] || colors.common;
}

// ═══════════════════════════════════════════════════════════════════
// ATOMIC COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Atoms - The smallest building blocks
export * from "./atoms";

// Molecules - Composite patterns
export * from "./molecules";

// Organisms - Complex sections
export * from "./organisms";

// Blog Components - Perplexity-style UI elements
export * from "./components/blog";

// Hooks - State management and animation coordination
export * from "./hooks";

// Version
export const version = "0.3.0";
