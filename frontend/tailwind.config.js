/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      backgroundColor: {
        // Override Tailwind's default white to use your CSS variable in dark mode
        white: "var(--background-color)",
      },
      textColor: {
        // Override Tailwind's default text colors
        black: "var(--text-color)",
      },
      // Rest of your extensions
    },
  },
  plugins: [],
};