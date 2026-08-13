/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rojo de marca Valerza, extraído del PDF institucional
        brand: {
          50: '#fdf2f3',
          100: '#fce4e6',
          200: '#f8c1c7',
          300: '#f0939d',
          400: '#e35c6c',
          500: '#c9384a',
          600: '#b01c2e', // rojo principal de marca
          700: '#93172a',
          800: '#7a1727',
          900: '#671826',
        },
        // Carbón/navy usado en las filas "Total" del PDF
        ink: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9dade',
          300: '#b3b5bd',
          400: '#82858f',
          500: '#5b5e69',
          600: '#43454f',
          700: '#31333c',
          800: '#1f2937', // navy principal
          900: '#161b26',
          950: '#0d1017',
        },
        gold: {
          100: '#fef3c7',
          800: '#92400e',
        },
        dollar: {
          100: '#dbeafe',
          800: '#1e40af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
