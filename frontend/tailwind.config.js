module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        beth: {
          'pink': '#F4A6C0',
          'pink-light': '#FFE4ED',
          'lavender': '#C8B5E8',
          'lavender-light': '#EBE0F7',
          'sky': '#A8DADC',
          'sky-light': '#E5F5F6',
          'purple': '#6B4E9E',
          'purple-soft': '#9F86C0',
          'ink': '#2D2A3E',
        },
        m3: {
          'primary': '#864d61',
          'on-primary': '#ffffff',
          'primary-container': '#ffb7ce',
          'on-primary-container': '#3a0721',
          'secondary': '#74565f',
          'secondary-fixed': '#a6f2cf',
          'on-secondary-fixed': '#0b3622',
          'tertiary': '#6f5092',
          'on-tertiary': '#ffffff',
          'tertiary-container': '#e9deff',
          'on-tertiary-container': '#28104b',
          'background': '#f7f9fb',
          'surface': '#fef7ff',
          'on-surface': '#1f1a1c',
          'surface-variant': '#f1dee4',
          'outline': '#82747a',
        },
      },
      fontFamily: {
        display: ['Quicksand', 'system-ui', 'sans-serif'],
        sans: ['Quicksand', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring-fast': 'pulseRing 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'wiggle': 'wiggle 1.2s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      boxShadow: {
        'squishy': '0 6px 0 rgba(58, 7, 33, 0.10), 0 14px 30px rgba(134, 77, 97, 0.20)',
        'squishy-active': '0 2px 0 rgba(58, 7, 33, 0.10), 0 6px 14px rgba(134, 77, 97, 0.20)',
        'squishy-soft': '0 4px 0 rgba(40, 16, 75, 0.08), 0 10px 20px rgba(111, 80, 146, 0.18)',
      },
      backgroundImage: {
        'magic-grad': 'linear-gradient(135deg, #ffe4ed 0%, #ebe0f7 50%, #e5f5f6 100%)',
        'magic-grad-warm': 'linear-gradient(135deg, #ffb7ce 0%, #e9deff 100%)',
      },
    },
  },
  plugins: [],
};
