
# Plan: Optimize Scrolling and Swiping Experience

## Overview
Perform consistency improvements across all scrollable components to ensure smooth, native-like scrolling and swiping behavior on mobile devices.

## Issues Found

| Component | Issue | Priority |
|-----------|-------|----------|
| AudienceFilterTabs | Missing `touch-pan-x` for horizontal touch gestures | Medium |
| HomeCategoryRibbon | Uses `scrollbar-none` (not defined) instead of `scrollbar-hide` | Medium |
| FeaturedServicesGallery | Uses ScrollArea without explicit touch optimization | Low |
| AudienceFilterTabs | No scroll snap for better UX | Low |
| Multiple components | Inconsistent class patterns | Low |

## Implementation Steps

### Step 1: Fix AudienceFilterTabs
Add `touch-pan-x` class to enable proper horizontal touch gestures without interfering with vertical scrolling.

```text
Before: "flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
After:  "flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide touch-pan-x"
```

### Step 2: Fix HomeCategoryRibbon
Replace non-existent `scrollbar-none` with `scrollbar-hide` and add `touch-pan-x`.

Row 1 (Quick Actions):
```text
Before: "flex items-center gap-2 overflow-x-auto scrollbar-none pb-1"
After:  "flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-x"
```

Row 2 (Categories):
```text
Before: "flex items-center gap-2 overflow-x-auto scrollbar-none pb-1"
After:  "flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-x"
```

Skeleton rows also need fixing.

### Step 3: Optimize FeaturedServicesGallery
Replace ScrollArea component with native scroll div for better touch control:

```text
Before: <ScrollArea className="-mx-4 px-4">
After:  <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide touch-pan-x">
```

### Step 4: Add scroll snap to AudienceFilterTabs (optional UX improvement)
Add snap behavior for better filter selection feel:

```text
Container: style={{ scrollSnapType: 'x mandatory' }}
Each button: style={{ scrollSnapAlign: 'start' }}
```

## Files to Modify

1. `src/components/discover/AudienceFilterTabs.tsx` - Add touch-pan-x
2. `src/components/home/HomeCategoryRibbon.tsx` - Fix scrollbar-hide, add touch-pan-x
3. `src/components/discover/FeaturedServicesGallery.tsx` - Replace ScrollArea with native scroll

## Technical Notes

- `touch-pan-x` allows horizontal touch scrolling while permitting vertical page scroll
- `scrollbar-hide` is defined in `index.css` and works across browsers
- `scrollbar-none` is NOT defined and won't hide scrollbars
- Consistent use of `-mx-4 px-4` creates full-width bleed for carousels

## Expected Result

- Smoother horizontal swiping on all filter tabs and carousels
- No interference with vertical page scrolling
- Hidden scrollbars on all horizontal scroll areas
- Consistent touch behavior across all components
