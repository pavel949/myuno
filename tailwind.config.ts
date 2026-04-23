import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1400px',
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Sarabun', 'sans-serif'],
        display: ['Golos Text', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "hsl(var(--card-elevated))",
          hover: "hsl(var(--card-hover))",
        },
        "border-strong": "hsl(var(--border-strong))",
        "border-subtle": "hsl(var(--border-subtle))",
        "primary-hover": "hsl(var(--primary-hover))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        coral: {
          DEFAULT: "hsl(var(--accent-coral))",
        },
        teal: {
          DEFAULT: "hsl(var(--accent-teal))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--primary-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--primary-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(0 0% 100%)",
        },
        "accent-purple": {
          DEFAULT: "hsl(var(--accent-purple))",
        },
        "accent-cyan": {
          DEFAULT: "hsl(var(--accent-cyan))",
        },
        "accent-amber": {
          DEFAULT: "hsl(var(--accent-amber))",
          foreground: "hsl(var(--accent-amber-foreground))",
        },
        "accent-emerald": { DEFAULT: "hsl(var(--accent-emerald))" },
        "accent-rose": { DEFAULT: "hsl(var(--accent-rose))" },
        "accent-sky": { DEFAULT: "hsl(var(--accent-sky))" },
        "accent-orange": { DEFAULT: "hsl(var(--accent-orange))" },
        "accent-pink": { DEFAULT: "hsl(var(--accent-pink))" },
        "accent-violet": { DEFAULT: "hsl(var(--accent-violet))" },
        "accent-indigo": { DEFAULT: "hsl(var(--accent-indigo))" },
        "accent-lime": { DEFAULT: "hsl(var(--accent-lime))" },
        "accent-fuchsia": { DEFAULT: "hsl(var(--accent-fuchsia))" },
        "icon-dark": {
          DEFAULT: "hsl(var(--icon-dark))",
        },
        cluster: {
          arrive: "hsl(var(--cluster-arrive))",
          live: "hsl(var(--cluster-live))",
          legal: "hsl(var(--cluster-legal))",
          invest: "hsl(var(--cluster-invest))",
          manage: "hsl(var(--cluster-manage))",
          build: "hsl(var(--cluster-build))",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        enter: "cubic-bezier(0, 0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "pulse-green": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.3)" },
        },
        "timeline-highlight": {
          "0%": {
            backgroundColor: "hsl(var(--primary) / 0.18)",
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.35)",
          },
          "50%": {
            backgroundColor: "hsl(var(--primary) / 0.10)",
            boxShadow: "0 0 0 6px hsl(var(--primary) / 0)",
          },
          "100%": {
            backgroundColor: "hsl(var(--primary) / 0)",
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0)",
          },
        },
        "timeline-dot-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0.4" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "shimmer": "shimmer 2s infinite linear",
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "timeline-highlight": "timeline-highlight 2.4s ease-out both",
        "timeline-dot-pop": "timeline-dot-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
