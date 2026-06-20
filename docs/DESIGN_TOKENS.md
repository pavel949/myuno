# Design Tokens — myUNO

> **Single source of truth:** [`src/styles/tokens.css`](../src/styles/tokens.css)
>
> The legacy `src/design-system/tokens.json` is **archived** — do not consume it from runtime code.

All tokens are HSL values exposed as CSS custom properties so Tailwind can consume them via `hsl(var(--…))`.

## Surface & text

| Token | Tailwind utility | Purpose |
|-------|------------------|---------|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Primary copy |
| `--card` | `bg-card` | Card / panel surface |
| `--card-elevated` | `bg-card-elevated` | Raised card |
| `--secondary` | `bg-secondary` | Subtle surface (sections) |
| `--muted` | `bg-muted` | Background tint |
| `--muted-foreground` | `text-muted-foreground` | Secondary copy |
| `--border` / `--border-strong` / `--border-subtle` | `border-border` | Dividers |

## Brand & status

| Token | Tailwind | Use |
|-------|----------|-----|
| `--primary` | `bg-primary` / `text-primary` | Brand accent |
| `--accent`  | `bg-accent`  / `text-accent`  | Secondary accent |
| `--success` | `text-success` (custom) | Positive states |
| `--warning` | `text-warning` | Caution |
| `--destructive` | `bg-destructive` | Errors, destructive actions |

## Cluster accents (locked, do not invent new)

> **DS 2.1:** the old 6-colour cluster rainbow (mint/blue/amber/violet/teal/red) is **retired**. Clusters now resolve to muted navy / orange / stone tones — no decorative per-cluster hues.

| Token | Cluster | DS 2.1 tone |
|-------|---------|-------------|
| `--cluster-arrive` | Arrive | navy-700 |
| `--cluster-live`   | Live   | navy-700 |
| `--cluster-legal`  | Stay legal | neutral-dark |
| `--cluster-invest` | Invest | brand-orange |
| `--cluster-manage` | Manage | neutral-dark |
| `--cluster-build`  | Build  | stone |

## Vertical accents (extended palette)

For storefront verticals that need a distinctive hue but do not map to a cluster, use these semantic tokens instead of raw Tailwind palette classes (`bg-rose-500`, `text-emerald-600`, …). DS 2.1 is **light-first**: values are light-tuned in `:root` (default) and dark-tuned in `.dark` (admin/MC opt-in).

| Token | Tailwind utility | Typical use |
|-------|------------------|-------------|
| `--accent-coral` | `bg-coral`, `text-coral` | Restaurants, food |
| `--accent-teal`  | `bg-teal`, `text-teal` | Wellness, spa |
| `--accent-purple` | `bg-accent-purple` | Lifestyle, community |
| `--accent-cyan` | `bg-accent-cyan` | Transport, mobility |
| `--accent-amber` | `bg-accent-amber` | Legal, documents |
| `--accent-emerald` | `bg-accent-emerald` | Investment, growth |
| `--accent-rose` | `bg-accent-rose` | Flowers, beauty |
| `--accent-sky` | `bg-accent-sky` | Yachts, travel |
| `--accent-orange` | `bg-accent-orange` | Events, energy |
| `--accent-pink` | `bg-accent-pink` | Kids, lifestyle |
| `--accent-violet` | `bg-accent-violet` | Knowledge, premium |
| `--accent-indigo` | `bg-accent-indigo` | Tech, nomad |
| `--accent-lime` | `bg-accent-lime` | Sports, fresh |
| `--accent-fuchsia` | `bg-accent-fuchsia` | Special promos |

**Rule:** never use raw Tailwind palette classes (`*-{400|500|600|700}`) in app code — always pick the closest semantic token above (or a `--cluster-*` if the page belongs to a cluster).

## Page-template semantic tokens (new)

| Token | Default | Tablet (≥768) | Desktop (≥1024) | Use |
|-------|---------|---------------|------------------|-----|
| `--page-padding-x` | `1rem`    | `1.5rem` | `2rem` | Horizontal padding inside `PageShell` |
| `--section-gap`    | `1.25rem` | `1.5rem` | `2rem` | Vertical gap between `PageSection`s |
| `--touch-target`   | `2.75rem` (44 px) | — | — | Minimum interactive size |
| `--card-radius`    | 0 px | — | — | Card / panel corner radius (DS 2.1 sharp corners; `--radius`=0, `--radius-sm`=2px, `--radius-full`=9999px) |
| `--card-padding`   | 1 rem | — | — | Card content padding |

Consume them with arbitrary values:
```tsx
<button className="h-[var(--touch-target)] px-4">…</button>
<div className="rounded-[var(--card-radius)] p-[var(--card-padding)]">…</div>
```

## Elevation

| Token | Use |
|-------|-----|
| `--shadow-elevation-1` | Resting card |
| `--shadow-elevation-2` | Raised card |
| `--shadow-elevation-3` | Hover / active |
| `--shadow-elevation-4` | Modal / drawer |
| `--shadow-elevation-5` | Float / tooltip |

## Themes (DS 2.1 — civic infrastructure)

DS 2.1 is **light-first**. The light theme is the default (`:root`); dark is an opt-in surface for admin/MC workspaces only.

### 1. Light — default (`:root`)

Every public, consumer, owner/vendor and marketing surface. Reference points: GOV.UK, e-Estonia, The Economist.

- `--background` `#F7F5F1` (cream) · `--foreground` `#1C1916` (ink)
- `--primary` `#0A2240` (navy) — CTAs, brand
- `--accent` `#D96B1A` (orange) — singular accent, ≤3 % of screen
- Used by: ~95 % of routes

### 2. Dark — opt-in (`.dark`)

Admin / MC dashboards only, where dense data benefits from a dark canvas:

- `--background` navy-900 `#051428` · `--foreground` cream
- `--primary` `#D96B1A` (orange — better contrast on navy than navy-on-navy)
- `--accent` lighter navy

**Retired in DS 2.1 (do not reintroduce):** mint `#00D68F` as primary, the 6-colour cluster rainbow, dark-default theme, glassmorphism/glow/decorative gradients, 8–16 px mid-range radius. See [`DESIGN.md`](../DESIGN.md).

## Anti-patterns

- ❌ `bg-[#0F1C2E]` → ✅ `bg-secondary`
- ❌ `text-[#EDF2FF]` → ✅ `text-foreground`
- ❌ Inline `style={{ color: '#0A2240' }}` → ✅ `text-primary`
- ❌ Hardcoded `padding: 24px` → ✅ `p-[var(--page-padding-x)]` or Tailwind scale (`p-6`)
- ❌ Custom shadow values → ✅ `shadow-[var(--shadow-elevation-2)]`

## Adding a new token

1. Add the variable to `:root` in `src/styles/tokens.css`.
2. Add the equivalent in `html.light`.
3. Document it here.
4. Expose via `tailwind.config.ts` only if the value should be addressable as a Tailwind utility.
