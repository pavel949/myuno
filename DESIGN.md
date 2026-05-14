# Design System — myUNO SuperApp

> DS 2.1 — re-synced 2026-05-14 against `src/styles/tokens.css` + `tailwind.config.ts` (runtime SoT).
> Prior versions (mint+emerald palette, 6-color cluster rainbow, Golos Text + DM Sans + JetBrains Mono fonts, dark-default) describe a superseded system. The current system is civic-infrastructure: light-default, navy primary, muted cluster tones.
> `src/design-system/tokens.json` (DS 2.0 "Navy Premium") is deprecated — do not use.

---

## Product Context

- **What this is:** AI-first superapp for expats on Phuket — real estate, legal, property management, lifestyle, investments under one account.
- **Who it's for:** Russian-speaking expats primarily; international expats broadly. Mobile-first, real-money transactions.
- **Space/industry:** Proptech + lifestyle superapp. Peers: property portals (Thailand Property, DDproperty), super-apps (Grab).
- **Project type:** Mobile-first PWA + native (Capacitor). 40+ micro-app verticals inside one shell.
- **Languages:** Russian + English UI. Thai script on Phuket-specific content.

---

## Aesthetic Direction

- **Direction:** State-grade civic infrastructure — calm, authoritative, light-first. Reference points (per `tokens.css` header): GOV.UK, e-Estonia, The Economist, Apple support docs.
- **Decoration level:** Minimal. No glow, no glassmorphism, no decorative gradients. Sharp corners (`--radius: 0`) are intentional — they read as registry/document, not consumer app.
- **Mood:** A Russian expat moving ฿10M in property should feel like they're in a trusted civic registry, not a startup pitch. Navy = authority. Orange = singular accent for action. Cream = the page itself.
- **Default theme:** Light (`:root`). Dark mode (`.dark` class) is admin/MC opt-in only — same restraint as light: no mint, no glassmorphism, no glow.

**SAFE choices (category conventions kept):**
- Cream-on-navy reading surface — financial/civic UX expects seriousness
- Monospace font for all numerical values — industry standard for financial legibility
- Card-based layout for listings — property portals all do this; deviation creates friction
- Prominent CTA buttons in brand color — no creative risk

**RISKS (where myUNO gets its own face):**
- **Sharp corners (0px radius default).** Every Southeast Asian lifestyle app trends bubbly (8–16px radius). Going hard-edged signals "registry/document, not toy" — and matches the GOV.UK/e-Estonia reference points.
- **Light-default, dark-as-admin.** Inverts the fintech category default. Bet: civic trust is more valuable to a Russian expat moving real money than the "trader at midnight" dark aesthetic.
- **One accent color (orange `#D96B1A`).** Most super-apps run a multi-color identity (Grab green, Gojek green). Single-accent restraint forces every CTA placement to earn its prominence.

---

## Typography

Fonts switch by `html[lang]` per `tokens.css` lines 378–388. The variables (`--font-display`, `--font-body`, `--font-mono`) are the SoT; Tailwind classes (`font-display`, `font-sans`, `font-mono`) consume them.

- **Display/Hero:** **Source Serif 4** (`html[lang="ru"]`: → Unbounded → Noto Serif → Georgia). Serif for civic gravity; Unbounded as Russian display fallback honors the Cyrillic audience without locking the doc to it.
- **Body / UI:** **Geist** (`html[lang="ru"]`: → Golos Text → Noto Sans → system-ui). Geist for English; Golos Text remains the Russian-government typeface fallback for outstanding Cyrillic.
- **Numerics / data / mono:** **IBM Plex Mono**. Always use `font-feature-settings: "tnum"` (tabular numerals) for all financial data, property metrics, coordinates.
- **Thai script:** No dedicated face yet — falls through to Noto Sans / Noto Serif via system font stack on Thai-content components.

**Loading:** Google Fonts via `index.html` (preconnect + print-then-all async). CSP allows `fonts.googleapis.com`, `fonts.gstatic.com`.

**Type scale** (canonical — `tailwind.config.ts` lines 47–60; use these tokens, not arbitrary `text-*` values):

