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
        // SISTC accent colors (green-cyan gradient)
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
      }
    },
  },
  plugins: [],
}
