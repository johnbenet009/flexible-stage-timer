/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translate(100%)' },
          '100%': { transform: 'translate(-100%)' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        attention: {
          '0%': { backgroundColor: '#dc2626' },
          '50%': { backgroundColor: '#ffffff' },
          '100%': { backgroundColor: '#dc2626' },
        },
        timerComplete: {
          '0%': { backgroundColor: '#dc2626' },
          '33%': { backgroundColor: '#ffffff' },
          '66%': { backgroundColor: '#000000' },
          '100%': { backgroundColor: '#dc2626' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        extraTimeBg: {
          '0%': { backgroundColor: '#000000' },
          '25%': { backgroundColor: '#dc2626' },
          '50%': { backgroundColor: '#ffffff' },
          '75%': { backgroundColor: '#fbbf24' },
          '100%': { backgroundColor: '#000000' },
        },
        extraTimeText: {
          '0%': { color: '#ffffff' },
          '25%': { color: '#dc2626' },
          '50%': { color: '#000000' },
          '75%': { color: '#fbbf24' },
          '100%': { color: '#ffffff' },
        },
        lastMinute: {
          '0%': { backgroundColor: '#dc2626' },
          '25%': { backgroundColor: '#000000' },
          '50%': { backgroundColor: '#fbbf24' },
          '75%': { backgroundColor: '#ffffff' },
          '100%': { backgroundColor: '#dc2626' },
        }
      },
      animation: {
        marquee: 'marquee 10s linear infinite',
        flash: 'flash 0.5s ease-in-out 5',
        attention: 'attention 0.4s ease-in-out 5',
        timerComplete: 'timerComplete 0.5s ease-in-out 5',
        slideIn: 'slideIn 0.3s ease-out',
        extraTimeBg: 'extraTimeBg 2s ease-in-out infinite',
        extraTimeText: 'extraTimeText 2s ease-in-out infinite',
        lastMinute: 'lastMinute 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};