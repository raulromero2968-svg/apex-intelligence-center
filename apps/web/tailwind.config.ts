import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

/**
 * Apex Design System - "Institutional Futurism" / "Aerospace Dark"
 *
 * Philosophy:
 * - Deep, matte backgrounds minimize cognitive load
 * - Data (accents and text) pops against the void
 * - Sharp, precise corners feel technical (trading terminal aesthetic)
 * - Desaturated semantic colors look like instrumentation, not candy
 *
 * WCAG AA compliant contrast ratios throughout.
 */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}", // Monorepo structure
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // === HSL-based semantic tokens (for dynamic theming) ===
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // #0B0E14 (Deep Space)
        foreground: "hsl(var(--foreground))", // #F8FAFC (Slate 50)

        // === Brand Identity (Apex Cyan) ===
        primary: {
          DEFAULT: "#00F0FF", // Apex Cyan (Electric) - sparingly for primary actions
          foreground: "#000000", // Black text on Cyan button
          muted: "rgba(0, 240, 255, 0.1)", // For hover states/backgrounds
        },
        secondary: {
          DEFAULT: "#1E293B", // Slate 800 (Surface)
          foreground: "#F8FAFC",
        },
        destructive: {
          DEFAULT: "#FF453A", // Apple Red (clear alert, desaturated)
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8", // Slate 400 (Subtext)
        },
        accent: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#0F172A", // Slate 900
          foreground: "#F8FAFC",
        },
        card: {
          DEFAULT: "#0B0E14", // Matches background for flat look
          border: "#1E293B", // Border creates the separation
          foreground: "#F8FAFC",
        },

        // === Data Visualization (Charts/Graphs) ===
        // Desaturated to look like instrumentation
        chart: {
          1: "#00F0FF", // Cyan (Primary)
          2: "#7000FF", // Electric Purple (Secondary Brand)
          3: "#00C050", // Success Green (Instrumentation)
          4: "#FFB020", // Warning Amber (Instrumentation)
          5: "#FF453A", // Error Red (Alert)
        },

        // === Deep Space Backgrounds (The Void / Aerospace) ===
        // Avoiding pure #000000 to prevent OLED smearing and eye strain
        space: {
          void: "#0B0E14",    // Primary background
          deep: "#080A0F",    // Deeper sections
          surface: "#0F1318", // Elevated surfaces
        },
        aerospace: {
          void: "#000000",      // Modal overlays, true black
          deep: "#030508",      // Page background
          space: "#060A10",     // Card backgrounds
          carbon: "#0A0F16",    // Elevated surfaces
          graphite: "#0F151D",  // Tertiary backgrounds
        },

        // === Human-in-the-Loop Text Hierarchy ===
        // Core to distinguishing AI-generated from human-curated content
        signal: {
          human: "#FFFFFF",       // Human-curated content (high emphasis)
          ai: "#94a3b8",          // AI-generated content (slate-400)
          "ai-subtle": "#64748b", // AI metadata (slate-500)
        },

        // === Semantic Data Colors ===
        positive: {
          DEFAULT: "#4ade80",
          muted: "#22c55e",
        },
        negative: {
          DEFAULT: "#f87171",
          muted: "#ef4444",
        },

        // === TCG Rarity Tiers ===
        rarity: {
          common: "#94a3b8",
          uncommon: "#4ade80",
          rare: "#22d3ee",
          epic: "#c084fc",
          legendary: "#fbbf24",
          mythic: "#B026FF",
        },

        // === Reputation Credits (RC) Gamification ===
        rc: {
          glow: "#00F5FF",
          text: "#22d3ee",
          bg: "rgba(6, 182, 212, 0.15)",
          border: "rgba(6, 182, 212, 0.3)",
        },

        // === Legacy compatibility (gradual migration) ===
        slate: {
          950: "#020617",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          high: "#00F5FF", // HUD accent
        },
        purple: {
          high: "#B026FF", // Premium/rare accent
        },

        // === Neon legacy (for existing components) ===
        "neon-pink": "#FF006E",
        "neon-cyan": "#00F5FF",
        "neon-purple": "#B026FF",
        "neon-blue": "#0066FF",
        "cyber-dark": "#0A0E27",
        "cyber-darker": "#050814",
        "cyber-gray": "#1A1F3A",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        // Inter for UI - clean, professional, highly legible
        sans: ["var(--font-inter)", ...fontFamily.sans],
        // JetBrains Mono for data - perfectly aligned columns for pricing/stocks
        mono: ["var(--font-jetbrains)", "JetBrains Mono", ...fontFamily.mono],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Subtle pulse for "Live" data indicators
        "pulse-cyan": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // Gentle glow for primary button hover
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)"
          },
        },
        // Fade in for component mounts
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Subtle shimmer for loading states
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // === Aerospace Dark Mode Animations ===

        // Ambient breathing (for HoloCard borders)
        "breathing": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.02)" },
        },

        // Subtle tilt (for cards)
        "tilt": {
          "0%, 50%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(0.5deg)" },
          "75%": { transform: "rotate(-0.5deg)" },
        },

        // Scanline effect (HUD aesthetic)
        "scanlines": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.5" },
        },

        // RC Float (gamification - +5 RC animation)
        "rc-float": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-24px) scale(1.2)" },
        },

        // Fade in up (entry animation)
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },

        // Slide in from right (panels)
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },

        // Scale in (modals)
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },

        // Legacy holo-glitch (preserved for existing components)
        "holo-glitch": {
          "0%": {
            boxShadow: "0 0 20px #00eaff, 0 0 40px #00eaff, 0 0 60px #00eaff, inset 0 0 20px #00eaff",
            transform: "translate(var(--glitch-x1, 0px), var(--glitch-y1, 0px))",
            filter: "hue-rotate(0deg)",
          },
          "50%": {
            boxShadow: "0 0 20px #d946ef, 0 0 40px #d946ef, 0 0 60px #d946ef, inset 0 0 20px #d946ef",
            filter: "hue-rotate(180deg)",
          },
          "100%": {
            boxShadow: "0 0 20px #00eaff, 0 0 40px #00eaff, 0 0 60px #00eaff, inset 0 0 20px #00eaff",
            filter: "hue-rotate(360deg)",
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-fast": "pulse-cyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        // Aerospace Dark Mode animations
        "breathing": "breathing 4s ease-in-out infinite",
        "tilt": "tilt 10s ease-in-out infinite",
        "scanlines": "scanlines 1.5s ease-in-out infinite",
        "rc-float": "rc-float 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "holo-glitch": "holo-glitch 1s ease-in-out infinite",
      },

      // Box shadows for depth without looking "bubbly"
      boxShadow: {
        "aerospace": "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
        "aerospace-md": "0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2)",
        "aerospace-lg": "0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 8px 16px 0 rgba(0, 0, 0, 0.2)",
        // Glow shadows (HUD aesthetic)
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
        "glow-cyan-intense": "0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.3)",
        "glow-cyan-lg": "0 0 40px rgba(0, 240, 255, 0.4)",
        "glow-purple": "0 0 20px rgba(192, 132, 252, 0.4), 0 0 40px rgba(192, 132, 252, 0.2)",
        "glow-success": "0 0 15px rgba(74, 222, 128, 0.4)",
        "glow-danger": "0 0 15px rgba(248, 113, 113, 0.4)",
        // Focus ring
        "focus-ring": "0 0 0 2px #030508, 0 0 0 4px #22d3ee",
        // Legacy neon shadows
        "neon-pink": "0 0 20px rgba(255, 0, 110, 0.5)",
        "neon-cyan": "0 0 20px rgba(0, 245, 255, 0.5)",
        "neon-purple": "0 0 20px rgba(176, 38, 255, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
