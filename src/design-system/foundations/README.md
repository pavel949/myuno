# myUNO DS2.0 — Foundations

## Color System
All colors are **semantic** — never hardcode HSL values in components.

### Surfaces
| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-card` | Card / panel surface |
| `bg-card-elevated` | Raised card |
| `bg-muted` | Subtle surface (sections) |
| `bg-primary` | Brand accent surface |

### Text
| Token | Usage |
|-------|-------|
| `text-foreground` | Headings, primary copy |
| `text-muted-foreground` | Secondary / descriptions |
| `text-primary` | Links, interactive text |
| `text-primary-foreground` | Text on brand surface |

### Borders
| Token | Usage |
|-------|-------|
| `border-border` | Default dividers |
| `border-border/60` | Subtle card borders |
| `border-input` | Form inputs |

## Typography Scale
Uses `Space Grotesk` (display), `DM Sans` (body), `Instrument Serif` (editorial).

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-lg` | 2.5rem | 700 | Hero titles |
| `display-md` | 2rem | 700 | Page titles |
| `heading-lg` | 1.5rem | 600 | Section headers |
| `heading-md` | 1.25rem | 600 | Card headers |
| `heading-sm` | 1.125rem | 600 | Subsections |
| `body-lg` | 1rem | 400 | Desktop body |
| `body-md` | 0.875rem | 400 | Mobile body |
| `body-sm` | 0.8125rem | 400 | Dense UI |
| `caption` | 0.75rem | 500 | Labels, hints |
| `overline` | 0.625rem | 600 | Category labels |

## Spacing
4px base grid: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96`

## Elevation (5 levels)
| Level | Usage | Shadow token |
|-------|-------|------|
| 0 | Flat | `shadow-none` |
| 1 | Resting card | `shadow-elevation-1` |
| 2 | Raised card | `shadow-elevation-2` / `shadow-card` |
| 3 | Hover / active | `shadow-elevation-3` / `shadow-card-hover` |
| 4 | Modal / drawer | `shadow-elevation-4` / `shadow-elevated` |
| 5 | Float / tooltip | `shadow-elevation-5` / `shadow-float` |

## Radius
| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 4px | Tags, chips |
| `rounded-md` | 8px | Badges, inputs |
| `rounded-lg` | 12px | Buttons, compact cards |
| `rounded-xl` | 16px | Cards |
| `rounded-2xl` | 20px | Hero cards |
| `rounded-full` | 9999px | Pills, avatars |

## Motion
| Duration | Value | Use |
|----------|-------|-----|
| `instant` | 50ms | Micro-feedback |
| `fast` | 100ms | Button press |
| `normal` | 150ms | Hover transitions |
| `slow` | 250ms | Panel slides |
| `entrance` | 300ms | Page transitions |

## Quality Rules
- ❌ No hardcoded colors — use semantic tokens
- ❌ No inline styles — use Tailwind classes
- ❌ No arbitrary shadows — use elevation scale
- ✅ All interactive states required (hover, focus, disabled, loading)
- ✅ Dark mode compatible
- ✅ Focus-visible with `ring` tokens
