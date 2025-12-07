/**
 * @apex/ui - Shared UI Component Library
 *
 * This package contains the design system tokens, primitives, and
 * shared components for the Apex Intelligence platform.
 *
 * @packageDocumentation
 */

// =============================================================================
// VERSION
// =============================================================================
export const version = '0.1.0';

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export {
  tokens,
  primitives,
  semantic,
  typography,
  spacing,
  animation,
  shadows,
  breakpoints,
  zIndex,
  components,
} from './tokens/design-tokens';

export type {
  Tokens,
  Primitives,
  Semantic,
  Typography,
  Spacing,
  Animation,
  Shadows,
  Breakpoints,
  ZIndex,
  Components,
} from './tokens/design-tokens';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats a number as currency (USD)
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a number as percentage with sign
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formats a large number in compact notation
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

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
// COMPONENT EXPORTS
// =============================================================================

// Note: Components are currently in apps/web/src/components/ui
// As the design system matures, shared components will be migrated here.
// For now, import directly from the web app's components.

// Future exports will include:
// export { HoloCard } from './components/HoloCard';
// export { Button } from './components/Button';
// export { Input } from './components/Input';
// etc.
