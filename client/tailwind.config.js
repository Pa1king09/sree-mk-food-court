/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071811',
          900: '#0c2419',
          800: '#143527',
          700: '#1b4a37',
          600: '#25654b',
          500: '#328664'
        },
        gold: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207'
        },
        cream: {
          50: '#fcfbf7',
          100: '#f7f4ea',
          200: '#eee8d5',
          300: '#e2d7ba'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        serif: [
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif'
        ]
      }
    }
  },
  plugins: []
}
