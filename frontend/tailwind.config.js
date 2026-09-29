/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B263B",
          50: "#EEF1F6",
          100: "#DCE2EC",
          200: "#B7C3D6",
          300: "#8FA0BD",
          400: "#5B72A0",
          500: "#415A77",
          600: "#2F4258",
          700: "#24334D",
          800: "#1B263B",
          900: "#111A2B",
          950: "#0B1220",
        },
        steel: {
          DEFAULT: "#415A77",
          light: "#778DA9",
        },
        amber: {
          DEFAULT: "#F4A300",
          light: "#FFC24D",
          dark: "#C97F00",
        },
        ice: "#E8ECF3",
      },
      fontFamily: {
        head: ["Cambria", "Georgia", "serif"],
        body: ["'Segoe UI'", "Calibri", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,38,59,0.06), 0 1px 3px rgba(27,38,59,0.08)",
        pop: "0 8px 24px rgba(27,38,59,0.12)",
      },
    },
  },
  plugins: [],
};
