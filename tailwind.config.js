/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'soft-blue': '#0066CC', // Pantone 290 C
        'cloud-cream': '#F5F1E8', // Pantone 12-0804 TPX
        'sage-green': '#4A5D23', // Pantone 4180 CP
        'pure-black': '#000000', // Black 6 C
      },
    },
  },
  plugins: [],
};
