

# Plan: Regrouping Services into 6 Logical Categories

## Current State

The `VERTICAL_GROUPS` array in `src/lib/verticalGroups.ts` currently has **5 groups** with some misplaced items:
- Transport & Mobility (transfer, vehicle, fast-track)
- Home & Living (property, cleaning, babysitter, pets, relocation)
- Leisure & Lifestyle (experience, event, water, yacht, fitness, beauty, restaurant, flower) -- **overloaded**
- Health & Administration (medical, pharmacy, insurance, legal, education) -- **mixed concerns**
- Premium & Assistance (concierge, SOS)

## New 6-Group Structure

| # | Group ID | EN Name | RU Name | Items |
|---|----------|---------|---------|-------|
| 1 | `home` | Home & Living | Дом и быт | Property, Cleaning, Babysitter, Pet Care, Flowers |
| 2 | `transport` | Transport | Транспорт | Transfer, Vehicle, Fast Track |
| 3 | `leisure` | Leisure & Activities | Досуг и развлечения | Experience, Yacht, Water Sports, Events, Restaurant |
| 4 | `wellness` | Health & Wellness | Здоровье и красота | Medical, Pharmacy, Beauty, Fitness, Insurance |
| 5 | `admin` | Life Admin | Документы и финансы | Legal, Education, Relocation |
| 6 | `help` | Help | Помощь | Concierge, SOS |

### Key Moves
- **Beauty** and **Fitness**: from Leisure to Health & Wellness
- **Insurance**: stays in Health & Wellness (logically related)
- **Flowers**: from Leisure to Home & Living (delivery/home service)
- **Education** and **Legal**: moved to Life Admin (bureaucracy)
- **Relocation** (/banking): moved to Life Admin
- **Restaurant**: stays in Leisure (dining out = leisure activity)

## Files to Change

### 1. `src/lib/verticalGroups.ts`
Rewrite the `VERTICAL_GROUPS` array with the new 6 groups, updating IDs, labels, icons, and item assignments.

### 2. `src/pages/Discover.tsx`
No structural changes needed -- it consumes `VERTICAL_GROUPS` only for flattening search results, which will work automatically with the new grouping.

### No changes needed to:
- `useSuperAppCatalog.ts` -- uses its own `VERTICAL_ORDER` and taxonomy system, independent of `VERTICAL_GROUPS`
- `SuperAppCatalogAccordion.tsx` -- driven by `useSuperAppCatalog`
- `homeServicesTaxonomy.ts` -- road-assistance stays in the home services taxonomy (it's a sub-category within the services page, not a top-level vertical)
- Mini-app names remain unchanged (no renaming needed)

## Technical Details

The only file requiring changes is `src/lib/verticalGroups.ts`. The new structure:

```text
VERTICAL_GROUPS[0] = home     (property, cleaning, babysitter, pet_service, flower)
VERTICAL_GROUPS[1] = transport (transfer, vehicle, fast-track route)
VERTICAL_GROUPS[2] = leisure   (experience, event, water_activity, yacht, restaurant)
VERTICAL_GROUPS[3] = wellness  (medical, pharmacy route, beauty, fitness, insurance)
VERTICAL_GROUPS[4] = admin     (legal, education, relocation/banking route)
VERTICAL_GROUPS[5] = help      (concierge route, SOS route)
```

This is a single-file change with zero risk of breaking other components since `VERTICAL_GROUPS` is only imported by `Discover.tsx` for search indexing.

