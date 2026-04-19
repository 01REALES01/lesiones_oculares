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
        primary: {
          light: '#dbeafe',
          DEFAULT: '#60a5fa',
          dark: '#3b82f6',
        },
        ocular: {
          bg: '#f0f4f8',
          surface: 'rgba(255, 255, 255, 0.7)',
          accent: '#93c5fd',
          text: {
            main: '#111827',
            muted: '#4b5563',
          },
          success: '#10b981',
          error: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'gradient-bg': 'moveBackground 25s ease-in-out infinite alternate',
      },
      keyframes: {
        moveBackground: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(-5%, -5%) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
