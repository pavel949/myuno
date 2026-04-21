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

| Token | Cluster |
|-------|---------|
| `--cluster-arrive` | Arrive (mint) |
| `--cluster-live`   | Live (blue) |
| `--cluster-legal`  | Stay legal (amber) |
| `--cluster-invest` | Invest (violet) |
| `--cluster-manage` | Manage (cyan-teal) |
| `--cluster-build`  | Build (red) |

## Vertical accents (extended palette)

For storefront verticals that need a distinctive hue but do not map to a cluster, use these semantic tokens instead of raw Tailwind palette classes (`bg-rose-500`, `text-emerald-600`, …). All values are dark-tuned in `:root` and light-tuned in `html.light`.

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
| `--card-radius`    | 16 px | — | — | Card / panel corner radius |
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

## Themes

The platform ships **two parallel visual languages**. Choose by route, not by user preference.

### 1. Super-app — `deep-sea dark` (default)

Every authenticated workspace, dashboard, marketplace screen, owner/MC/admin/vendor portal, and consumer feed.

- Background `#08101E` → tokens above (default `:root`)
- Light variant available via `html.light`
- Used by: 95 % of routes

### 2. Editorial — `dark luxury` (special landings)

Reserved for marketing landings where storytelling matters more than UI density:

- `/newbuilds/*` (off-plan property storytelling)
- `/relocate`, `/wedding`, lifestyle micro-funnels

These pages opt in via per-page wrappers (`EditorialShell`, not part of this DS page-template module). They **must not** be used inside the super-app for regular dashboards.

## Anti-patterns

- ❌ `bg-[#0F1C2E]` → ✅ `bg-secondary`
- ❌ `text-[#EDF2FF]` → ✅ `text-foreground`
- ❌ Inline `style={{ color: '#00D68F' }}` → ✅ `text-primary`
- ❌ Hardcoded `padding: 24px` → ✅ `p-[var(--page-padding-x)]` or Tailwind scale (`p-6`)
- ❌ Custom shadow values → ✅ `shadow-[var(--shadow-elevation-2)]`

## Adding a new token

1. Add the variable to `:root` in `src/styles/tokens.css`.
2. Add the equivalent in `html.light`.
3. Document it here.
4. Expose via `tailwind.config.ts` only if the value should be addressable as a Tailwind utility.
