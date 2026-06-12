import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#06080d',
          panel: '#0d111a',
          card: '#111827',
          line: '#223047',
          green: '#39ff88',
          red: '#ff4664',
          amber: '#f6c453',
          cyan: '#35d3ff'
        }
      },
      boxShadow: {
        glow: '0 0 40px rgba(53, 211, 255, 0.14)'
      }
    }
  },
  plugins: []
} satisfies Config;