| Token | Size | Weight | Line height | Notes |
|---|---|---|---|---|
| `text-display` | 3rem (48px) | 400 | 1.1 | Hero headlines |
| `text-h1` | 2.25rem (36px) | 400 | 1.2 | Page H1 |
| `text-h2` | 1.75rem (28px) | 400 | 1.25 | Section H2 |
| `text-h3` | 1.375rem (22px) | 500 | 1.3 | Sub-section H3 |
| `text-h4` | 1.125rem (18px) | 500 | 1.4 | Card titles, small H4 |
| `text-body-lg` | 1.0625rem (17px) | 400 | 1.6 | Lead paragraphs |
| `text-body` | 0.9375rem (15px) | 400 | 1.7 | Default body |
| `text-body-sm` | 0.8125rem (13px) | 400 | 1.6 | Secondary copy |
| `text-caption` | 0.6875rem (11px) | 500 | 1.5 | Captions, metadata |
| `text-label` | 0.625rem (10px) | 600 | 1.4 | Uppercase labels (`tracking-[0.25em]`, auto `text-transform: uppercase`) |
| `text-mono` | 0.75rem (12px) | 500 | 1.5 | Tabular numerals, code |

Weights are kept low (400/500) on display sizes — civic typography reads better at regular weight than bold. The serif display + light weight is the look.

**Note on h3 in card components:** several card tiles override the `text-h3` token with `text-body` or `text-body-sm` for compact dense lists. This is intentional in app shells. Audit before adding new `<h3>` elements at default size if they live inside compact grids.

---

## Color

All colors in HSL (Tailwind-friendly). Values below are the actual `tokens.css` runtime — do not infer from older docs.

### Light Theme — `:root` (default)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--background` | 36 27% 96% | `#F7F5F1` | Page background (cream) |
| `--foreground` | 24 10% 10% | `#1C1916` | Primary text (ink) |
| `--primary` | 213 73% 15% | `#0A2240` | CTAs, brand, primary buttons (navy) |
| `--primary-hover` | 214 78% 9% | `#051428` | Primary hover state (navy-900) |
| `--primary-foreground` | 0 0% 100% | `#FFFFFF` | Text on navy |
| `--accent` | 22 79% 47% | `#D96B1A` | Singular accent (orange) — ≤3% of screen |
| `--secondary` | 30 10% 98% | `#FAF9F7` | Raised surface |
| `--card` | 0 0% 100% | `#FFFFFF` | Card / panel |
| `--muted-foreground` | 0 0% 44% (≈) | `#7B746F` | Secondary text |
| `--border` | rgba | `#E7E6E4` (stone) | Default dividers |
| `--success` | per token | green | Distinct from primary |
| `--warning` | per token | amber | Caution states |
| `--destructive` | per token | red | Destructive actions |

### Dark Theme — `.dark` (admin / MC opt-in)

Canonical inversion: navy-900 background, cream foreground. **No mint, no glassmorphism, no glow** — same restraint as light.

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--background` | 214 78% 9% | `#051428` | Page background (navy-900) |
| `--foreground` | 36 27% 96% | `#F7F5F1` | Primary text (cream) |
| `--primary` | 22 79% 47% | `#D96B1A` | Orange CTA on dark — better contrast than navy-on-navy |
| `--accent` | 213 60% 45% | navy-light | Secondary accents on dark |
| `--card` | 213 73% 13% | slightly lighter than bg | Cards |

### Cluster System

The 6-color cluster rainbow (mint/blue/gold/purple/teal/red) was retired in the DS 2.1 civic-aesthetic pivot. Current cluster tokens use a 3-tone muted system that compresses to navy/orange/stone:

| Cluster | Token | Runtime | Replaces |
|---|---|---|---|
| arrive | `--cluster-arrive` | navy-700 | (was mint `#00D68F`) |
| live | `--cluster-live` | navy-700 | (was blue `#4E7BFF`) |
| legal | `--cluster-legal` | neutral-dark | (was gold `#F59E0B`) |
| invest | `--cluster-invest` | brand-orange | (was purple `#A78BFA`) |
| manage | `--cluster-manage` | neutral-dark | (was teal `#16BDCA`) |
| build | `--cluster-build` | text-body stone | (was red `#EF4444`) |
| enjoy | `--cluster-enjoy` | brand-orange | (was rose) |
| family | `--cluster-family` | navy-700 | (was family blue) |

Spatial-memory via cluster color is intentionally weaker in DS 2.1 than DS 2.0. The bet: civic uniformity beats vertical color-coding for trust. Verticals are distinguished by content density, icon, and label rather than chromatic identity.

---

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable (not compact — real-money UX needs breathing room)
- **Scale:** `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` px
- **Card padding:** `--card-padding: 1rem` (16px) standard; `--card-padding-compact: 0.75rem` for tight lists
- **Card gap:** `--card-gap: 0.75rem`
- **Page padding-x:** `1rem` (mobile) → `1.5rem` (`md:`) → `2rem` (`lg:`)
- **Section gap:** `1.5rem` (mobile) → `2rem` (`md:`) → `2.5rem` (`lg:`)

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
- **Mobile behavior:** Sheets (bottom drawers via shadcn Sheet), never Dialogs for primary actions on mobile.
- **Touch targets:** Min 44×44 on `pointer: coarse`. Header nav (theme switcher segments, lang/currency, auth links) currently undersized at 28–37px; tracked as design debt.

