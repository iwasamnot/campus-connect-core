/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SISTC-inspired color palette (from sistc.edu.au)
        'sistc': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // Primary indigo/purple (SISTC accent)
          600: '#4f46e5',  // Deep indigo (main accent)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        'campus': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',  // Primary blue
          700: '#1d4ed8',
          800: '#1e40af',  // Deep blue (SISTC primary)
          900: '#1e3a8a',  // Dark blue
        },
        // Logo colors
        'logo-dark': '#1e3a8a',
        'logo-bright': '#6366f1',
      }
    },
  },
  plugins: [],
}
