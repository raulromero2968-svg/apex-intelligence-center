import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

/**
 * Shared Tailwind Configuration for @apex/ui
 *
 * This configuration is the source of truth for the Apex Design System.
 * Apps (web, mobile) should extend this config to ensure consistency.
 */
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
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
        // HSL-based semantic tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Brand Identity
        primary: {
          DEFAULT: "#00F0FF",
          foreground: "#000000",
          muted: "rgba(0, 240, 255, 0.1)",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        destructive: {
          DEFAULT: "#FF453A",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
        },
        card: {
          DEFAULT: "#0B0E14",
          border: "#1E293B",
          foreground: "#F8FAFC",
        },

        // Data Visualization
        chart: {
          1: "#00F0FF",
          2: "#7000FF",
          3: "#00C050",
          4: "#FFB020",
          5: "#FF453A",
        },

        // Deep Space Backgrounds
        space: {
          void: "#0B0E14",
          deep: "#080A0F",
          surface: "#0F1318",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
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
        "pulse-cyan": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)"
          },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-fast": "pulse-cyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },

      boxShadow: {
        aerospace: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
        "aerospace-md": "0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2)",
        "aerospace-lg": "0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 8px 16px 0 rgba(0, 0, 0, 0.2)",
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.3)",
        "glow-cyan-lg": "0 0 40px rgba(0, 240, 255, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
