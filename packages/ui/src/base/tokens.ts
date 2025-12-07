/**
 * Apex Design System - Design Tokens
 *
 * These tokens are the foundation of the "Institutional Futurism" design language.
 * They ensure consistency across all components and applications.
 */

// ═══════════════════════════════════════════════════════════════════
// COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════

export const colors = {
  // The Void (Backgrounds)
  background: {
    default: "#0B0E14",  // Deep Space - primary background
    elevated: "#0F1318", // Elevated surfaces
    deep: "#080A0F",     // Deeper sections
  },

  // The Signal (Accents)
  primary: {
    default: "#00F0FF",  // Apex Cyan - primary actions
    hover: "#33F3FF",    // Lighter on hover
    muted: "rgba(0, 240, 255, 0.1)", // Background tint
  },

  secondary: {
    purple: "#7000FF",   // Electric Purple - secondary brand
    purpleMuted: "rgba(112, 0, 255, 0.1)",
  },

  // Semantic (Instrumentation, not candy)
  semantic: {
    success: "#00C050",  // Green - positive values
    warning: "#FFB020",  // Amber - caution states
    error: "#FF453A",    // Red - alerts/destructive
    info: "#00F0FF",     // Cyan - informational
  },

  // Text
  text: {
    primary: "#F8FAFC",   // Slate 50 - primary text
    secondary: "#94A3B8", // Slate 400 - subtext
    muted: "#64748B",     // Slate 500 - disabled/hints
  },

  // Borders
  border: {
    default: "#1E293B",  // Slate 800 - subtle borders
    hover: "#334155",    // Slate 700 - hover state
    focus: "#00F0FF",    // Cyan - focus rings
  },

  // Chart colors (Data Visualization)
  chart: {
    cyan: "#00F0FF",
    purple: "#7000FF",
    green: "#00C050",
    amber: "#FFB020",
    red: "#FF453A",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY TOKENS
// ═══════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace',
  },

  fontSize: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    base: "1rem",      // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// SPACING TOKENS
// ═══════════════════════════════════════════════════════════════════

export const spacing = {
  0: "0",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  3.5: "0.875rem",  // 14px
  4: "1rem",        // 16px
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  7: "1.75rem",     // 28px
  8: "2rem",        // 32px
  9: "2.25rem",     // 36px
  10: "2.5rem",     // 40px
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px
  20: "5rem",       // 80px
  24: "6rem",       // 96px
} as const;

// ═══════════════════════════════════════════════════════════════════
// BORDER RADIUS TOKENS
// ═══════════════════════════════════════════════════════════════════

export const borderRadius = {
  none: "0",
  sm: "0.125rem",   // 2px - Sharp, technical
  DEFAULT: "0.25rem", // 4px - Aerospace feel
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  full: "9999px",   // Pill shape
} as const;

// ═══════════════════════════════════════════════════════════════════
// SHADOW TOKENS
// ═══════════════════════════════════════════════════════════════════

export const shadows = {
  none: "none",
  // Subtle, aerospace-style shadows (minimal, sharp)
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  DEFAULT: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
  md: "0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2)",
  lg: "0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 8px 16px 0 rgba(0, 0, 0, 0.2)",
  // Glow shadows for primary actions
  glowCyan: "0 0 20px rgba(0, 240, 255, 0.3)",
  glowCyanLg: "0 0 40px rgba(0, 240, 255, 0.4)",
  glowPurple: "0 0 20px rgba(112, 0, 255, 0.3)",
  glowError: "0 0 20px rgba(255, 69, 58, 0.3)",
} as const;

// ═══════════════════════════════════════════════════════════════════
// TRANSITION TOKENS
// ═══════════════════════════════════════════════════════════════════

export const transitions = {
  duration: {
    fast: "100ms",
    DEFAULT: "150ms",
    slow: "300ms",
    slower: "500ms",
  },
  timing: {
    DEFAULT: "ease-out",
    in: "ease-in",
    inOut: "ease-in-out",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// Z-INDEX TOKENS
// ═══════════════════════════════════════════════════════════════════

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ═══════════════════════════════════════════════════════════════════
// BREAKPOINT TOKENS
// ═══════════════════════════════════════════════════════════════════

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1400px",
} as const;
