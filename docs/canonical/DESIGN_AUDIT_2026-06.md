# Design Consistency & Layout Audit — June 2026

> Generated 2026-06-21 with the UI/UX Pro Max skill, scored against myUNO's own
> canonical design system **DS 2.1** (`DESIGN.md` + `src/styles/tokens.css`).
> The skill's *generative* suggestions (glassmorphism, teal, Cinzel) were
> **rejected** — DS 2.1 (civic-infrastructure: navy + single orange accent,
> sharp corners, Source Serif 4 / Geist / IBM Plex Mono, no glass/glow/gradient)
> is the source of truth. Only the skill's universal UX/a11y rules were applied.

## Through-line

myUNO has **excellent canonical primitives** — design tokens, `PageShell`,
`Button`, `Card`, `Skeleton`, `ResponsiveModal` — but **enforcement is
inconsistent at the call-site**. The fix is *adoption + guardrails*, not new
design.

---

## 1. Design tokens & visual language

`tailwind.config.ts` correctly maps semantic tokens (`hsl(var(...))`), collapses
`md/lg/xl/2xl` radius to `0`, and maps shadow/font tokens — config is compliant.
Violations live in component markup:

| Category | Count | Severity | Notes |
|---|---|---|---|
| Forbidden radius (`rounded-md/lg/xl/2xl`) | 47 occ / 31 files | MEDIUM | Breaks sharp-corner civic identity |
| Glassmorphism (`backdrop-blur`+translucent bg) | 19 / 14 files | MEDIUM | Mostly sticky landing headers |
| Decorative gradients | ~265 (~30% decorative) | LOW | Keep functional fades/overlays/shimmer; replace decorative tonal fills |
| Hardcoded hex | retired mint `#00D68F` (`MapLibreMap.tsx`) + functional status/brand palettes | MIXED | Mint fallback is a true violation; floor-plan status colors & brand logos are legitimate data-viz/brand uses |
| Stale fonts in components | 0 | NONE | Only legacy fallbacks in `index.html`/`main.tsx` |

## 2. Layout & app shell

Architecture is sound (`NavShell` → `AppLayout` → `PageShell`); the issue is low
adoption of the canonical wrapper.

| Finding | Severity | Evidence |
|---|---|---|
| Container-width chaos | HIGH | ~337 distinct `max-w-*` combos (`max-w-lg`×100, `max-w-2xl`×77, `max-w-3xl`×64, `max-w-[1536px]`×48) |
| `PageShell` under-adopted | HIGH | <5% of pages; ~200 hardcode their own outer div |
| `--page-padding-x` token ignored | MEDIUM | ~337 pages hardcode `px-4 md:px-6 lg:px-8` |
| Two competing containers | MEDIUM | `ECOSYSTEM_PAGE_CONTAINER` (1536px) vs `PageShell` (max-w-5xl) |
| Abrupt width jump / double padding | MEDIUM | `OwnerDashboard.tsx` `max-w-lg md:max-w-[1536px]` + `pb-24` twice |
| 5 layout patterns where 2 suffice | MEDIUM | legacy `MCLayout`/`AdminLayout`/`VendorLayout` |
| No standard responsive grid | MEDIUM | breakpoints vary per page |

## 3. Components & accessibility

Strong primitives, uneven enforcement:

| Finding | Severity | Evidence |
|---|---|---|
| Icon-only buttons missing `aria-label` | HIGH | ~217 `size="icon"` Buttons — WCAG A |
| Images missing `alt` | HIGH | ~169 `<img>` (~59%) |
| Undersized touch targets (<44px) | MEDIUM | ~15–20 forced `h-6 w-6`/`h-8 w-8` interactive els |
| Dialog used for mobile flows | MEDIUM | ~1001 `Dialog` vs 318 `Sheet`; `ResponsiveModal` exists (106 uses) |
| Raw `<button>` bypassing primitive | MEDIUM | ~876 raw `<button>` |
| Emoji-as-icon | LOW | ~22 instances |
| Loading / bilingual / no console.log | GOOD ✅ | Skeleton 509×, RU/EN 2978×, 0 prod logs |

---

## Remediation plan (phased, low-risk — no logic changes)

- **Phase A — Visual identity:** kill forbidden radius, remove glassmorphism
  from sticky headers, fix retired-mint hex.
- **Phase B — Accessibility:** add `aria-label` to icon buttons, `alt` to
  images, bump sub-44px targets, convert worst raw `<button>` in shared chrome.
- **Phase C — Layout consolidation (pilot):** adopt `PageShell` on a pilot set,
  standardize admin width, document one canonical responsive grid.
- **Phase D — Mobile modals:** convert mobile-facing `Dialog` → `ResponsiveModal`.

### Canonical page wrapper & responsive grid (Phase C)
- **Page wrapper:** every authenticated/role page should use `PageShell`
  (`src/components/page/PageShell.tsx`) as its outermost element instead of a
  hand-rolled `<div className="px-… max-w-… mx-auto">`. Width modes:
  `narrow` (max-w-3xl) · `default` (max-w-5xl) · `wide` (max-w-7xl) · `full`.
  PageShell owns horizontal padding (`--page-padding-x` token) and bottom-nav
  safe-area clearance — do not re-add `px-*`/`pb-24` inside.
  - Data-dense admin/workspace pages that genuinely need 1536px use
    `<PageShell width="full" className="max-w-[1536px]">` so width is preserved
    while padding/clearance get standardized.
- **Responsive grid (canonical):** for card/catalog grids use the progression
  `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
  (drop the last step for wider cards). Avoid ad-hoc `md:`-only jumps.

### Recommended guardrails
- ESLint/CI grep to flag `rounded-(md|lg|xl|2xl)`, `backdrop-blur`, and hex
  literals in `src/**/*.tsx`.
- Lint rule (or PR check) requiring `aria-label` on `size="icon"` buttons and
  `alt` on `<img>`.

### Out of scope / deliberately retained
- Floor-plan **status** color palette (`PublicFloorPlan.tsx`,
  `FloorPlanEditor.tsx`) — functional data-viz; tokenize later, don't recolor
  semantics now.
- Brand-logo hexes (Google, WhatsApp, LINE) — must stay accurate.
- Functional gradients (scroll fades, image overlays, skeleton shimmer).
