
# Add Property Specs to Property Profile (Source)

## Problem
The search ribbon has 11 category filters (beachfront, walk to beach, sea view, private pool, pool, washer, pets, kids, parking, wifi, luxury), but properties have empty `highlights` arrays. Owners have no way to tag these specs when adding a property.

## Solution
Add a "Property Features" card to the Add Property wizard that lets owners toggle the same categories used in the search ribbon. This ensures the filter data comes from the source.

## Changes

### 1. Add `highlights` field to `PropertyFormData`
**File**: `src/hooks/usePropertyWizard.ts`
- Add `highlights: string[]` to `PropertyFormData` interface
- Add default `highlights: []` to initial form state
- Include `highlights` in the submit payload sent to the database

### 2. Create a reusable `PropertyFeaturesSelector` component
**File**: `src/components/owner/property-wizard/PropertyFeaturesSelector.tsx` (new)
- Import `PROPERTY_CATEGORIES` from the ribbon file so the IDs are always in sync
- Render a grid of tappable chips/badges with icons matching the ribbon
- Toggle on/off, store selected IDs in `highlights` array
- Limit to 6 max (same as existing HighlightsSection)

### 3. Add the selector to BasicInfoStep
**File**: `src/components/owner/property-wizard/steps/BasicInfoStep.tsx`
- Add a new Card section titled "Property Features" / "Особенности" after the Basic Information card (before Management Type)
- Use `PropertyFeaturesSelector` passing `formData.highlights` and `updateFormData`

### 4. Reuse in property-manage HighlightsSection
**File**: `src/components/owner/property-manage/HighlightsSection.tsx`
- Replace the current `usePropertyQuickFilters` dependency with `PROPERTY_CATEGORIES` from the ribbon
- This ensures the manage page and wizard use the exact same list

## Technical Details

### Data flow
- Owner toggles "Walk to Beach" in wizard -> stored as `["walk_to_beach"]` in `highlights` column
- Search ribbon filter for "Walk" -> `matchesCategory()` checks `highlights` array for `walk_to_beach` -> match

### No database changes needed
The `highlights` column already exists as a text array on the `properties` table.
