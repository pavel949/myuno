

## Diagnosis

### 1. Properties not displaying in preview
All Supabase requests in the sandbox are returning "Failed to fetch" — this is a **sandbox network connectivity issue**, not a code bug. The database has 5+ active rental properties with images and prices. The published site (myuno.app) should display them correctly.

### 2. Font contrast: "Black on blue not visible"
The app defaults to **light theme** (ThemeContext returns `'light'`), but `:root` in `tokens.css` defines dark theme tokens. When the theme class isn't applied fast enough or certain components use hardcoded/inline dark colors, text can appear dark on a dark background.

Specific contrast risks found:
- `HeroBlock` search input uses `hsl(var(--bg-elevated))` background with hardcoded `border: '1px solid hsl(0 0% 100% / 0.07)'` — this is dark-mode-only styling baked into inline styles
- `FeaturedPropertiesCarousel` cards use inline `style={{ background: 'hsl(var(--card))', border: '1px solid hsl(0 0% 100% / 0.07)' }}` — hardcoded white-alpha borders assume dark mode
- `WelcomeHero` hero block uses CSS classes `hero-bg` and `hero-dots` which have proper light/dark variants, but the search bar inside also has inline dark-theme borders

## Plan

### Step 1: Fix hardcoded dark-mode inline styles
Replace all hardcoded `hsl(0 0% 100% / 0.07)` border colors in these components with the semantic `hsl(var(--border))` token, which adapts to light/dark mode:
- `src/components/home/HeroBlock.tsx` — search input border
- `src/components/home/WelcomeHero.tsx` — search bar border
- `src/components/home/FeaturedPropertiesCarousel.tsx` — property card borders

### Step 2: Verify text color classes
Ensure all text in these components uses semantic Tailwind classes (`text-foreground`, `text-muted-foreground`) rather than any hardcoded color values. Current code mostly does this correctly.

### Step 3: Verify on published site
Recommend testing on the published myuno.app where Supabase connectivity works, to confirm properties load and contrast is correct.

## Technical Details
- **Files to edit**: `HeroBlock.tsx`, `WelcomeHero.tsx`, `FeaturedPropertiesCarousel.tsx`
- **Change type**: Replace ~5 inline `hsl(0 0% 100% / 0.07)` values with `hsl(var(--border))`
- **Risk**: Minimal — purely swapping hardcoded values for semantic tokens
- **No DB changes needed**

