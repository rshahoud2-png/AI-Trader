import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        panel: "#0d1828",
        panel2: "#132236",
        line: "#22364f",
        mint: "#36d399",
        amber: "#f6c453",
        danger: "#ff6b6b",
        cyan: "#47d7ff"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(71, 215, 255, 0.16), 0 22px 70px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
