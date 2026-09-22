import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070c11",
        panel: "#0d151c",
        panel2: "#131e28",
        line: "#1f2d39",
        fg: "#e8f0f5",
        muted: "#9aaebb",
        accent: "#2de2c1",
        accent2: "#38bdf8",
        violet: "#a78bfa",
        danger: "#fb7185",
        warn: "#fbbf24",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.8)",
        glow: "0 8px 30px -8px rgba(45,226,193,0.45)",
        "glow-lg": "0 0 0 1px rgba(45,226,193,0.35), 0 20px 60px -20px rgba(45,226,193,0.5)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
