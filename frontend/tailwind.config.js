/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          400: '#34d399',
          500: '#10b981',
          600: '#0d7a5f',
          700: '#0a6650',
          800: '#064e3b',
          900: '#022c22',
        },
      },
      boxShadow: {
        card: '0 4px 20px -8px rgba(6, 78, 59, 0.15)',
      },
    },
  },
  plugins: [],
};
