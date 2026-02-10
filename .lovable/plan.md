

## Make Quick Action Icons Look Like App Buttons

Transform the current icon circles into app-style launcher buttons — large rounded squares with prominent icons inside, similar to iOS/Android home screen apps.

### What Changes

**QuickActionsGrid.tsx** -- restyle the icon containers and SVGs:

- **Container**: increase from `w-16 h-16` to `w-[60px] h-[60px]`, use `rounded-[16px]` (iOS-style squircle rounding), add a subtle `shadow-sm` for depth
- **Background**: keep `bg-primary/8` but make it slightly stronger (`bg-primary/10`) so it reads more like a solid app tile
- **Icon SVG**: increase from `w-9 h-9` to `w-8 h-8` (keep proportional within the larger container), keep `strokeWidth={1.5}` for clean lines
- **Overall button padding**: tighten so the grid feels like an app launcher, not a list

### Visual Result

Before: flat translucent circles with small icons
After: rounded-square tiles with prominent icons, looking like tappable app buttons

### Files to modify
- `src/components/home/QuickActionsGrid.tsx` -- container styling update only

