

# Property Booking UX -- Audit and Project Filter Integration

## UX Audit Summary

### What Works Well
- **Airbnb-style search bar**: Full-screen mobile modal with tabs (Where/When/Who) is intuitive and polished
- **Category ribbon**: Rent/Buy mode toggle + property type icons (Condo, Villa, Apartment, More) is clear
- **Quick filter chips**: Dynamic highlights (Sea View, Pool, Instant Book) and district pills work correctly
- **Infinite scroll**: Smooth loading with sentinel observer
- **Sort options**: Price, Rating, Newest, Recommended
- **Detail page**: Photos, amenities, booking CTA -- all functional

### Issues Found

| # | Problem | Severity |
|---|---------|----------|
| 1 | **Project carousel cards navigate away** instead of filtering listings in-place. User clicks "Patong Tower" and gets sent to `/complexes` page, losing context. | High |
| 2 | **No project filter chip** in the quick filters ribbon. The `selectedProjectId` state exists but has zero UI to activate it. | High |
| 3 | **Project promo section takes up significant vertical space** but doesn't enable filtering -- it's just a promotion that navigates away. | Medium |
| 4 | **No "clear project filter" UI** -- even if we wire it up, there's no way for the user to see/remove the project filter. | Medium |

### What Users Expect
When a user sees "Patong Tower Residence (7 listings)" in the carousel, they expect to **click it and see those 7 listings filtered below**, not navigate to a different page.

---

## Proposed Solution: Project-Based Filtering

### 1. Make Project Carousel Cards filter in-place

Change `ProjectCarouselCard` behavior: instead of `navigate('/complexes?highlight=...')`, emit an `onSelect(projectId)` callback that sets `selectedProjectId` in `PropertyIndex`.

### 2. Add project filter chip to QuickFiltersRibbon

When a project is selected, show a highlighted chip at the beginning of the quick filters row:
```text
[ X Patong Tower ] [ Sea View ] [ Pool ] [ Verified ] ...
```

Clicking X removes the project filter.

### 3. Wire ProjectPromoSection to PropertyIndex state

Pass `onProjectSelect` and `selectedProjectId` props from PropertyIndex down to ProjectPromoSection and then to ProjectCarouselCard. Selected card gets a visual highlight (border/ring).

### 4. Keep "View all complexes" link

The "View all complexes" CTA button at the bottom of the promo section still navigates to `/complexes` for full browsing.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/property/ProjectCarouselCard.tsx` | Add optional `onSelect` callback prop. When provided, call it instead of navigating. Add visual "selected" state (ring). |
| `src/components/property/ProjectPromoSection.tsx` | Add `onProjectSelect` and `selectedProjectId` props. Pass them to each `ProjectCarouselCard`. |
| `src/pages/property/PropertyIndex.tsx` | Pass `onProjectSelect={setSelectedProjectId}` and `selectedProjectId` to `ProjectPromoSection`. |
| `src/components/property/QuickFiltersRibbon.tsx` | Add `selectedProjectName` and `onProjectClear` props. Render a dismissible chip when a project is selected. |

### Data Flow

```text
PropertyIndex
  |-- selectedProjectId (state)
  |-- ProjectPromoSection
  |     |-- ProjectCarouselCard (onClick -> setSelectedProjectId)
  |-- QuickFiltersRibbon
  |     |-- [Project chip with X] (onClick -> setSelectedProjectId(null))
  |-- applyQuickFilters(properties, quickFilters, selectedProjectId)  // already works!
```

### ProjectCarouselCard Changes

- New props: `onSelect?: (id: string) => void`, `isSelected?: boolean`
- If `onSelect` provided: call `onSelect(project.id)` on click (toggle behavior -- click again to deselect)
- If not provided: keep current navigate behavior (used elsewhere)
- Visual: `isSelected && "ring-2 ring-primary"` on the card container

### QuickFiltersRibbon Changes

- New props: `selectedProjectName?: string`, `onProjectClear?: () => void`
- When `selectedProjectName` is set, render a chip before the quick filters:
  ```
  <FilterChip label={selectedProjectName} isActive={true} onToggle={onProjectClear} dismissible />
  ```

### PropertyIndex Wiring

- Look up selected project name from the projects list (via `usePropertyQuickFilters` which already fetches projects)
- Pass project name to QuickFiltersRibbon for display

