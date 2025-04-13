module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',  // Add your paths here
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {}, // No custom extensions, use default
  },
  plugins: [require('@tailwindcss/typography')],
};