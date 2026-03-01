/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ajoutez vos couleurs de mariage ici
        primary: '#FF69B4',
        secondary: '#FFD700',
      }
    },
  },
  plugins: [],
}
