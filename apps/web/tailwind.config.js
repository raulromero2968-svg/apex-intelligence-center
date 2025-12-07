/** @type {import('tailwindcss').Config} */

/**
 * Apex Intelligence Tailwind Configuration
 *
 * DESIGN SYSTEM: "Aerospace Dark Mode"
 *
 * This config implements the "Human-in-the-Loop" aesthetic:
 * - AI-generated content: muted, infrastructure feel
 * - Human curation: high-contrast, signal emphasis
 *
 * Visual Reference: SpaceX Mission Control, Bloomberg Terminal, F1 HUD
 */

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{tsx,ts}',
  ],
  theme: {
    extend: {
      // =======================================================================
      // TYPOGRAPHY
      // =======================================================================
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI Variable Display"',
          '"Segoe UI"',
          'Helvetica',
          '"Apple Color Emoji"',
          'Arial',
          'sans-serif',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
        'holo-mono': ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
      },

      // =======================================================================
      // COLOR SYSTEM
      // =======================================================================
      colors: {
        // ---------------------------------------------------------------------
        // AEROSPACE BLACKS (Primary Backgrounds)
        // Use semantic names for clarity
        // ---------------------------------------------------------------------
        aerospace: {
          void: '#000000',      // Modal overlays, true black
          deep: '#030508',      // Page background
          space: '#060A10',     // Card backgrounds
          carbon: '#0A0F16',    // Elevated surfaces
          graphite: '#0F151D', // Tertiary backgrounds
        },

        // ---------------------------------------------------------------------
        // EXTENDED SLATE (with 950)
        // ---------------------------------------------------------------------
        slate: {
          950: '#020617', // Titan Deep Space (existing)
        },

        // ---------------------------------------------------------------------
        // CYAN SCALE (Primary Accent - Human Signal)
        // ---------------------------------------------------------------------
        cyan: {
          400: '#22d3ee', // Titan Neon
          500: '#06b6d4',
          high: '#00F5FF', // HUD accent, high intensity
        },

        // ---------------------------------------------------------------------
        // PURPLE SCALE (Secondary Accent)
        // ---------------------------------------------------------------------
        purple: {
          high: '#B026FF', // Premium/rare accent
        },

        // ---------------------------------------------------------------------
        // SEMANTIC COLORS (Data Visualization)
        // ---------------------------------------------------------------------
        positive: {
          DEFAULT: '#4ade80',
          muted: '#22c55e',
        },
        negative: {
          DEFAULT: '#f87171',
          muted: '#ef4444',
        },

        // ---------------------------------------------------------------------
        // RARITY TIERS (TCG-specific)
        // ---------------------------------------------------------------------
        rarity: {
          common: '#94a3b8',
          uncommon: '#4ade80',
          rare: '#22d3ee',
          epic: '#c084fc',
          legendary: '#fbbf24',
          mythic: '#B026FF',
        },

        // ---------------------------------------------------------------------
        // AI vs HUMAN Text Distinction
        // Core to "Human-in-the-Loop" aesthetic
        // ---------------------------------------------------------------------
        signal: {
          human: '#FFFFFF',     // Human-curated content
          ai: '#94a3b8',        // AI-generated content (slate-400)
          'ai-subtle': '#64748b', // AI metadata (slate-500)
        },

        // ---------------------------------------------------------------------
        // REPUTATION CREDITS (RC) - Gamification
        // ---------------------------------------------------------------------
        rc: {
          glow: '#00F5FF',
          text: '#22d3ee',
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.3)',
        },

        // ---------------------------------------------------------------------
        // LEGACY CYBERPUNK COLORS (Backwards Compatibility)
        // Preserved for existing components
        // ---------------------------------------------------------------------
        'neon-pink': '#FF006E',
        'neon-cyan': '#00F5FF',
        'neon-purple': '#B026FF',
        'neon-blue': '#0066FF',
        'cyber-dark': '#0A0E27',
        'cyber-darker': '#050814',
        'cyber-gray': '#1A1F3A',
      },

      // =======================================================================
      // BOX SHADOWS
      // =======================================================================
      boxShadow: {
        // Elevation shadows (dark mode optimized)
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.5)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',

        // Glow shadows (HUD aesthetic)
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)',
        'glow-cyan-intense': '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.3)',
        'glow-purple': '0 0 20px rgba(192, 132, 252, 0.4), 0 0 40px rgba(192, 132, 252, 0.2)',
        'glow-success': '0 0 15px rgba(74, 222, 128, 0.4)',
        'glow-danger': '0 0 15px rgba(248, 113, 113, 0.4)',

        // Focus ring
        'focus-ring': '0 0 0 2px #030508, 0 0 0 4px #22d3ee',

        // Legacy neon shadows
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(176, 38, 255, 0.5)',
      },

      // =======================================================================
      // KEYFRAMES
      // =======================================================================
      keyframes: {
        // Ambient breathing (for HoloCard borders)
        breathing: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.02)' },
        },

        // Subtle tilt (for cards)
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(0.5deg)' },
          '75%': { transform: 'rotate(-0.5deg)' },
        },

        // Scanline effect (HUD aesthetic)
        scanlines: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.5' },
        },

        // Scan sweep (for loading states)
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },

        // RC Float (gamification - +5 RC animation)
        'rc-float': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-24px) scale(1.2)' },
        },

        // Pulse glow (notifications)
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(34, 211, 238, 0)' },
        },

        // Fade in up (entry animation)
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // Fade in (simple)
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        // Slide in from right (panels)
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },

        // Slide in from left (mobile nav)
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },

        // Scale in (modals)
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },

        // Legacy holo-glitch (preserved for existing components)
        'holo-glitch': {
          '0%': {
            boxShadow: '0 0 20px #00eaff, 0 0 40px #00eaff, 0 0 60px #00eaff, inset 0 0 20px #00eaff',
            transform: 'translate(var(--glitch-x1, 0px), var(--glitch-y1, 0px))',
            filter: 'hue-rotate(0deg)',
          },
          '25%': {
            boxShadow: '0 0 30px #00eaff, 0 0 50px #00eaff, 0 0 70px #00eaff, inset 0 0 30px #00eaff',
            transform: 'translate(var(--glitch-x2, 4px), var(--glitch-y2, -4px))',
            filter: 'hue-rotate(90deg)',
          },
          '50%': {
            boxShadow: '0 0 20px #d946ef, 0 0 40px #d946ef, 0 0 60px #d946ef, inset 0 0 20px #d946ef',
            transform: 'translate(var(--glitch-x3, -4px), var(--glitch-y3, 4px))',
            filter: 'hue-rotate(180deg)',
          },
          '75%': {
            boxShadow: '0 0 30px #d946ef, 0 0 50px #d946ef, 0 0 70px #d946ef, inset 0 0 30px #d946ef',
            transform: 'translate(var(--glitch-x4, 4px), var(--glitch-y4, 4px))',
            filter: 'hue-rotate(270deg)',
          },
          '100%': {
            boxShadow: '0 0 20px #00eaff, 0 0 40px #00eaff, 0 0 60px #00eaff, inset 0 0 20px #00eaff',
            transform: 'translate(var(--glitch-x1, 0px), var(--glitch-y1, 0px))',
            filter: 'hue-rotate(360deg)',
          },
        },
      },

      // =======================================================================
      // ANIMATIONS
      // =======================================================================
      animation: {
        // Ambient (slow, background)
        breathing: 'breathing 4s ease-in-out infinite',
        tilt: 'tilt 10s ease-in-out infinite',
        scanlines: 'scanlines 1.5s ease-in-out infinite',
        scan: 'scan 2s linear infinite',

        // Interactive (fast, <300ms)
        'rc-float': 'rc-float 0.8s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',

        // Legacy
        'holo-glitch': 'holo-glitch 1s ease-in-out infinite',
      },

      // =======================================================================
      // BORDER RADIUS
      // =======================================================================
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },

      // =======================================================================
      // BACKDROP BLUR
      // =======================================================================
      backdropBlur: {
        xs: '2px',
      },

      // =======================================================================
      // TRANSITION DURATIONS (follow <300ms constraint)
      // =======================================================================
      transitionDuration: {
        '50': '50ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
