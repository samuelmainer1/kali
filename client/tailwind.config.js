/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f68b1e',
          dark: '#e07b10',
          soft: '#fff5eb',
          border: '#ffe0b2',
        },
        secondary: '#282828',
        accent: {
          DEFAULT: '#00a651',
          dark: '#008f45',
        },
        bdgreen: '#0a7a3c',
        ink: {
          DEFAULT: '#333333',
          soft: '#555555',
          mute: '#777777',
        },
        mist: {
          DEFAULT: '#f5f5f5',
          card: '#ffffff',
        },
        ember: {
          DEFAULT: '#f68b1e',
          deep: '#e07b10',
          pale: '#fff5eb',
        },
        leaf: {
          DEFAULT: '#00a651',
          bright: '#00a651',
          pale: '#e8f8ef',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        lift: '0 6px 16px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        store: '1400px',
      },
      borderRadius: {
        bd: '8px',
      },
    },
  },
  plugins: [],
};
