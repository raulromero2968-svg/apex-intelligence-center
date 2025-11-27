/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{tsx,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
        'holo-mono': ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
      },
      colors: {
        slate: {
          950: '#020617', // Titan Deep Space
        },
        cyan: {
          400: '#22d3ee', // Titan Neon
          500: '#06b6d4',
          // New High-Intensity Neon for Cyberpunk F1
          high: '#00eaff',
        },
        purple: {
          // New High-Intensity Purple
          high: '#d946ef',
        }
      },
      keyframes: {
        'tilt': {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(0.5deg)',
          },
          '75%': {
            transform: 'rotate(-0.5deg)',
          },
        },
        'breathing': {
          '0%, 100%': {
            opacity: '0.3',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(1.02)',
          },
        },
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
        'scanlines': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.5' }, // More visible pulse for dramatic effect
        },
      },
      animation: {
        'holo-glitch': 'holo-glitch 1s ease-in-out infinite', // Faster for racing intensity
        'scanlines': 'scanlines 1.5s ease-in-out infinite',
        'tilt': 'tilt 10s ease-in-out infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
