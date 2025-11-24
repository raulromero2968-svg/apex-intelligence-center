/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0E1A',
        slate: {
          950: '#020617', // Titan Deep Space
        },
        magenta: {
          500: '#FF00FF',
        },
        cyan: {
          400: '#22d3ee', // Titan Neon
          500: '#06b6d4',
        },
        purple: {
          500: '#9333EA',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'holo-glitch': 'holo-glitch 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'holo-glitch': {
          '0%, 100%': { boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4', transform: 'translate(0, 0)' },
          '25%': { boxShadow: '0 0 15px #06b6d4, 0 0 25px #06b6d4', transform: 'translate(1px, -1px)' },
          '50%': { boxShadow: '0 0 10px #a855f7, 0 0 20px #a855f7', transform: 'translate(-1px, 1px)' },
          '75%': { boxShadow: '0 0 15px #a855f7, 0 0 25px #a855f7', transform: 'translate(1px, 1px)' },
        },
      },
    },
  },
  plugins: [],
}
