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
        // SISTC accent colors (from sistc.edu.au)
        'sistc': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#00d082',  // Vivid green-cyan (primary accent)
          700: '#0d9488',
          800: '#115e59',
          900: '#134e4a',
        },
        'sistc-light': {
          DEFAULT: '#7adcb4',  // Light green-cyan
          50: '#f0fdf9',
          100: '#ccfce7',
          200: '#99f6d4',
          300: '#7adcb4',
          400: '#4ade80',
          500: '#22c55e',
        },
        'campus': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Logo colors
        'logo-dark': '#1e3a8a',
        'logo-bright': '#00d082',
      }
    },
  },
  plugins: [],
}
