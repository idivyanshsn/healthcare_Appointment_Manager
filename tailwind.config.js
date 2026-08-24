/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#134e4a',
          950: '#042f2e',
        },
        urgency: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
