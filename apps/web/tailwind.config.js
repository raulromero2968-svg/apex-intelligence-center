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
        'holo-glitch': {
          '0%': {
            boxShadow: '0 0 15px #00eaff, 0 0 30px #00eaff, inset 0 0 15px #00eaff',
            transform: 'translate(0, 0)',
          },
          '25%': {
            boxShadow: '0 0 20px #00eaff, 0 0 40px #00eaff, inset 0 0 20px #00eaff',
            transform: 'translate(2px, -2px)', // Intensified glitch shift
          },
          '50%': {
            boxShadow: '0 0 15px #d946ef, 0 0 30px #d946ef, inset 0 0 15px #d946ef',
            transform: 'translate(-2px, 2px)', // Glitch reverse
          },
          '75%': {
            boxShadow: '0 0 20px #d946ef, 0 0 40px #d946ef, inset 0 0 20px #d946ef',
            transform: 'translate(2px, 2px)', // Another shift
          },
          '100%': {
            boxShadow: '0 0 15px #00eaff, 0 0 30px #00eaff, inset 0 0 15px #00eaff',
            transform: 'translate(0, 0)',
          },
        },
        'scanlines': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.3' }, // Pulse opacity for scanline glitch
        },
      },
      animation: {
        'holo-glitch': 'holo-glitch 1.5s ease-in-out infinite',
        'scanlines': 'scanlines 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
