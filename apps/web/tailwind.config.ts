import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        input: "var(--border-strong)",
        ring: "var(--focus)",
        background: "var(--bg)",
        foreground: "var(--ink)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-sunken": "var(--surface-sunken)",
        "surface-inverse": "var(--surface-inverse)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-on-inverse": "var(--ink-on-inverse)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
        },
        "on-primary": "var(--on-primary)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        "on-accent": "var(--on-accent)",
        status: {
          ok: "var(--status-ok)",
          "ok-soft": "var(--status-ok-soft)",
          warn: "var(--status-warn)",
          "warn-soft": "var(--status-warn-soft)",
          danger: "var(--status-danger)",
          "danger-soft": "var(--status-danger-soft)",
          offline: "var(--status-offline)",
          "offline-soft": "var(--status-offline-soft)",
          info: "var(--status-info)",
          "info-soft": "var(--status-info-soft)",
        },
        danger: {
          DEFAULT: "var(--danger-solid)",
          soft: "var(--status-danger-soft)",
        },
        "on-danger": "var(--on-danger)",
        focus: "var(--focus)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        overlay: "var(--shadow-overlay)",
      },
    },
  },
  plugins: [],
};

export default config;