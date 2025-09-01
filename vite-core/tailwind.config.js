/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
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
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutToBottom: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        extraTimeBg: {
          '0%': { backgroundColor: '#dc2626' },
          '50%': { backgroundColor: '#7f1d1d' },
          '100%': { backgroundColor: '#dc2626' },
        },
        lastMinute: {
          '0%': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          '50%': { backgroundColor: '#dc2626' },
          '100%': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        },
        extraTimeFlash: {
          '0%': { backgroundColor: '#000000' },
          '5%': { backgroundColor: '#ff0000' },
          '10%': { backgroundColor: '#000000' },
          '100%': { backgroundColor: '#000000' },
        },
      },
      animation: {
        marquee: 'marquee 10s linear infinite',
        flash: 'flash 0.5s ease-in-out 5',
        attention: 'attention 0.4s ease-in-out 5',
        timerComplete: 'timerComplete 0.5s ease-in-out 5',
        slideIn: 'slideIn 0.3s ease-out',
        slideInFromBottom: 'slideInFromBottom 0.5s ease-out',
        slideOutToBottom: 'slideOutToBottom 0.5s ease-in',
        scaleIn: 'scaleIn 0.4s ease-out',
        scaleOut: 'scaleOut 0.4s ease-in',
        pulse: 'pulse 2s ease-in-out infinite',
        extraTimeBg: 'extraTimeBg 1s ease-in-out infinite',
        lastMinute: 'lastMinute 1s ease-in-out infinite',
        extraTimeFlash: 'extraTimeFlash 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};