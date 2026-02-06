import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0EDFF",
          100: "#E0DAFF",
          200: "#C2B5FF",
          300: "#A390FF",
          400: "#856BFF",
          500: "#6C5CE7",
          600: "#5A4BD4",
          700: "#4839B0",
          800: "#36278D",
          900: "#241569",
        },
        surface: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
        },
        midnight: {
          700: "#2D3436",
          800: "#1E272E",
          900: "#0F1419",
        },
        status: {
          lead: "#FFB84D",
          negotiating: "#6C5CE7",
          signed: "#00B894",
          delivered: "#0984E3",
          paid: "#00CEC9",
        },
      },
      fontFamily: {
        display: ['"DM Sans"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 25px rgba(108,92,231,0.08), 0 4px 10px rgba(0,0,0,0.04)",
        glow: "0 0 20px rgba(108,92,231,0.15)",
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
