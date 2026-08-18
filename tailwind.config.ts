import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1e1e1e",
        // maroon CTA-button gradient, sampled from the Figma file
        maroon: {
          from: "#8a2532",
          to: "#5a1620",
        },
        // translucent gold-ish border used on every card/button/pill in the design
        chrome: "#c99a3b",
        // the small "LIVE" indicator dot
        live: "#ff3b30",
      },
      fontFamily: {
        display: ["var(--font-anton-sc)", "sans-serif"],
        body: ["var(--font-poppins)", "sans-serif"],
      },
      borderRadius: {
        pill: "22px",
      },
    },
  },
  plugins: [],
};
export default config;
