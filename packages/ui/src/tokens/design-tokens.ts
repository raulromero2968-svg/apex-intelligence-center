/**
 * Apex Intelligence Design Tokens
 *
 * DESIGN PHILOSOPHY: "Aerospace Dark Mode"
 *
 * This design system embodies the "Human-in-the-Loop" aesthetic:
 * - AI-generated content appears as infrastructure (muted, background)
 * - Human curation appears as signal (high-contrast, foreground)
 * - The user is the protagonist; AI is the reliable substrate
 *
 * Visual Language: SpaceX Mission Control, Bloomberg Terminal, F1 HUD
 * NOT: Cyberpunk 2077, arcade gaming, neon overload
 *
 * @module @apex/ui/tokens
 */

// ============================================================================
// PRIMITIVE COLORS
// Raw color values - never use directly in components
// ============================================================================

export const primitives = {
  // Aerospace Blacks (primary backgrounds)
  black: {
    void: '#000000',      // True black - use sparingly
    deep: '#030508',      // Primary background
    space: '#060A10',     // Card backgrounds
    carbon: '#0A0F16',    // Elevated surfaces
    graphite: '#0F151D',  // Tertiary backgrounds
  },

  // Slate Scale (borders, muted text)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',   // AI-generated text
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Cyan Scale (primary accent - human signal)
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',   // Primary interactive
    500: '#06b6d4',   // Buttons, links
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    high: '#00F5FF',  // HUD accent
  },

  // Purple Scale (secondary accent)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',   // Secondary interactive
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    high: '#B026FF',  // Premium/rare accent
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    400: '#4ade80',   // Positive change
    500: '#22c55e',   // Success state
    600: '#16a34a',
  },

  warning: {
    50: '#fefce8',
    400: '#facc15',   // Warning state
    500: '#eab308',
  },

  danger: {
    50: '#fef2f2',
    400: '#f87171',   // Negative change
    500: '#ef4444',   // Error state
    600: '#dc2626',
  },

  // Gold (premium tier)
  gold: {
    400: '#fbbf24',
    500: '#f59e0b',
  },
} as const;

// ============================================================================
// SEMANTIC TOKENS
// Purpose-driven aliases - USE THESE in components
// ============================================================================

