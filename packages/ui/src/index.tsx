/**
 * @apex/ui - Apex Design System
 *
 * A React component library implementing the "Institutional Futurism" aesthetic
 * with the "Aerospace Dark Mode" design language for the Human-in-the-Loop interface.
 *
 * Built with Atomic Design principles for scalable, consistent interfaces.
 *
 * Architecture:
 * - base/     Design tokens (colors, typography, spacing, shadows)
 * - tokens/   Extended semantic tokens (Aerospace Dark Mode, rarity, RC)
 * - atoms/    Primitives (Button, Input, Badge)
 * - molecules/ Composite (UserCard, IntelPreview)
 * - organisms/ Complex (MarketChart, DataGrid)
 * - lib/      Utilities (cn, formatters)
 *
 * @packageDocumentation
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

// =============================================================================
// ATOMIC COMPONENTS (uncomment as components are created)
// =============================================================================
// export * from "./atoms";
// export * from "./molecules";
// export * from "./organisms";

// =============================================================================
// VERSION
// =============================================================================
export const version = "0.1.0";
