

## "Explore More" -- Universal Verticals Drawer

### Problem
Users on detail pages (like `/cleaning/...`) or deep vertical views have no way to discover other available verticals without navigating back to the Home or Discover page. The existing `CrossSellSection` only shows contextually related verticals (3-4 items), not the full catalog.

### Solution
Create a reusable `ExploreVerticalsSheet` bottom-sheet (Drawer) component that displays all 19 verticals from `VERTICALS` registry in a clean icon grid. Then surface it via:

1. **A "More Services" row** at the bottom of every detail page and vertical listing page
2. **A "See All" button** appended to the existing `QuickServiceIcons` grid (the 8th slot becomes "More")
3. **Integration with `CrossSellSection`** -- add a trailing "See all" link that opens the sheet

### What Users Will See

- On any detail page (e.g., `/cleaning/...`): a section near the bottom titled "Explore More" / "Ещё услуги" with a compact 2-row icon strip + "View all" button that opens a full-screen drawer with all 19 verticals organized in a 4-column grid
- On the Discover page `QuickServiceIcons`: the 8th icon slot replaced with a "More" button opening the same drawer
- The drawer shows all verticals from `VERTICALS` registry with emoji-resolved Lucide icons, localized labels, and navigation to the vertical's listing page

### Technical Details

**New file: `src/components/shared/ExploreVerticalsSheet.tsx`**
- Uses `vaul` Drawer (already installed) for mobile-native bottom sheet
- Reads all verticals from `VERTICALS` registry (`src/lib/verticals.ts`)
- Resolves emoji icons via `resolveIcon()` from `src/lib/iconMap.ts`
- 4-column grid layout matching existing `QuickServiceIcons` visual style
- Bilingual labels (EN/RU) from `VerticalDefinition.labelEn/labelRu`
- Each item navigates to `/${vertical.plural}` and closes the sheet
- Accepts optional `trigger` prop for custom trigger buttons, or renders a default one

**Modified: `src/components/services/QuickServiceIcons.tsx`**
- Show 7 featured items instead of 8
- Add a "More" icon button in the 8th slot that opens `ExploreVerticalsSheet`

**New file: `src/components/shared/ExploreMoreBanner.tsx`**
- Lightweight horizontal strip component showing 5-6 vertical icons + "All" button
- Designed to be dropped into any detail page layout
- Opens `ExploreVerticalsSheet` on "All" click
- Title: "Explore More" / "Ещё услуги"

**Modified: `src/components/crosssell/CrossSellSection.tsx`**
- Add trailing "See all services" link that opens `ExploreVerticalsSheet`

### Architecture Alignment
- Uses `VERTICALS` from `src/lib/verticals.ts` as single source of truth (per memory)
- Uses `resolveIcon` for consistent emoji-to-Lucide mapping
- Follows existing Drawer/Sheet pattern (vaul) used elsewhere in the app
- Follows `space-y-6` spacing and `rounded-2xl` card hierarchy standards
- Mobile-first with `touch-manipulation` and `active:scale-95` interaction patterns

