
# Phase 2: Experiences - Frontend Implementation Plan

## ✅ COMPLETED (2026-02-01)

All Phase 2 tasks have been implemented:

### Implemented Files

1. **`src/hooks/useExperiences.ts`** - Unified hook for fetching from `experiences` table
2. **`src/components/filters/ExperiencesFilters.tsx`** - Merged filter configuration
3. **`src/pages/experiences/ExperiencesIndex.tsx`** - Main listing page with type toggle
4. **`src/pages/experiences/ExperienceDetail.tsx`** - Detail view with dynamic sections
5. **`src/pages/experiences/ExperienceBooking.tsx`** - Unified booking flow
6. **`src/components/home/ExperiencesSection.tsx`** - Homepage featured section

### Updated Files

1. **`src/components/layout/AnimatedRoutes.tsx`** - Added routes and redirects
2. **`src/components/filters/index.ts`** - Added experience filter exports
3. **`src/lib/crossSellConfig.ts`** - Added experiences cross-sell config

### Routing

- `/experiences` - Main unified listing
- `/experiences/:id` - Detail page
- `/experiences/:id/book` - Booking page
- `/tours` → redirects to `/experiences?type=tour`
- `/water` → redirects to `/experiences?type=activity`

### Next Steps (Phase 3)

- Update homepage to use ExperiencesSection
- Update QuickActionsGrid navigation
- Migrate admin/vendor pages to use experiences table
- Remove legacy tours/water_activities tables
