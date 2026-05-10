/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ═══ BRAND COLORS (from HAN SPORTS logo gradient) ═══
        "brand-green":       "#16a34a",   // Logo green start
        "brand-green-dark":  "#15803d",   // Hover green
        "brand-green-light": "#dcfce7",   // Light green bg
        "brand-blue":        "#1d4ed8",   // Logo blue end
        "brand-blue-dark":   "#1e40af",   // Hover blue
        "brand-blue-light":  "#dbeafe",   // Light blue bg
        "brand-teal":        "#0d9488",   // Mid gradient / teal accent
        "brand-teal-light":  "#ccfbf1",   // Light teal bg

        // ═══ NEUTRAL / SURFACE ═══
        "surface":           "#ffffff",
        "surface-soft":      "#f8fafc",
        "surface-muted":     "#f1f5f9",
        "surface-border":    "#e2e8f0",
        "surface-hover":     "#f0fdf4",

        // ═══ TEXT ═══
        "text-primary":      "#0f172a",
        "text-secondary":    "#475569",
        "text-muted":        "#94a3b8",
        "text-inverse":      "#ffffff",

        // ═══ SEMANTIC ═══
        "success":           "#16a34a",
        "warning":           "#d97706",
        "danger":            "#dc2626",
        "info":              "#0891b2",

        // ═══ ADMIN SIDEBAR ═══
        "admin-bg":          "#0f1e3d",   // Deep navy for sidebar
        "admin-bg-light":    "#162550",
        "admin-active":      "#1d4ed8",
      },
      backgroundImage: {
        // Gradient chính — dùng ở buttons, hero, badges
        "brand-gradient":    "linear-gradient(135deg, #16a34a 0%, #0d9488 50%, #1d4ed8 100%)",
        "brand-gradient-r":  "linear-gradient(to right, #16a34a, #1d4ed8)",
        "brand-gradient-hero": "linear-gradient(135deg, #0f1e3d 0%, #1d4ed8 50%, #0d9488 100%)",
        "footer-gradient":   "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "hero":    ["3.5rem", { lineHeight: "1.1", fontWeight: "800", letterSpacing: "-0.02em" }],
        "display": ["2.5rem", { lineHeight: "1.15", fontWeight: "700" }],
        "heading": ["1.875rem", { lineHeight: "1.2",  fontWeight: "700" }],
        "title":   ["1.5rem",   { lineHeight: "1.3",  fontWeight: "600" }],
        "large":   ["1.125rem", { lineHeight: "1.6",  fontWeight: "400" }],
        "base":    ["1rem",     { lineHeight: "1.5",  fontWeight: "400" }],
        "small":   ["0.875rem", { lineHeight: "1.4",  fontWeight: "500" }],
        "xs":      ["0.75rem",  { lineHeight: "1.4",  fontWeight: "500" }],
      },
      boxShadow: {
        "card":        "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover":  "0 10px 30px -5px rgb(29 78 216 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        "green-glow":  "0 4px 20px rgb(22 163 74 / 0.25)",
        "blue-glow":   "0 4px 20px rgb(29 78 216 / 0.25)",
        "brand-glow":  "0 8px 30px rgb(13 148 136 / 0.3)",
        "navbar":      "0 1px 0 0 #e2e8f0",
        "modal":       "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      borderRadius: {
        "sm":   "0.375rem",
        "md":   "0.5rem",
        "lg":   "0.75rem",
        "xl":   "1rem",
        "2xl":  "1.25rem",
        "pill": "9999px",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-up":       "fadeUp 0.4s ease forwards",
        "fade-in":       "fadeIn 0.3s ease forwards",
        "slide-in":      "slideIn 0.3s ease forwards",
        "shimmer":       "shimmer 1.5s infinite",
        "pulse-green":   "pulseGreen 2s ease-in-out infinite",
        "float":         "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(22 163 74 / 0.4)" },
          "50%":      { boxShadow: "0 0 0 8px rgb(22 163 74 / 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "container": "1280px",
      },
    },
  },
  plugins: [],
};
