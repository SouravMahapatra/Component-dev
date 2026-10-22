/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6fce9",
          100: "#ecf8d2",
          200: "#d9f0a6",
          300: "#c4e97c",
          400: "#b2e35b", // the button green
          500: "#9bd23f",
          600: "#7cb32a",
          700: "#5c8a1f",
          800: "#3f611a",
          900: "#1f3a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
