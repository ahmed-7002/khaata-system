/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Optional: Adding custom greens to match your HCI design
        'khaata-green': '#059669', 
        'mint-white': '#f0fdf4',
      }
    },
  },
  plugins: [],
}