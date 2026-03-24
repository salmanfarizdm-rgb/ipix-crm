/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B0F1A',
          800: '#111827',
          700: '#1a2236',
          600: '#1e293b',
          500: '#253047',
        },
        orange: {
          500: '#F97316',
          600: '#ea6c0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
