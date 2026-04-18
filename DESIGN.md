# Design System — myUNO SuperApp

> DS 2.1 — formalized April 2026 by /design-consultation from `src/styles/tokens.css` (runtime source of truth).
> `src/design-system/tokens.json` (DS 2.0 "Navy Premium") is a superseded spec — do not use it to make decisions.

---

## Product Context

- **What this is:** AI-first superapp for expats on Phuket — real estate, legal, property management, lifestyle, investments under one account.
- **Who it's for:** Russian-speaking expats primarily; international expats broadly. Mobile-first, real-money transactions.
- **Space/industry:** Proptech + lifestyle superapp. No direct comparable — closest peers are property portals (Thailand Property, DDproperty) and super-apps (Grab).
- **Project type:** Mobile-first PWA + native (Capacitor). 40+ micro-app verticals inside one shell.
- **Languages:** Russian + English UI. Thai script on Phuket-specific content.

---

## Aesthetic Direction

- **Direction:** Dark-first fintech/superapp with a luxury mode for RE verticals
- **Decoration level:** Intentional — subtle glow accents on hover, glassmorphism borders at low opacity, no heavy gradients
- **Mood:** Premium but not intimidating. A Russian expat managing ฿10M in property should feel like they're in a trusted control center, not a startup toy. Dark = authority. Mint = action. Blue = trust.
- **Light mode role:** Available via `html.light`. Used for contexts where users prefer a paper-like reading mode — document views, legal contracts, owner portal print views.

**SAFE choices (category conventions this product keeps):**
- Dark fintech aesthetic for financial/dashboard surfaces — users moving real money expect seriousness
- Monospace font for all numerical values — industry standard for financial legibility
- Card-based layout for listings — every property portal does this; deviation creates friction
- Prominent CTA buttons in brand color — no creative risk here

