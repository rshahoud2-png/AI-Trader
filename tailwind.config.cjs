/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#06080d',
          panel: '#0d1320',
          card: '#111827',
          line: '#243044',
          cyan: '#67e8f9',
          green: '#39ff88',
          red: '#fb7185',
          amber: '#fbbf24'
        }
      },
      boxShadow: {
        glow: '0 0 28px rgba(103, 232, 249, 0.08)'
      }
    }
  },
  plugins: []
};
