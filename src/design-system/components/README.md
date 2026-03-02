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

## Quality Gates
- ❌ No hardcoded colors
- ❌ No `shadow-sm/md/lg` — use `[box-shadow:var(--shadow-elevation-N)]`
- ❌ No `rounded-2xl` on interactive cards — use `rounded-xl`
- ✅ All borders use `border-border/60` (not `/40` or `/50`)
- ✅ All card hover: `elevation-2 → elevation-3`
- ✅ All modals/drawers: `elevation-4`
- ✅ All floating: `elevation-5`
