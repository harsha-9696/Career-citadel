/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        border: 'rgba(226, 232, 240, 0.8)',
        border2: 'rgba(203, 213, 225, 0.8)',
        accent: '#10b981',
        accent2: '#3b82f6',
        accent3: '#8b5cf6',
        brutal: '#ef4444',
        text: '#0f172a',
        muted: '#64748b',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        body: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
