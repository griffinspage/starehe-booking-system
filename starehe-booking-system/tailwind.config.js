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
          900: '#060e1a',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f6f9',
          card: '#ffffff',
        },
        border: {
          DEFAULT: '#e2e6ec',
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
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
