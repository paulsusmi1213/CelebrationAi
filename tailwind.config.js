/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf7f4',
          100: '#f5ede6',
          200: '#ebd9cb',
          300: '#dcbeaa',
          400: '#ca9e84',
          500: '#b88164',
          600: '#a76f53',
          700: '#8c5943',
          800: '#714838',
          900: '#5e3d30',
        },
        celebration: {
          purple: '#6366f1',
          rose: '#f43f5e',
          amber: '#f59e0b',
          emerald: '#10b981',
          indigo: '#4f46e5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

