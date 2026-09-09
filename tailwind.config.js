/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'xp-fill': {
          '0%': { width: '0%' },
        },
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 220ms ease-out both',
        'slide-up': 'slide-up 260ms ease-out both',
        'xp-fill': 'xp-fill 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        flicker: 'flicker 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
