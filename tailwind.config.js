/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Default Body
        display: ['var(--font-chakra)', 'sans-serif'], // Titan Headers (Racecar Look)
        tech: ['var(--font-space)', 'sans-serif'], // Sub-headers (NASA Look)
        mono: ['var(--font-mono)', 'monospace'], // Terminal Stream
      },
      colors: {
        // Cyberpunk neon palette
        'neon-pink': '#FF006E',
        'neon-cyan': '#00F5FF',
        'neon-purple': '#B026FF',
        'neon-blue': '#0066FF',
        'cyber-dark': '#0A0E27',
        'cyber-darker': '#050814',
        'cyber-gray': '#1A1F3A',
        // Titan Visual Engine: Intensified Cyberpunk F1 Palette
        'cyan-high': '#06FFF0',
        'purple-high': '#D946EF',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': "linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)",
      },
      animation: {
        'glow-pulse': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'scan-slow': 'scan 8s linear infinite',
        'holo-glitch': 'holoGlitch 3s ease-in-out infinite',
        'scanlines': 'scanlines 8s linear infinite',
        'tilt': 'tilt 10s ease-in-out infinite',
      },
      keyframes: {
        tilt: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scan: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        holoGlitch: {
          '0%, 100%': {
            filter: 'hue-rotate(0deg) brightness(1)',
            boxShadow: '0 0 20px rgba(6, 255, 240, 0.3)'
          },
          '33%': {
            filter: 'hue-rotate(90deg) brightness(1.1)',
            boxShadow: '0 0 30px rgba(217, 70, 239, 0.5)'
          },
          '66%': {
            filter: 'hue-rotate(180deg) brightness(0.9)',
            boxShadow: '0 0 25px rgba(6, 255, 240, 0.4)'
          },
        },
        scanlines: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(176, 38, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
