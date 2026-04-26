## Goal
Refactor `ServiceTile` (and the matching cluster headers / "Coming soon" chips) in `src/components/navigation/NavigatorPage.tsx` so it complies with DS2.0:

- No hardcoded hex colors / opacity hacks (`color + '14'`, `+ '20'`, `+ '1A'`, `'#F59E0B22'`).
- 24px icon size (current 20px).
- Bigger, breathable tile with typography that doesn't truncate the label.
- Proper touch target (≥44px, comfortable 88px).
- Surface, border, and elevation pulled from semantic tokens.

## Scope
Single file: **`src/components/navigation/NavigatorPage.tsx`** — only the visual layer for `ServiceTile`, the cluster header bubble, and the "Coming soon" chip. No routing, taxonomy, or filter logic changes.

## Design changes

### 1. Tile sizing & layout
- From `w-[72px] h-[72px]` (cramped, label clipped) → `w-[88px] h-[96px]` with `p-2`.
- Switch from `rounded-none` → `rounded-2xl` to match DS2.0 card radius.
- Two-line label (`line-clamp-2`) at `text-[11px] leading-[1.15]` so localized RU labels ("Перевозки", "Документы") don't get cut.
- Icon block: `w-6 h-6` (24px), centered above label, with `gap-1.5`.

### 2. Color tokenization (no inline `style`)
Replace per-cluster inline hex with the existing semantic cluster tokens already defined in `src/styles/tokens.css` and exposed in `tailwind.config.ts` (`bg-cluster-arrive`, `text-cluster-live`, etc.). Map taxonomy cluster id → token via a small lookup:

```ts
const CLUSTER_TOKEN: Record<string, string> = {
  arrive: 'arrive', live: 'live', manage: 'manage',
  invest: 'invest', legal: 'legal', build: 'build',
};
```

Then compose Tailwind classes:
- Tile bg: `bg-cluster-{token}/8` (was `clusterColor + '14'`)
- Tile border: `border border-cluster-{token}/15`
- Icon: `text-cluster-{token}`
- Header bubble: `bg-cluster-{token}/10`
- Header title: `text-cluster-{token}`
- "Coming soon" chip: `bg-cluster-{token}/8 border-cluster-{token}/15`

Because Tailwind needs literal class names, we'll use a static map (`bg-cluster-arrive/8` etc.) instead of dynamic interpolation.

### 3. Status badges using tokens
- PRO badge `'#F59E0B22'/'#F59E0B'` → `bg-amber-500/15 text-amber-500` (or semantic `bg-warning/15 text-warning` if defined).
- Soon badge keeps `bg-muted/40 text-muted-foreground`.

### 4. Elevation & interaction
- Default: `shadow-[var(--shadow-card)]`.
- Hover/active (where touch supports): `hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98]`.
- Disabled (`isSoon`) keeps `opacity-40 pointer-events-none`.

### 5. Cluster header bubble
- `w-9 h-9 rounded-xl` (was `w-8 h-8 rounded-none`) for visual parity with the new tile radius.
- Icon `w-5 h-5` using `text-cluster-{token}`.

### 6. Horizontal rail
- Bump gap from `gap-2` → `gap-2.5` for the new wider tiles.
- Keep snap + scrollbar-hide; no other rail changes.

## Out of scope
- Filtering / persona logic (already done in the previous wave).
- Navigation copy / routes.
- Replacing the rail with a fade-mask grid (deferred per existing plan).

## Verification
1. `bunx tsc --noEmit` — must stay clean.
2. Visual QA on `/navigator` at 384px viewport: tiles align, two-line RU labels visible, no overflow, cluster colors readable in dark + light mode.
3. `bunx vitest run src/test/catalog/taxonomy-coverage.test.ts` — confirm no regression in cluster ↔ service mapping.

## Files touched
- `src/components/navigation/NavigatorPage.tsx` (only)