### Border Radius

Sharp corners by default — the civic/registry aesthetic. Bubbly radius is forbidden.

| Token | Value | Usage |
|---|---|---|
| `--radius` (default) | **0px** | Buttons, cards, panels, inputs, modals — all sharp |
| `--radius-sm` | 2px | Mini-badges, category chips |
| `--radius-md` | 0px | Reserved; do not use mid-range radius |
| `--radius-lg` | 0px | Reserved; do not use mid-range radius |
| `--radius-full` | 9999px | Avatars, status dots, pill toggles |

The 8–16px "app-like rounded" radius from DS 2.0 is deliberately rejected. Use 0 or 9999, nothing in between.

---

## Motion

- **Approach:** Intentional — entrance animations for meaningful state transitions, no gratuitous decoration
- **Easing:**
  - Standard: `cubic-bezier(0.4, 0, 0.2, 1)` (material standard)
  - Enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out — fast start)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in — fast end)
  - Spring: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — for confirmations
- **Duration scale:**
  - instant: 50ms (micro feedback)
  - fast: 100ms (hover states)
  - normal: 150ms (button presses, tab switches)
  - slow: 250ms (panel transitions)
  - entrance: 300ms (page-level fade-in-up)
- **Keyframes defined:** `fade-in`, `fade-in-up`, `accordion-down/up` (see `tailwind.config.ts`)

---

## Elevation Shadows

Restrained — civic surfaces use borders and tonal differentiation more than dramatic shadow depth. No brand-tinted glow (the DS 2.0 mint glow is retired alongside the mint palette).

| Level | Light | Usage |
|---|---|---|
| 0 | none | Flat inline elements |
| 1 | `0 1px 2px rgba(0,0,0,0.06)` | Resting cards |
| 2 | `0 4px 12px rgba(0,0,0,0.08)` | Raised cards |
| 3 | `0 8px 24px rgba(0,0,0,0.10)` | Hover / active card |
| 4 | `0 16px 40px rgba(0,0,0,0.14)` | Modals, drawers |

Dark theme uses the same shape with `rgba(0,0,0,0.3+)` per level. No accent-colored glow on either theme.

---

## Design Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-18 | (superseded) Golos Text as canonical display font | Retired in DS 2.1 pivot — Source Serif 4 + Geist now canonical via `tokens.css` `html[lang]` switch; Golos Text becomes Russian fallback only |
| 2026-04-18 | (superseded) `#00D68F` mint as dark-mode primary | Retired — dark primary is now orange `#D96B1A`; the mint glow system is removed |
| 2026-04-18 | (superseded) Dual-theme: dark-first | Retired — light is the default; dark is admin/MC opt-in |
| 2026-04-18 | `tokens.json` DS 2.0 marked deprecated | Still true — `tokens.css` is the ground truth |
| 2026-04-18 | (superseded) 6-color cluster accent system locked | Retired — clusters collapsed to 3-tone navy/orange/stone for civic uniformity |
| 2026-05-14 | DS 2.1 sync: DESIGN.md rewritten against `tokens.css` runtime | Prior DESIGN.md described a system (mint+emerald, 6-color clusters, dark-default, Golos+DM Sans+JetBrains fonts) that the code had pivoted away from. Code is the SoT; doc now matches |
| 2026-05-14 | Light-default, civic-infrastructure aesthetic confirmed | tokens.css header explicitly cites GOV.UK · e-Estonia · The Economist · Apple support docs as references. Sharp corners (`--radius: 0`), single orange accent, navy primary all reinforce registry/document feel over consumer-app feel |
| 2026-05-14 | 8–16px radius forbidden per canon | `tokens.css` sets `--radius-md` and `--radius-lg` to 0; only 0px, 2px (mini-badges), and 9999px (pills/avatars) are permitted |

---

## Open Design Debt

- **Nav header touch targets undersized (FINDING-004 from 2026-05-14 audit).** Theme switcher segments (28px), logo (28px), auth links (32px), main nav links on /navigator (37px) all sit below the 44px minimum. Needs scoped component pass.
- **`text-h3` (22px) vs in-card `<h3>` (~15px) inconsistency.** Several cluster card components render h3 at body size for density. Either codify "card h3 = body" as a documented exception, or restore default h3 in those components.
- **Cluster `--cluster-*` runtime values are muted but the names still suggest the old rainbow.** Consider renaming or adding a comment block in `tokens.css` declaring the intent.
