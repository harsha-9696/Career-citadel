/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#16161f',
        accent: '#7fff6e',
        accent2: '#6e8fff',
        accent3: '#ff6e8f',
        brutal: '#ff4444',
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