**RISKS (where myUNO gets its own face):**
- **Golos Text for headings**: Every Thai property portal uses Inter or Roboto. Golos Text is the Russian government's official typeface — it signals "built specifically for you" to Russian-speaking users without a word of copy. The Cyrillic glyphs are exceptional.
- **Cluster color system**: 6 distinct accent colors mapped to verticals. Most competitors have one brand color. This lets users build a spatial memory of the app — legal always feels amber, investments always feel purple. Risk: requires discipline to not contaminate clusters.
- **Warm mint (#00D68F) as primary on dark**: Southeast Asian lifestyle apps trend toward coral/orange. The cool mint reads as tech-forward and distinct.

---

## Typography

- **Display/Hero:** **Golos Text** (wt 400–900) — rationale: designed for government/official Russian digital products, outstanding Cyrillic, geometric with warmth. Distinctive vs category.
- **Body:** **DM Sans** (optical sizing 9..40, wt 400–700) — rationale: flexible optical sizing means it reads well at caption size (0.625rem) and large body (1rem) without switching faces.
- **Prices/Data:** **JetBrains Mono** (wt 400–500) — always use `font-feature-settings: "tnum"` (tabular numerals) for all financial data, property metrics, coordinates.
- **Luxury RE vertical:** **Playfair Display** (wt 400–700, italic) — use only for developer/offplan names and luxury property headlines. Never for UI chrome.
- **Thai text:** **Sarabun** (wt 400–600) — loaded as fallback for Thai-script content in Phuket-specific components.

**Loading:** Google Fonts via `index.html` (preconnect + print-then-all async pattern). CSP allows `fonts.googleapis.com` and `fonts.gstatic.com`.

**Type scale (from `tokens.json`, applied via Tailwind `font-*` utilities):**

| Token | Size | Weight | Tracking | Font |
|---|---|---|---|---|
| display-lg | 2.5rem | 800 | −0.025em | Golos Text |
| display-md | 2rem | 700 | −0.025em | Golos Text |
| heading-lg | 1.5rem | 600 | −0.02em | Golos Text |
| heading-md | 1.25rem | 600 | −0.015em | Golos Text |
| heading-sm | 1.125rem | 600 | −0.01em | Golos Text |
| body-lg | 1rem | 400 | +0.005em | DM Sans |
| body-md | 0.875rem | 400 | +0.005em | DM Sans |
| body-sm | 0.8125rem | 400 | +0.01em | DM Sans |
| caption | 0.75rem | 500 | +0.01em | DM Sans |
| overline | 0.625rem | 600 | +0.08em | DM Sans |

**Tailwind classes:** `font-display` = Golos Text, `font-sans` = DM Sans, `font-mono` = JetBrains Mono, `font-serif` = Playfair Display.

---

## Color

### Dark Theme (default — `:root`)

| Token | HSL | Hex approx | Usage |
|---|---|---|---|
| `--background` | 216 60% 7% | `#08101E` | Page background |
| `--secondary` / surface | 214 47% 12% | `#0F1C2E` | Panel / nav background |
| `--card` | 213 38% 15% | `#162236` | Cards, modals |
| `--card-elevated` | 213 38% 19% | `#1E2D45` | Elevated cards |
| `--primary` | 157 100% 42% | `#00D68F` | CTAs, links, active states |
| `--accent` | 224 100% 65% | `#4E7BFF` | Secondary actions, info |
| `--gold` | 38 92% 50% | `#F59E0B` | Legal cluster, premium badges |
| `--foreground` | 222 73% 96% | `#EDF2FF` | Primary text |
| `--muted-foreground` | 211 17% 64% | `#8FA3B8` | Secondary text, placeholders |
| `--border` | 0 0% 100% / 0.07 | rgba white 7% | Default dividers |
| `--border-strong` | 0 0% 100% / 0.14 | rgba white 14% | Emphasized borders |
| `--success` | 152 58% 42% | `#2D9966` | Distinct from primary (different hue) |
| `--warning` | 38 92% 50% | `#F59E0B` | Caution states |
| `--destructive` | 0 72% 51% | `#D93535` | Destructive actions |

### Light Theme (`html.light`)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#fafaf9` | Warm white page bg |
| `--card` | `#ffffff` | White cards |
| `--primary` | `#0d6e4f` | Emerald CTA |
| `--accent` | navy `224 55% 32%` | ~`#1e3a8a` |
| `--foreground` | `#1a1a19` | Near-black text |
| `--muted-foreground` | `#57534e` | Warm gray secondary |
| `--border` | `#e5e5e4` | Warm gray dividers |
| `--success` | `#16a34a` | Distinct green |
| `--warning` | `#d97706` | Amber |
| `--destructive` | `#dc2626` | Red |

### Cluster Accent System

Each vertical has an immutable accent color. Never reassign cluster colors to new verticals.

| Cluster | Token | Hex | Vertical |
|---|---|---|---|
| arrive | `--cluster-arrive` | `#00D68F` (=primary dark) | Relocation, arrival |
| live | `--cluster-live` | `#4E7BFF` (=accent dark) | Lifestyle, services |
| legal | `--cluster-legal` | `#F59E0B` | Legal, visas, contracts |
| invest | `--cluster-invest` | `#A78BFA` | Property investment |
| manage | `--cluster-manage` | `#16BDCA` | Property management (STAYS) |
| build | `--cluster-build` | `#EF4444` | Developer/offplan (DEALS) |

### Dark mode strategy

Dark is the default. Light mode is activated by adding the `light` class to `<html>`. Dark mode reduces saturation 10–20% on accent colors for vibrancy control. See `tokens.css` for full mapping.

---

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable (not compact — real-money UX needs breathing room)
- **Scale:** `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` px
- **Card padding:** `--card-padding: 1rem` (16px) standard; `--card-padding-compact: 0.75rem` for tight lists
- **Card gap:** `--card-gap: 0.75rem`

---

## Layout

- **Approach:** App-grid for dashboards; editorial moments for hero/marketing sections within the app
- **Mobile-first breakpoints:**

| Name | Width |
|---|---|
| xs | 400px |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1400px |

- **Max content width:** 1400px (`container` with `2rem` padding)
- **Mobile behavior:** Sheets (bottom drawers via shadcn Sheet), never Dialogs for primary actions on mobile. Min touch target: 44px.

### Border Radius

App-like, very rounded — reinforces the "this is native-feeling" quality.

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` / `rounded-sm` | 10px | Buttons, badges, inputs, tags |
| `--radius-md` / `rounded-md` | 16px | Cards, panels, modals |
| `--radius-lg` / `rounded-lg` | 24px | Full-bleed sections, bottom sheets |
| `--radius-full` | 9999px | Pills, avatars, toggles |

---

## Motion

- **Approach:** Intentional — entrance animations for meaningful state transitions, no gratuitous decoration
- **Easing:**
  - Standard: `cubic-bezier(0.4, 0, 0.2, 1)` (material standard)
  - Enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out — fast start)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in — fast end)
  - Spring: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — for confirmations, success states
- **Duration scale:**
  - instant: 50ms (micro feedback)
  - fast: 100ms (hover states)
  - normal: 150ms (button presses, tab switches)
  - slow: 250ms (panel transitions)
  - entrance: 300ms (page-level fade-in-up)
- **Keyframes defined:** `fade-in`, `fade-in-up`, `accordion-down/up` (see `tailwind.config.ts`)

---

## Elevation Shadows

Dark theme uses RGBA black for depth; light theme uses brand-tinted shadows.

| Level | Dark | Usage |
|---|---|---|
| 0 | none | Flat inline elements |
| 1 | `0 1px 3px rgba(0,0,0,0.3)` | Resting cards |
| 2 | `0 4px 24px rgba(0,0,0,0.3)` | Raised cards (`--shadow-card`) |
| 3 | `0 8px 32px rgba(0,0,0,0.4) + glow 8%` | Active hover |
| 4 | `0 12px 40px rgba(0,0,0,0.5) + glow 10%` | Modals, drawers |
| 5 | `0 20px 48px rgba(0,0,0,0.6) + glow 12%` | Floating elements |

Glow color is `rgba(0,214,143,0.*)` — primary mint. This ties elevation to brand.

---

## Design Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-18 | Golos Text confirmed as canonical display font | Practical choice for Cyrillic audience; already in `tailwind.config.ts` build system; `tokens.json` spec with Syne is superseded |
| 2026-04-18 | `#00D68F` mint confirmed as dark-mode primary | `tokens.css` runtime is source of truth over `CLAUDE.md` `#0d6e4f` — the emerald moves to light-mode primary |
| 2026-04-18 | Dual-theme documented: dark-first (`#08101E`), light via `html.light` | App has both; dark is default |
| 2026-04-18 | `tokens.json` DS2.0 marked deprecated | Navy Premium spec was never fully implemented; `tokens.css` is the ground truth |
| 2026-04-18 | Cluster accent system locked (6 colors, immutable mapping) | Spatial memory for users navigating 40+ micro-apps |
