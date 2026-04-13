/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1d4e9e',
          red: '#d42a3c',
          dark: '#13152a',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        cond: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.05)',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
