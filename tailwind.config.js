/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EPA design tokens — consistent across all industry views
        navy:    { DEFAULT: '#163A5F', light: '#1E4D7B', dark: '#0F2940' },
        gold:    { DEFAULT: '#B45309', light: '#D97706', pale: '#FEF3C7' },
        emerald: { DEFAULT: '#065F46', light: '#047857', pale: '#ECFDF5' },
        burgundy:{ DEFAULT: '#991B1B', light: '#B91C1C', pale: '#FEF2F2' },
        violet:  { DEFAULT: '#5B21B6', light: '#6D28D9', pale: '#F5F3FF' },
        slate:   { DEFAULT: '#334155', light: '#475569', pale: '#F8FAFC' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
