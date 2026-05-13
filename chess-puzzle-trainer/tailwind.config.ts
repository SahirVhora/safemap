import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#121826',
        panelSoft: '#1a2233',
        textMain: '#e5ecf6',
        textSoft: '#9fb0ca',
        accent: '#2dd4bf',
        warning: '#f59e0b',
        danger: '#fb7185'
      },
      boxShadow: {
        soft: '0 14px 36px rgba(0,0,0,0.32)'
      }
    }
  },
  plugins: []
} satisfies Config;
