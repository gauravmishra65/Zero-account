/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          base: '#08090b',
          panel: '#111318',
          card: '#16171c',
          line: '#34363c',
          muted: '#3a3a42',
        },
        signal: {
          DEFAULT: '#e8a33d', // amber/terminal-gold
          dim: '#a96c22', // dark gold, for gradients and low-emphasis accents
          glow: '#f2b94f',
        },
        danger: '#c92f35', // reserved for alerts, warnings, breach/system signals only
        bone: '#eef0f2',
        bright: '#f4f2ed',
        'bright-muted': '#b7bbc2',
        'bright-faint': '#9aa1ab',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Cinzel Decorative"', 'serif'], // reserved for the hero book title only
        heading2: ['"Cormorant Garamond"', 'serif'], // section headings
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        // Subtler dip (was 0.35/0.55) and fired a bounded number of times
        // (via the `animation` entry below) rather than looping forever, so
        // the effect reads once as a reveal and then settles down.
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.72' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.85' },
          '97%': { opacity: '1' },
        },
        revealUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, 2px)' },
          '80%': { transform: 'translate(1px, -2px)' },
        },
      },
      animation: {
        flicker: 'flicker 6s ease-in-out 3',
        revealUp: 'revealUp 0.4s ease forwards',
        scrollX: 'scrollX 40s linear infinite',
        glitch: 'glitch 0.28s steps(2, end) 1',
      },
    },
  },
  plugins: [],
};
