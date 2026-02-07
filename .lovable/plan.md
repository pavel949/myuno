

# Fix Data Alignment and Remove Emojis from Property Search

## Problem Summary

Three issues discovered after comparing search/filter UI with actual database data:

1. **Location Mismatch**: The search bar has 10 hardcoded locations, but the database (`lookup_values` district type) has 22 districts. Keys also don't match (e.g., `bangtao` in search vs `bang-tao` in DB), causing location filters to silently fail.

2. **Amenity/Highlight Alignment**: Quick filters and the filter drawer both read from `lookup_values`, which is correct. However, the search bar locations are completely disconnected from the same source.

3. **Emoji Usage**: Multiple places render raw emojis instead of Lucide icons -- the `AirbnbSearchBar` location list, `usePropertyQuickFilters` fallback icons, `usePropertyFilterOptions` bedroom/listing type options, and `useDynamicFilterOptions` static options all contain emoji strings that bypass the icon conversion system.

---

## What Changes

### 1. AirbnbSearchBar -- Dynamic Locations from DB

Replace the hardcoded `locations` array with data from `lookup_values` (district type), loaded via the existing `usePropertyQuickFilters` hook which already fetches districts.

- Import `usePropertyQuickFilters` into `AirbnbSearchBar.tsx`
- Remove the hardcoded `locations` constant (lines 26-37)
- Build the location list from `districts` returned by the hook, prepending an "All Phuket" option
- District `valueKey` values will match what owners set in the property form (e.g., `bang-tao`, `nai-harn`), ensuring filter-to-data alignment

### 2. Remove All Emoji Icons

Replace emoji strings with `undefined` or Lucide icon names across these files:

**AirbnbSearchBar.tsx:**
- Location items: remove emoji icons, use a `MapPin` Lucide icon for all locations instead of per-location emojis
- The "All Phuket" option: use `Globe` icon

**usePropertyFilterOptions.ts:**
- Bedroom options (lines 85-91): replace `'🛏️'`, `'1️⃣'`, etc. with `undefined` (the `Bed` Lucide icon is already contextually clear)
- Listing type options (lines 93-96): replace `'🔑'` and `'🏷️'` with `undefined`

**usePropertyQuickFilters.ts:**
- Default fallback icon (line 116): change `'✨'` to `undefined`
- District fallback icon (line 145): change `'📍'` to `undefined`

**useDynamicFilterOptions.ts:**
- Transport passenger options (lines 107-111): remove emoji icons
- Yacht capacity/duration options (lines 258-270): remove emoji icons
- Flower size/style/color/delivery options (lines 323-355): remove emoji icons
- Category ribbon "All" options: remove `'🌟'` emoji

**PropertyIndex.tsx:**
- Property type pills "All" item (line 77): remove `'🏠'` emoji

### 3. Filtering Logic Verification

The current filtering in `PropertyIndex.tsx` (lines 117-119) uses `includes()` for location matching against `searchParams.locations`. After making locations dynamic from the DB, the `valueKey` format (`bang-tao`) will match the property `district` field (`bang-tao`) exactly, fixing the current silent mismatch.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/AirbnbSearchBar.tsx` | Replace hardcoded locations with DB-driven districts; remove emojis from location rendering |
| `src/hooks/usePropertyFilterOptions.ts` | Remove emojis from bedroom and listing type static options |
| `src/hooks/usePropertyQuickFilters.ts` | Remove emoji fallbacks for icons |
| `src/hooks/useDynamicFilterOptions.ts` | Remove emojis from all static filter options (transport, yacht, flower, category ribbons) |
| `src/pages/property/PropertyIndex.tsx` | Remove emoji from "All" property type pill |

---

## Technical Notes

- The `FilterChip` component already has `isEmoji()` + `getIconForEmoji()` conversion as a safety net, but the goal is to stop sending emojis at the source level
- Removing emoji icon props (`undefined`) means `FilterChip.renderIcon()` returns `null`, showing text-only chips -- which is the clean, professional look
- The `lookup_values` table still stores emoji strings in the `icon` column for DB-driven options; those will continue to be auto-converted by `FilterChip` via the `iconMap` system. The change here only affects hardcoded/static options in TypeScript files.

