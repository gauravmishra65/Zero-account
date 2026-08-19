/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          base: '#0a0a0c',
          panel: '#111114',
          card: '#16161a',
          line: '#1f1f24',
          muted: '#3a3a42',
        },
        signal: {
          DEFAULT: '#e8a33d', // amber/terminal-gold
          dim: '#8a6a2e',
          glow: '#f5b94a',
        },
        bone: '#eef0f2',
        bright: '#f4f5f6',
        'bright-muted': '#c7cbd1',
        'bright-faint': '#9aa1ab',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Cinzel Decorative"', 'serif'],
        mono: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.35' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.55' },
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
        flicker: 'flicker 6s linear infinite',
        revealUp: 'revealUp 0.4s ease forwards',
        scrollX: 'scrollX 40s linear infinite',
        glitch: 'glitch 0.28s steps(2, end) 1',
      },
    },
  },
  plugins: [],
};
