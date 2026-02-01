
# Phase 2: Experiences - Frontend Implementation Plan

## Current State Summary

### Database (Phase 1 - Completed)
The `experiences` table has been created and contains **60 records**:
- **29 tours** (`experience_type: 'tour'`)
- **31 activities** (`experience_type: 'activity'`)

Key unified fields:
- `experience_type`: 'tour' | 'activity'
- `category`: islands, water-sports, adventure, cultural, nature, etc.
- `title_en`, `title_ru`, `description_en`, `description_ru`
- `price`, `currency`, `duration_minutes`
- `rating`, `review_count`, `is_featured`, `is_active`
- `difficulty`, `equipment_included`, `is_certified`
- `includes`, `excludes`, `requirements`, `highlights`, `itinerary`
- `meeting_point`, `location_name`, `meeting_point_lat/lng`

### Frontend (Phase 2 - To Be Implemented)
Currently using separate systems:
- `/tours` - uses `useTours` hook, `tours` table
- `/water` - uses `useWaterActivities` hook, `water_activities` table

---

## Implementation Plan

### Step 1: Create Unified Experiences Hook

Create a new hook `useExperiences.ts` that:
- Fetches from the `experiences` table
- Supports filtering by `experience_type` (tour/activity/all)
- Supports filtering by category, featured status
- Provides both list and single-item fetching

```text
src/hooks/useExperiences.ts
  - Experience interface (unified type)
  - useExperiences(options) - list hook
  - useExperience(id) - single item hook
  - transformExperience() - data normalization
```

### Step 2: Create Unified Filter Configuration

Create a combined filter config for experiences:

```text
src/components/filters/ExperiencesFilters.tsx
  - experienceFilterConfig
  - Merges tour and water activity filter options
  - Adds experience_type filter (Tour/Activity toggle)
```

### Step 3: Create Experiences Pages

**Index Page** (`/experiences`):
```text
src/pages/experiences/ExperiencesIndex.tsx
  - Hero with experience-type toggle (All/Tours/Activities)
  - Category chips (Islands, Water Sports, Adventure, etc.)
  - Unified filter sidebar
  - ItemCard grid with experience cards
  - CrossSellSection
```

**Detail Page** (`/experiences/:id`):
```text
src/pages/experiences/ExperienceDetail.tsx
  - Unified detail view
  - Shows itinerary for tours
  - Shows requirements/safety for water activities
  - Dynamic sections based on experience_type
```

**Booking Page** (`/experiences/:id/book`):
```text
src/pages/experiences/ExperienceBooking.tsx
  - Unified booking flow
  - Date/time selection
  - Participant count
  - Payment integration
```

### Step 4: Create Homepage Section

Replace `ToursSection` and `WaterSection` with unified:

```text
src/components/home/ExperiencesSection.tsx
  - Shows featured experiences (mixed tours & activities)
  - Optional tabs for Tours/Activities/All
  - Links to /experiences
```

### Step 5: Update Routing

Update `AnimatedRoutes.tsx`:
- Add `/experiences` route
- Add `/experiences/:id` route
- Add `/experiences/:id/book` route
- Keep `/tours` and `/water` as redirects (backward compatibility)

### Step 6: Update Navigation & Cross-Sell

- Update navigation to link to `/experiences`
- Update `crossSellConfig` to use experiences instead of separate tours/water
- Update `QuickActionsGrid` if needed

---

## File Structure (New Files)

```text
src/
  hooks/
    useExperiences.ts         (NEW)
  
  pages/
    experiences/
      ExperiencesIndex.tsx    (NEW)
      ExperienceDetail.tsx    (NEW)
      ExperienceBooking.tsx   (NEW)
  
  components/
    filters/
      ExperiencesFilters.tsx  (NEW)
    home/
      ExperiencesSection.tsx  (NEW)
```

---

## Files to Modify

1. **src/components/layout/AnimatedRoutes.tsx**
   - Add lazy imports for experience pages
   - Add new routes
   - Add redirects from /tours and /water

2. **src/components/filters/index.ts**
   - Export new experienceFilterConfig

3. **src/pages/Index.tsx** (if needed)
   - Replace ToursSection/WaterSection with ExperiencesSection

4. **src/lib/crossSellConfig.ts** (if exists)
   - Update to reference experiences

---

## Technical Details

### Experience Interface
```typescript
interface Experience {
  id: string;
  experience_type: 'tour' | 'activity';
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string | null;
  cover_image: string | null;
  images: string[];
  price: number | null;
  price_per: string | null;
  currency: string;
  duration_minutes: number | null;
  max_participants: number | null;
  min_participants: number | null;
  difficulty: string | null;
  equipment_included: boolean;
  is_certified: boolean;
  includes: unknown[];
  excludes: unknown[];
  requirements: unknown[];
  highlights: unknown[];
  itinerary: unknown[];
  location_name: string | null;
  meeting_point: string | null;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  available_days: string[];
  start_times: string[];
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  is_featured: boolean;
  // ... other fields
}
```

### Categories (Unified)
```typescript
const EXPERIENCE_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа' },
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг' },
];
```

---

## Implementation Order

1. **useExperiences hook** - foundation for data fetching
2. **ExperiencesFilters** - filter configuration
3. **ExperiencesIndex page** - main listing page
4. **ExperienceDetail page** - individual experience view
5. **ExperienceBooking page** - booking flow
6. **AnimatedRoutes update** - routing setup
7. **ExperiencesSection** - homepage component
8. **Legacy redirects** - /tours and /water redirects

---

## Backward Compatibility

The old routes `/tours` and `/water` will redirect to `/experiences` with appropriate filters:
- `/tours` redirects to `/experiences?type=tour`
- `/water` redirects to `/experiences?type=activity`

Old hooks (`useTours`, `useWaterActivities`) can remain for vendor/admin pages until Phase 3 is complete.

---

## Estimated Scope

- **New files**: 6
- **Modified files**: 3-5
- **Lines of code**: ~800-1000