export const semantic = {
  // -------------------------------------------------------------------------
  // Background Layers
  // -------------------------------------------------------------------------
  bg: {
    void: primitives.black.void,           // Modal overlays
    base: primitives.black.deep,           // Page background
    surface: primitives.black.space,       // Card background
    elevated: primitives.black.carbon,     // Dropdown, popover
    subtle: primitives.black.graphite,     // Hover states
  },

  // -------------------------------------------------------------------------
  // Text Hierarchy (Human-in-the-Loop)
  // -------------------------------------------------------------------------
  text: {
    // Human Signal (high emphasis)
    primary: '#FFFFFF',                    // User content, headings
    secondary: primitives.slate[300],      // Body text, labels
    tertiary: primitives.slate[400],       // Timestamps, meta

    // AI Substrate (muted)
    aiGenerated: primitives.slate[400],    // AI-generated content
    aiSubtle: primitives.slate[500],       // AI metadata

    // Interactive
    link: primitives.cyan[400],
    linkHover: primitives.cyan[300],

    // Semantic
    success: primitives.success[400],
    warning: primitives.warning[400],
    danger: primitives.danger[400],
  },

  // -------------------------------------------------------------------------
  // Border System
  // -------------------------------------------------------------------------
  border: {
    subtle: 'rgba(148, 163, 184, 0.1)',    // slate-400/10
    default: 'rgba(148, 163, 184, 0.2)',   // slate-400/20
    emphasis: 'rgba(148, 163, 184, 0.3)',  // slate-400/30

    // Interactive borders
    focus: primitives.cyan[400],
    hover: primitives.cyan[500],

    // HUD corners (aerospace aesthetic)
    hud: primitives.cyan.high,
  },

  // -------------------------------------------------------------------------
  // Interactive States
  // -------------------------------------------------------------------------
  interactive: {
    // Primary action (cyan)
    primary: {
      default: primitives.cyan[500],
      hover: primitives.cyan[400],
      pressed: primitives.cyan[600],
      disabled: primitives.cyan[800],
    },

    // Secondary action (outline)
    secondary: {
      default: 'transparent',
      hover: 'rgba(6, 182, 212, 0.1)',     // cyan-500/10
      pressed: 'rgba(6, 182, 212, 0.2)',
      border: primitives.cyan[500],
    },

    // Destructive action
    danger: {
      default: primitives.danger[500],
      hover: primitives.danger[400],
      pressed: primitives.danger[600],
    },
  },

  // -------------------------------------------------------------------------
  // Data Visualization
  // -------------------------------------------------------------------------
  data: {
    positive: primitives.success[400],      // +5.2%
    negative: primitives.danger[400],       // -3.1%
    neutral: primitives.slate[400],

    // Chart colors
    series: [
      primitives.cyan[400],
      primitives.purple[400],
      primitives.success[400],
      primitives.warning[400],
      primitives.cyan[600],
      primitives.purple[600],
    ],
  },

  // -------------------------------------------------------------------------
  // Reputation Credits (RC) - Gamification
  // -------------------------------------------------------------------------
  rc: {
    glow: primitives.cyan.high,
    text: primitives.cyan[400],
    badge: {
      bg: 'rgba(6, 182, 212, 0.15)',
      border: 'rgba(6, 182, 212, 0.3)',
    },
  },

  // -------------------------------------------------------------------------
  // Card Rarity Tiers
  // -------------------------------------------------------------------------
  rarity: {
    common: primitives.slate[400],
    uncommon: primitives.success[400],
    rare: primitives.cyan[400],
    epic: primitives.purple[400],
    legendary: primitives.gold[400],
    mythic: primitives.purple.high,
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI Variable Display"',
      '"Segoe UI"',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      '"JetBrains Mono"',
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Menlo',
      'Consolas',
      'monospace',
    ].join(', '),
  },

  // Font Sizes (rem-based for accessibility)
  fontSize: {
    xs: '0.75rem',      // 12px - Meta, timestamps
    sm: '0.875rem',     // 14px - Body small
    base: '1rem',       // 16px - Body
    lg: '1.125rem',     // 18px - Large body
    xl: '1.25rem',      // 20px - H4
    '2xl': '1.5rem',    // 24px - H3
    '3xl': '1.875rem',  // 30px - H2
    '4xl': '2.25rem',   // 36px - H1
    '5xl': '3rem',      // 48px - Display
    '6xl': '3.75rem',   // 60px - Hero
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',      // Headings
    normal: '1.5',      // Body
    relaxed: '1.625',   // Long-form
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',  // Headings
    normal: '0',
    wide: '0.025em',    // All-caps, meta
    wider: '0.05em',    // Labels
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const animation = {
  // Durations (follow <300ms constraint)
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    // Exceptions for ambient effects only
    ambient: '4000ms',
  },

  // Easing Curves
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',     // ease-out
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Keyframe Definitions
  keyframes: {
    // Reputation Credit float animation
    rcFloat: {
      '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
      '100%': { opacity: '0', transform: 'translateY(-24px) scale(1.2)' },
    },

    // Pulse glow for notifications
    pulseGlow: {
      '0%, 100%': { boxShadow: `0 0 0 0 ${primitives.cyan[400]}40` },
      '50%': { boxShadow: `0 0 0 8px ${primitives.cyan[400]}00` },
    },

    // Breathing border (ambient)
    breathing: {
      '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
      '50%': { opacity: '0.6', transform: 'scale(1.02)' },
    },

    // Scan line (HUD aesthetic)
    scan: {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(100%)' },
    },
  },
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  // Elevation shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',

  // Glow shadows (aerospace HUD)
  glow: {
    cyan: `0 0 20px ${primitives.cyan[400]}40, 0 0 40px ${primitives.cyan[400]}20`,
    cyanIntense: `0 0 30px ${primitives.cyan[400]}60, 0 0 60px ${primitives.cyan[400]}30`,
    purple: `0 0 20px ${primitives.purple[400]}40, 0 0 40px ${primitives.purple[400]}20`,
    success: `0 0 15px ${primitives.success[400]}40`,
    danger: `0 0 15px ${primitives.danger[400]}40`,
  },

  // Focus ring
  focus: `0 0 0 2px ${primitives.black.deep}, 0 0 0 4px ${primitives.cyan[400]}`,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  cursor: 9999,
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  // HoloCard variants
  holoCard: {
    intensity: {
      low: {
        borderOpacity: 0.2,
        glowSize: 30,
        glowOpacity: 0.15,
      },
      medium: {
        borderOpacity: 0.3,
        glowSize: 50,
        glowOpacity: 0.25,
      },
      high: {
        borderOpacity: 0.4,
        glowSize: 70,
        glowOpacity: 0.4,
      },
    },
  },

  // Button variants
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    paddingX: {
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
    },
    borderRadius: '8px',
  },

  // Input fields
  input: {
    height: '40px',
    paddingX: spacing[3],
    borderRadius: '8px',
    bg: primitives.black.carbon,
    border: semantic.border.subtle,
    focusBorder: semantic.border.focus,
  },

  // Card padding
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
    borderRadius: '12px',
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const tokens = {
  primitives,
  semantic,
  typography,
  spacing,
  animation,
  shadows,
  breakpoints,
  zIndex,
  components,
} as const;

export type Tokens = typeof tokens;
export type Primitives = typeof primitives;
export type Semantic = typeof semantic;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Animation = typeof animation;
export type Shadows = typeof shadows;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type Components = typeof components;

export default tokens;
