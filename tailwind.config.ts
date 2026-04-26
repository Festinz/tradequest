import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
        },
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        text: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
        },
        border: "var(--border)",
        bullish: "#EF4444",
        bearish: "#3B82F6",
        neutral: "#64748B",
        exp: "#FBBF24",
        streak: "#F97316",
        heart: "#EC4899",
        energy: "#06B6D4",
        tier: {
          common: "#94A3B8",
          rare: "#3B82F6",
          epic: "#A855F7",
          legendary: "#F59E0B",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        display: [
          "32px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h1: [
          "24px",
          { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h2: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        h3: ["16px", { lineHeight: "1.5", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.6" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        chip: "999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
        elevated: "0 4px 12px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
