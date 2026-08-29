/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#7c4a2d',
          foreground: '#fdf9f5',
        },
        card: {
          DEFAULT: '#f3ede4',
          foreground: '#1c1612',
        },
        blue: {
          50: '#fdf9f5',
          100: '#f3ede4',
          200: '#e8ddd0',
          300: '#d6c9b8',
          400: '#c8843a',
          500: '#b66e30',
          600: '#7c4a2d',
          700: '#643920',
          800: '#3d2b1a',
          900: '#1c1612',
        },
        slate: {
          50: '#fdf9f5',
          100: '#faf6f1',
          200: '#ddd0be',
          300: '#d6c9b8',
          400: '#b5a898',
          500: '#7a6a5a',
          600: '#5a4a3a',
          700: '#3d2b1a',
          800: '#2a211c',
          900: '#1c1612',
        },
      },
    },
  },
  plugins: [],
}

