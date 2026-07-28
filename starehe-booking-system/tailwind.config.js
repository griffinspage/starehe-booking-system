/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f6',
          100: '#d4dce8',
          200: '#a9b9d1',
          300: '#7e96ba',
          400: '#4a6491',
          500: '#1f3a63',
          600: '#172e50',
          700: '#11233d',
          800: '#0b182a',
          950: '#030810',
          900: '#060e1a',
        },
        gold: {
          50: '#fbf8ee',
          100: '#f5edd3',
          200: '#ebd9a8',
          300: '#dec077',
          400: '#d2a74c',
          500: '#c89b3c',
          600: '#ab7a2e',
          700: '#895a27',
          800: '#714825',
          900: '#5e3c23',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f5f7fa',
          card: '#ffffff',
          panel: '#fafbfc',
        },
        border: {
          DEFAULT: '#e2e7ee',
          subtle: '#edf0f5',
        },
        ink: {
          DEFAULT: '#1c2530',
          muted: '#5b6472',
          faint: '#8b93a0',
        },
        status: {
          pending: '#b8860b',
          approved: '#1a7a4c',
          rejected: '#b3261e',
          info: '#1f3a63',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        glow: '0 0 20px rgba(31, 58, 99, 0.15)',
      },
    },
  },
  plugins: [],
};
