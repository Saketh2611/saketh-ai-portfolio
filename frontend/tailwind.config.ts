import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0E14", // page background — blue-tinted black, not void-black
          surface: "#12151D", // card/panel background
          raised: "#1A1E29", // hover/active surface
          border: "#242938", // hairline borders
        },
        paper: {
          DEFAULT: "#E8EAED", // primary text — soft off-white, not pure #FFF
          muted: "#8B92A3", // secondary text — muted slate-blue
          faint: "#565D70", // tertiary text — timestamps, placeholders
        },
        signal: {
          gold: "#F2B84B", // primary accent — CTAs, active states, the query cursor
          "gold-dim": "#8A6A2C",
          teal: "#5EEAD4", // secondary accent — citations, retrieval/source tags
          "teal-dim": "#2C6B62",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.35s ease-out forwards",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
