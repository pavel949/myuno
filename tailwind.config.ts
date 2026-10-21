import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Canonical Tailwind config — aligned with docs/canonical/05-visual-design-system.md
 *
 * Fonts: language-scoped via CSS variables (see src/styles/tokens.css).
 *   `font-display` → Unbounded (RU) / Noto Serif (EN)
 *   `font-sans`    → Golos Text (RU) / Noto Sans (EN)
 *   `font-mono`    → JetBrains Mono everywhere
 *
 * Colours: navy + orange + cream + stone scale + 16 catalogue categories.
 * NO mint, NO glassmorphism shortcuts, NO arbitrary cluster pastels.
 *
 * Radii: 0 by default. `rounded-sm` = 2px (chips). `rounded-full` = avatars.
 * Anything between 2px and 9999px is forbidden by canon §5.
 */
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
        // Driven by --font-body / --font-display, which switch by html[lang].
        sans:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        // Legacy `font-serif` kept as alias for canonical heading font.
        serif:   ['var(--font-display)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // Canon §3.3 — single typographic scale. Use these tokens, not arbitrary values.
        'display':  ['3rem',     { lineHeight: '1.1',  letterSpacing: '-0.01em', fontWeight: '400' }],
        'h1':       ['2.25rem',  { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '400' }],
        'h2':       ['1.75rem',  { lineHeight: '1.25', fontWeight: '400' }],
        'h3':       ['1.375rem', { lineHeight: '1.3',  fontWeight: '500' }],
        'h4':       ['1.125rem', { lineHeight: '1.4',  fontWeight: '500' }],
        'body-lg':  ['1.0625rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'body':     ['0.9375rem',{ lineHeight: '1.7',  fontWeight: '400' }],
        'body-sm':  ['0.8125rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'caption':  ['0.6875rem',{ lineHeight: '1.5',  fontWeight: '500' }],
        'label':    ['0.625rem', { lineHeight: '1.4',  letterSpacing: '0.25em', fontWeight: '600', textTransform: 'uppercase' as const }],
        'mono':     ['0.75rem',  { lineHeight: '1.5',  fontWeight: '500' }],
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
          hover: "hsl(var(--primary-hover))",
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

        // Canonical brand palette — use these explicitly when seeding visuals.
        navy: {
          DEFAULT: "hsl(var(--brand-navy))",
          900: "hsl(var(--brand-navy-900))",
          800: "hsl(var(--brand-navy-800))",
          700: "hsl(var(--brand-navy-700))",
          500: "hsl(var(--brand-navy-500))",
          100: "hsl(var(--brand-navy-100))",
          50:  "hsl(var(--brand-navy-50))",
        },
        orange: {
          DEFAULT: "hsl(var(--brand-orange))",
          700: "hsl(var(--brand-orange-700))",
          600: "hsl(var(--brand-orange-600))",
          400: "hsl(var(--brand-orange-400))",
          100: "hsl(var(--brand-orange-100))",
        },
        cream: "hsl(var(--brand-cream))",
        ink: "hsl(var(--ink))",
        "text-body":   "hsl(var(--text-body))",
        "text-muted":  "hsl(var(--text-muted))",
        "text-subtle": "hsl(var(--text-subtle))",
        "surface-raised": "hsl(var(--surface-raised))",
        "surface-white":  "hsl(var(--surface-white))",

        // Status (semantic). Backgrounds use the *-bg tokens.
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          bg: "hsl(var(--success-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          bg: "hsl(var(--warning-bg))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--destructive-foreground))",
          bg: "hsl(var(--danger-bg))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          bg: "hsl(var(--info-bg))",
        },

        // 16 catalogue category colours — canon §2.6, never recolour.
        cat: {
          emergency:      "hsl(var(--cat-emergency))",
          home:           "hsl(var(--cat-home))",
          food:           "hsl(var(--cat-food))",
          health:         "hsl(var(--cat-health))",
          family:         "hsl(var(--cat-family))",
          transport:      "hsl(var(--cat-transport))",
          "business-legal": "hsl(var(--cat-business-legal))",
          finance:        "hsl(var(--cat-finance))",
          tourism:        "hsl(var(--cat-tourism))",
          "real-estate":  "hsl(var(--cat-real-estate))",
          pet:            "hsl(var(--cat-pet))",
          wedding:        "hsl(var(--cat-wedding))",
          halal:          "hsl(var(--cat-halal))",
          sports:         "hsl(var(--cat-sports))",
          community:      "hsl(var(--cat-community))",
          partner:        "hsl(var(--cat-partner))",
        },

        // ─── Backward-compat aliases ──────────────────────────────────────
        // The following classes are still referenced across ~1000 components.
        // They now map onto canon equivalents so the legacy markup keeps
        // rendering during Phase 2/3 refactors. After Phase 3 these aliases
        // will be removed and replaced with canonical class names.
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light:   "hsl(var(--gold-light))",
          dark:    "hsl(var(--gold-dark))",
        },
        coral:    { DEFAULT: "hsl(var(--accent-coral))" },
        teal:     { DEFAULT: "hsl(var(--accent-teal))" },
        "accent-purple":   { DEFAULT: "hsl(var(--accent-purple))" },
        "accent-cyan":     { DEFAULT: "hsl(var(--accent-cyan))" },
        "accent-amber":    { DEFAULT: "hsl(var(--accent-amber))",
                             foreground: "hsl(var(--accent-amber-foreground))" },
        "accent-emerald":  { DEFAULT: "hsl(var(--accent-emerald))" },
        "accent-rose":     { DEFAULT: "hsl(var(--accent-rose))" },
        "accent-sky":      { DEFAULT: "hsl(var(--accent-sky))" },
        "accent-orange":   { DEFAULT: "hsl(var(--accent-orange))" },
        "accent-pink":     { DEFAULT: "hsl(var(--accent-pink))" },
        "accent-violet":   { DEFAULT: "hsl(var(--accent-violet))" },
        "accent-indigo":   { DEFAULT: "hsl(var(--accent-indigo))" },
        "accent-lime":     { DEFAULT: "hsl(var(--accent-lime))" },
        "accent-fuchsia":  { DEFAULT: "hsl(var(--accent-fuchsia))" },
        "icon-dark":       { DEFAULT: "hsl(var(--icon-dark))" },
        cluster: {
          arrive: "hsl(var(--cluster-arrive))",
          live:   "hsl(var(--cluster-live))",
          legal:  "hsl(var(--cluster-legal))",
          invest: "hsl(var(--cluster-invest))",
          manage: "hsl(var(--cluster-manage))",
          build:  "hsl(var(--cluster-build))",
          enjoy:  "hsl(var(--cluster-enjoy))",
          family: "hsl(var(--cluster-family))",
        },
        // Persona hues (DS 2.1 canon §6.3). Mirrors the cluster pattern so
        // `bg-persona-tourist`, `text-persona-investor/30` etc. all purge
        // correctly. Token source: `--persona-*` in `src/styles/tokens.css`.
        persona: {
          tourist:                  "hsl(var(--persona-tourist))",
          resident:                 "hsl(var(--persona-resident))",
          "property-owner":         "hsl(var(--persona-property-owner))",
          investor:                 "hsl(var(--persona-investor))",
          "real-estate-developer":  "hsl(var(--persona-real-estate-developer))",
          "local-services-provider":"hsl(var(--persona-local-services-provider))",
          family:                   "hsl(var(--persona-family))",
          couple:                   "hsl(var(--persona-couple))",
          nightlife:                "hsl(var(--persona-nightlife))",
          active:                   "hsl(var(--persona-active))",
          business:                 "hsl(var(--persona-business))",
          nomad:                    "hsl(var(--persona-nomad))",
          "pet-owner":              "hsl(var(--persona-pet-owner))",
          relocation:               "hsl(var(--persona-relocation))",
        },
      },
      borderRadius: {
        // Canon §5 — almost no rounding. 0 is the default.
        // The `lg/md/sm` aliases used to be 8/4/2; they are now collapsed to 0
        // (sm stays at 2px for chips). Phase 4 will remove `rounded-lg` callers.
        none: "0",
        sm:   "var(--radius-sm)",   /* 2px */
        md:   "0",
        lg:   "0",
        xl:   "0",
        "2xl": "0",
        "3xl": "0",
        full: "var(--radius-full)",
      },
      boxShadow: {
        // Canon §6 — borders separate blocks, shadows are restrained.
        none: "none",
        xs:   "var(--shadow-xs)",
        sm:   "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md:   "var(--shadow-md)",
        lg:   "var(--shadow-md)",   /* canon forbids `shadow-lg` — collapse to md */
        xl:   "var(--shadow-md)",
        "2xl": "var(--shadow-md)",
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
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.3)" },
        },
        "timeline-highlight": {
          "0%":   { backgroundColor: "hsl(var(--primary) / 0.18)", boxShadow: "0 0 0 0 hsl(var(--primary) / 0.35)" },
          "50%":  { backgroundColor: "hsl(var(--primary) / 0.10)", boxShadow: "0 0 0 6px hsl(var(--primary) / 0)" },
          "100%": { backgroundColor: "hsl(var(--primary) / 0)",    boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
        },
        "timeline-dot-pop": {
          "0%":   { transform: "scale(0.6)", opacity: "0.4" },
          "60%":  { transform: "scale(1.15)", opacity: "1" },
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
        // `pulse-green` is renamed to `pulse-soft` (no green by canon) but kept as alias.
        "pulse-soft":  "pulse-soft 2s ease-in-out infinite",
        "pulse-green": "pulse-soft 2s ease-in-out infinite",
        "timeline-highlight": "timeline-highlight 2.4s ease-out both",
        "timeline-dot-pop":   "timeline-dot-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
