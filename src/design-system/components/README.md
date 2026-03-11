# myUNO DS2.0 — Component Library

## Status: Phase 2 Complete

### Core UI (Refactored for DS2.0)
| Component | File | DS2.0 Status |
|-----------|------|-------------|
| Button | `ui/button.tsx` | ✅ Elevation tokens, glow-border |
| Card | `ui/card.tsx` | ✅ 4 variants, elevation scale |
| Badge | `ui/badge.tsx` | ✅ 7 variants |
| Input | `ui/input.tsx` | ✅ Semantic tokens |
| Dialog | `ui/dialog.tsx` | ✅ elevation-4, rounded-xl |
| Toast | `ui/toast.tsx` | ✅ elevation-4, rounded-xl |
| Tabs | `ui/tabs.tsx` | ✅ elevation-1/2 active |
| Alert | `ui/alert.tsx` | ✅ rounded-xl, border-border/60 |
| Skeleton | `ui/skeleton.tsx` | ✅ rounded-xl shimmer |

### New DS2.0 Components
| Component | File | Purpose |
|-----------|------|---------|
| Surface | `ui/surface.tsx` | Semantic background container (6 variants) |
| StatusPill | `ui/status-pill.tsx` | Status indicator with dot (8 statuses) |
| EmptyState | `ui/empty-state.tsx` | Empty/error/no-results pattern (4 presets) |

### Data Display (Refactored)
| Component | File | DS2.0 Status |
|-----------|------|-------------|
| ItemCard | `miniapp/ItemCard.tsx` | ✅ elevation-2/3, rounded-xl |
| CatalogHeader | `shared/CatalogHeader.tsx` | ✅ elevation-3, navy gradient |

### Design Tokens (designTokens.ts)
New structured exports:
- `ELEVATION` — 6-level shadow scale
- `RADIUS` — 7 radius tokens
- `SPACING` — 4px grid scale
- `TYPOGRAPHY` — 10 text presets
- `MOTION` — 5 durations + 4 easings
- `CARD` — 5 composite card styles
- `BADGE` — 15 badge variants
- `IMAGE` — hover/static/container
- `ASPECT` — 5 ratio presets

All backward-compatible with existing `DESIGN_TOKENS`, `CARD_STYLES`, `BADGE_SYSTEM` exports.

## Usage Examples

### Surface
```tsx
import { Surface } from '@/components/ui/surface';

<Surface variant="card" padding="md" radius="xl">
  Content here
</Surface>

<Surface variant="raised" bordered={false}>
  Elevated panel
</Surface>
```

### StatusPill
```tsx
import { StatusPill } from '@/components/ui/status-pill';

<StatusPill status="active">Active</StatusPill>
<StatusPill status="warning" dot={false}>Pending Review</StatusPill>
```

### EmptyState
```tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  preset="no-results"
  description="Try adjusting your filters"
  actionLabel="Clear Filters"
  onAction={handleClear}
/>
```

## Token source (DS 2.0)
- **Single source:** `src/styles/tokens.css` (loaded via `src/design-system/index.css`).
- **JS/TS:** Use `@/design-system/tokens-bridge` for typed token names and `hslVar()` in dynamic styles.
- **ESLint:** Prefer semantic classes (`bg-primary`, `text-foreground`) over arbitrary values (`bg-[#...]`, `text-[hsl(...)]`).

## Typography scale (tokens.json)
| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| display-lg | 2.5rem | 1.15 | 700 | Hero titles |
| display-md | 2rem | 1.15 | 700 | Section titles |
| heading-lg | 1.5rem | 1.2 | 600 | Card titles |
| heading-md | 1.25rem | 1.25 | 600 | Subsections |
| heading-sm | 1.125rem | 1.3 | 600 | List headers |
| body-lg | 1rem | 1.65 | 400 | Lead copy |
| body-md | 0.875rem | 1.6 | 400 | Body |
| body-sm | 0.8125rem | 1.5 | 400 | Secondary |
| caption | 0.75rem | 1.4 | 500 | Labels |
| overline | 0.625rem | 1.2 | 600 | Category labels |

Use Tailwind: `font-display`, `text-xl`… and semantic tokens; avoid arbitrary font sizes when a scale value exists.

## Quality Gates
- ❌ No hardcoded colors (use `bg-primary`, `text-foreground`, `hsl(var(--chart-1))` in JS)
- ❌ No `shadow-sm/md/lg` — use `[box-shadow:var(--shadow-elevation-N)]`
- ❌ No `rounded-2xl` on interactive cards — use `rounded-xl`
- ✅ All borders use `border-border/60` (not `/40` or `/50`)
- ✅ All card hover: `elevation-2 → elevation-3`
- ✅ All modals/drawers: `elevation-4`
- ✅ All floating: `elevation-5`
