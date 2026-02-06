
# Plan: Fix Mobile Horizontal Scroll and Snap ("Sniper") Issues

## Problem Analysis

Based on thorough code analysis and session replay data, I've identified **three root causes** for the broken horizontal scroll and snap behavior on mobile:

### Root Cause 1: Global CSS Blocks All Horizontal Scrolling
**File:** `src/index.css` (lines 29-34)
```css
html, body {
  overscroll-behavior-x: none;
  overflow-x: hidden;  /* ← BLOCKS ALL HORIZONTAL SCROLL */
  width: 100%;
  max-width: 100vw;
}
```
This global rule prevents horizontal scrolling on the entire page, which kills carousels.

### Root Cause 2: Parent Container overflow-x-hidden
Multiple parent containers apply `overflow-x-hidden`:
- `MiniAppLayout.tsx` via `AppLayout` 
- Various dashboard layouts (Admin, Vendor, Owner, Manager)

This creates a CSS cascade where child scroll containers cannot scroll horizontally.

### Root Cause 3: AnimatePresence + forwardRef Conflict
**File:** `src/pages/experiences/ExperiencesIndex.tsx` (lines 26-152)

The `ExperienceCard` uses `React.forwardRef` but wraps content in `motion.div`, then is rendered inside `AnimatePresence mode="popLayout"`. This causes the console warning:
```
Warning: ref is not a prop. Trying to access it will result in undefined
```
Framer Motion's `motion.div` doesn't forward refs the same way React expects, causing layout instability.

---

## Solution

### Step 1: Fix Global CSS (Critical)
Modify `src/index.css` to allow horizontal scroll for specific containers while blocking page-level overscroll:

**Before:**
```css
html, body {
  overscroll-behavior-x: none;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}
```

**After:**
```css
html {
  overscroll-behavior-x: none;
  max-width: 100vw;
}

body {
  overscroll-behavior-x: none;
  width: 100%;
  max-width: 100vw;
}

/* Remove overflow-x: hidden from html/body - it kills carousels */
/* Layout stability is maintained via max-w-full + min-w-0 on flex containers */
```

### Step 2: Add Horizontal Scroll Container Utility
Add a new utility class in `src/index.css` for explicit horizontal scroll enablement:

```css
/* Explicit horizontal scroll container - overrides parent restrictions */
.scroll-x-container {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
```

### Step 3: Fix ExperienceCard ref Forwarding
Update `ExperienceCard` to properly handle refs with Framer Motion:

**Before:**
```tsx
const ExperienceCard = React.forwardRef<HTMLDivElement, Props>(
  ({ experience, language }, ref) => {
    return (
      <motion.div
        ref={ref}  // ← Causes warning
        ...
```

**After:**
```tsx
// Remove forwardRef - AnimatePresence popLayout handles exit animations internally
const ExperienceCard = ({ experience, language }: Props) => {
  return (
    <motion.div
      layout
      layoutId={experience.id}
      ...
```

### Step 4: Update UnifiedFiltersKlook Scroll Container
Add explicit scroll-enabling classes to the filter chips row in `src/components/shared/UnifiedFiltersKlook.tsx`:

**Before:**
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-y snap-x snap-mandatory pb-2 -mx-1 px-1">
```

**After:**
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
     style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}>
```

### Step 5: Update MiniAppLayout Content Container
Remove implicit overflow restrictions from `MiniAppLayout.tsx`:

The `AppLayout` wrapper already has `max-w-full min-w-0` which prevents layout overflow without blocking scroll. No changes needed there, but ensure the content div doesn't add restrictions.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Remove `overflow-x: hidden` from html/body, add scroll utility |
| `src/pages/experiences/ExperiencesIndex.tsx` | Fix ExperienceCard ref forwarding with motion |
| `src/components/shared/UnifiedFiltersKlook.tsx` | Add inline touch-action styles for reliability |
| `src/components/shared/UnifiedScrollSection.tsx` | Add inline touch-action as backup |

---

## Technical Details

### Why touch-action Matters
```css
touch-action: pan-x pan-y;
```
This explicitly tells the browser to allow both horizontal and vertical touch gestures, preventing gesture hijacking by the browser's back/forward navigation.

### Why We Remove overflow-x-hidden from Body
The memory context explicitly states:
> "Root layout containers like AppLayout.tsx and MiniAppLayout.tsx must NOT apply 'overflow-x-hidden'. This class, when used on parent wrappers, blocks the native horizontal scroll of child carousels on mobile devices."

The global CSS in `index.css` violates this principle.

### Why We Fix the forwardRef Pattern
Framer Motion v12+ handles refs internally for `motion.*` components. Using `React.forwardRef` and passing `ref` to `motion.div` directly causes a double-ref situation that triggers React warnings and can cause layout calculation issues during AnimatePresence transitions.

---

## Verification Checklist

After implementation, test on mobile:
- [ ] Horizontal scroll works in Experience filters (date chips, category pills)
- [ ] Cards snap correctly when swiping (snap-x snap-mandatory works)
- [ ] No horizontal page overflow (page doesn't shift right)
- [ ] No console warnings about refs
- [ ] Cross-sell carousel scrolls smoothly
- [ ] Service promo carousel works
