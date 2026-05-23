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
      },
      fontFamily: {
        display: ['"Nanum Pen Script"', 'cursive', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
