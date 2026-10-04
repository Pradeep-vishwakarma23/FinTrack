/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      colors: {
        mint: {
          50: '#F3FBF8',
          100: '#E9F7F2',
          200: '#D1F0E5',
          300: '#A6E4CE',
          400: '#6ED7B4',
          500: '#35D6A2',
          600: '#22B886',
          700: '#1A956C',
          800: '#147253',
          900: '#0F4F39',
          950: '#082F22',
        },
        ink: {
          950: '#0A0A0A',
          900: '#121212',
          800: '#1E1E24',
          700: '#2E2E38',
          600: '#4B4B5A',
          500: '#717182',
          400: '#9898A8',
          300: '#C4C4D0',
          200: '#E4E4EB',
          100: '#F2F2F5',
          50: '#FAFAFC',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        primary: '#1f2937',
        secondary: '#3b82f6',
        accent: '#35D6A2'
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'card-slab': '0 20px 40px -15px rgba(10, 10, 10, 0.04), 0 0 1px 1px rgba(10, 10, 10, 0.05)',
        'card-slab-hover': '0 25px 50px -18px rgba(10, 10, 10, 0.08), 0 0 0 1px rgba(53, 214, 162, 0.35)',
        'glow-mint': '0 0 25px -4px rgba(53, 214, 162, 0.35)',
        'glow-mint-lg': '0 0 45px -8px rgba(53, 214, 162, 0.45)',
        'glow-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.3)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
