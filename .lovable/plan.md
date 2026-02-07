

# "Family with Kids" -- Page Redesign

## Problem

Currently the `family_with_children` Life Flow page shows only 9 mapped items: 3 babysitters, 2 clinics, 2 properties, 1 tour, 1 restaurant. A parent opening this page sees nannies and clinics first -- not what they're looking for when planning family fun in Phuket.

## What We'll Build

A rich, activity-focused page with **real Phuket family entertainment** seeded into the database and properly mapped to this Life OS situation. The page layout will be reorganized to prioritize **fun and activities** over utilities.

---

## Section 1: Seed Real Family-Friendly Data

We'll insert **~20 real Phuket family attractions** into the `experiences` table (using `experience_type: 'activity'`) with a new set of family-relevant categories:

| Activity | Category | Source |
|----------|----------|--------|
| Hanuman World Zipline | zipline | Already in DB |
| Andamanda Water Park | waterpark | New seed |
| Splash Jungle Water Park | waterpark | New seed |
| Blue Tree Phuket (pool/activities) | waterpark | New seed |
| Baan Teelanka (Upside Down House) | attraction | New seed |
| Phuket Trickeye Museum | attraction | New seed |
| Phuket Go-Kart Speedway (Kathu) | karting | New seed |
| Phuket Wake Park | wakeboarding | Already in DB |
| Phuket Shooting Range | attraction | New seed |
| Flying Hanuman (separate from Hanuman World) | zipline | New seed |
| Phuket Elephant Sanctuary | wildlife | Already in DB |
| Mini Golf Phuket (Dino Park) | attraction | New seed |
| Phuket Aquarium | attraction | New seed |
| Thai Cooking Class for Kids | cooking_class | Already in DB |
| Tiger Kingdom Phuket | wildlife | New seed |
| Surf House Kata (FlowRider) | surfing | New seed |
| Rawai Park (kids playground) | playground | New seed |
| Kids Club at Laguna | playground | New seed |
| Boat Avenue Family Market | attraction | New seed |

Also seed **education/childcare** entries for the practical side:
- 2-3 international schools (British International, HeadStart, UWC Thailand)
- 2-3 kindergartens/camps (Gecko Kids, Phuket International Kindergarten)

These will go into relevant existing tables or `experiences` with appropriate categories.

---

## Section 2: Enrich `catalog_life_map` Mappings

Insert ~25 new mappings for `family_with_children` with updated weights:

| Tier | Entity Type | Weight | Content |
|------|-------------|--------|---------|
| Essentials (top) | experience | 90 | Waterparks, Go-Kart, Ziplines |
| Essentials | experience | 85 | Upside Down House, Aquarium, Dino Park |
| Essentials | experience | 80 | Elephant Sanctuary, Cooking Class |
| Fun & Active | tour | 70 | Island trips, ATV |
| Dining | restaurant | 65 | Family-friendly restaurants |
| Childcare | babysitter | 60 | Existing babysitters |
| Education | school | 55 | International schools |
| Education | kindergarten | 50 | Kindergartens, day camps |
| Practical | clinic | 45 | Pediatric clinics |
| Practical | property | 40 | Family villas |

This ensures **activities appear first**, clinics and property move to "Also Useful" section.

---

## Section 3: Custom Section Ordering for Family Page

Modify `LifeFlowPage.tsx` to support **situation-specific section ordering**. For `family_with_children`, sections will be arranged:

1. **Fun & Activities** (experiences with categories: waterpark, karting, zipline, attraction, playground)
2. **Tours & Nature** (tours: islands, elephant sanctuary, ATV)
3. **Dining** (family-friendly restaurants)
4. **Childcare** (babysitters, kindergartens)
5. **Schools & Camps** (schools, education)
6. **Health & Safety** (clinics) -- in "Also Useful"
7. **Family Housing** (properties) -- in "Also Useful"

Implementation: use the existing `weight` field from `catalog_life_map` to control ordering. The page already sorts by weight; we just need the new weights to reflect the correct priority.

---

## Section 4: Entity Type Enhancements

Add missing entity types to `entityTypes.ts` if not already present:
- `activity` (for standalone activities like karting, waterparks) -- or reuse `experience` type

Add experience sub-categories to `experiencesTaxonomy.ts`:
- `waterpark`, `karting`, `attraction`, `playground`

---

## Technical Details

### Database Changes (SQL migration)

1. **Insert ~15 new experiences** into `experiences` table with:
   - `experience_type: 'activity'`
   - `category`: waterpark / karting / attraction / playground / wildlife
   - `age_restriction: 0` (family-friendly)
   - Real titles, descriptions, prices, locations
   - `is_active: true`, `approval_status: 'approved'`

2. **Insert ~25 new rows** into `catalog_life_map` linking new + existing entities to `family_with_children` situation (id: `47dd9683-4648-4ccb-acdb-060551b8379d`)

3. **Update existing mappings**: Lower weights for clinic (from 80/75 to 45) and property (from 75/72 to 40) so they appear in "Also Useful"

### Frontend Changes

1. **`src/lib/taxonomies/experiencesTaxonomy.ts`**: Add `waterpark`, `karting`, `attraction`, `playground` categories

2. **`src/pages/LifeFlowPage.tsx`**: Add situation-specific section priority config so `experience` and `tour` types render above `clinic` and `property` for family context. This is mostly already handled by weights, but we'll ensure the `isPrimaryEntityType` logic respects the actual weight ordering from the DB rather than the static config.

### Files Changed
| File | Change |
|------|--------|
| SQL Migration | Seed ~15 experiences + ~25 catalog_life_map rows, update existing weights |
| `src/lib/taxonomies/experiencesTaxonomy.ts` | Add 4 new categories |
| `src/pages/LifeFlowPage.tsx` | Sort sections by average weight instead of static primary/secondary |
| `src/hooks/useEnrichCatalogItems.ts` | No change needed (experience already supported) |

