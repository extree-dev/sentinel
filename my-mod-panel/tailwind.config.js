module.exports = {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          DEFAULT: '#5865F2',
          dark: '#4752C4',
        },
      },
    },
  },
  plugins: [],
};