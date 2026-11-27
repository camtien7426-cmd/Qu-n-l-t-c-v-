/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      // Đổi bảng màu thương hiệu ở đây
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dfe9ff",
          200: "#c0d3ff",
          300: "#93b2ff",
          400: "#5f87fb",
          500: "#3b64f2",
          600: "#2a49e0",
          700: "#2339b8",
          800: "#223390",
          900: "#212f73",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.10)",
        glow: "0 10px 30px -10px rgba(42, 73, 224, 0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
