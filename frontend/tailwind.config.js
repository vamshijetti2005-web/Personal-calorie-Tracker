/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1F16",
        cream: "#F6F1E8",
        paper: "#FFFCF7",
        forest: {
          DEFAULT: "#2D5A3D",
          dark: "#1B3A28",
          light: "#4A7C59",
        },
        clay: "#C4622D",
        gold: "#C9A227",
        sage: "#8FAF88",
        mist: "#E5DCC8",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 40px -18px rgba(26, 31, 22, 0.25)",
      },
    },
  },
  plugins: [],
};
