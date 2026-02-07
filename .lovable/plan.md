

# Life Flow Page -- Redesign and Mapping Improvement

## Current Problems

### 1. Mapping Gaps (Critical)

Several life situations have missing or illogical entity type coverage:

| Situation | Has Now | Missing |
|-----------|---------|---------|
| **Just Arrived** (arrival_first_day) | 2 restaurants | clinics/pharmacies, transport/taxi, experiences, marketplace (SIM cards, essentials) |
| **Trip Planning** (pre_trip_planning) | property, vehicle | experiences, tours (pre-bookable activities) |
| **Business & Work** | yacht, property, vehicle, restaurant | legal_service (company registration, tax) |
| **Long-term Stay** | property, clinic, legal_service | restaurant, gym, salon (daily life services) |
| **Family with Kids** | babysitter, clinic, tour, restaurant | experiences (family activities), property (family-friendly housing) |

### 2. Page UX Issues

- **No real content preview**: Cards show only entity type icon + title + weight bar. No photos, no ratings, no actionable info.
- **"Match %" bar is confusing**: End users don't know what "75%" means. This is an internal admin metric (weight) exposed raw.
- **No category-level quick navigation**: User must scroll through all blocks to find what they need.
- **All cards look identical**: No visual difference between "Book a villa" and "Find a restaurant".
- **Missing entity images**: The resolver returns `entity_id` but the page never fetches the actual entity data (photo, rating, price range).

### 3. Data Architecture Issue

The `resolve_life_os_context` RPC returns generic metadata (title, price, trust_level) but NOT entity-specific rich data (cover photo, rating, address). This means the page can only show minimal cards.

---

## Proposed Solution

### Phase 1: Fix Mappings (Database)

Add missing mappings to `catalog_life_map` for critical gaps:

**arrival_first_day** -- Add:
- 3 clinics (pharmacies/medical) -- weight 80-85, primary
- 3 vehicles (taxi/transport) -- weight 75-80, primary  
- 2 experiences (orientation tours) -- weight 55-60, secondary

**pre_trip_planning** -- Add:
- 2 tours (pre-bookable excursions) -- weight 55-60, secondary
- 2 experiences -- weight 50-55, secondary

**business_work** -- Add:
- 2 legal_services (company, tax) -- weight 70-75, primary

**long_term_living** -- Add:
- 2 restaurants -- weight 45-50, secondary

**family_with_children** -- Add:
- 2 properties (family-friendly) -- weight 70-75, primary

### Phase 2: Redesign the LifeFlowPage

Replace the current generic card grid with a structured, actionable layout:

```text
+--------------------------------------------------+
|  [<] Just Arrived           [Sparkles] 12 items   |
|  First day essentials for Phuket                  |
+--------------------------------------------------+
|                                                    |
|  [Quick Nav Chips]                                |
|  [ Medical ] [ Transport ] [ Food ] [ Tours ]     |
|                                                    |
|  --- ESSENTIALS (primary blocks) ---              |
|                                                    |
|  Medical & Pharmacy                    View all > |
|  +-------------+  +-------------+                 |
|  | [photo]     |  | [photo]     |                 |
|  | Clinic Name |  | Clinic Name |                 |
|  | Verified    |  | Rating 4.8  |                 |
|  | Open 24h    |  | 2km away    |                 |
|  +-------------+  +-------------+                 |
|                                                    |
|  Transport & Taxi                      View all > |
|  +--------------------------------------------+  |
|  | [horizontal scroll cards with photos]       |  |
|  +--------------------------------------------+  |
|                                                    |
|  --- ALSO USEFUL ---                              |
|                                                    |
|  Restaurants                           View all > |
|  [compact list cards]                             |
|                                                    |
|  +--------------------------------------------+  |
|  | [Compass] Explore Full Catalog         [>]  |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

Key changes:
- **Quick nav chips at top**: Horizontal scroll of entity type chips for instant jump-to-section
- **Entity photos**: Fetch actual entity cover images via a lightweight join or separate query
- **Replace "Match %" with trust badges**: Show "Verified", "Featured", "Top Rated" instead of raw weight numbers
- **Horizontal scroll for secondary blocks**: Save vertical space
- **"Open now" / "24h" indicators**: For clinics and restaurants, show operational status

### Phase 3: Enrich Data Layer

Update the `resolve_life_os_context` RPC or add a client-side enrichment step:
- After receiving entity IDs from the resolver, batch-fetch cover images and ratings from entity tables (properties, restaurants, clinics, etc.)
- This avoids changing the RPC but provides rich card content

---

## Technical Details

### Files to Create/Modify

| File | Action |
|------|--------|
| **Database migration** | INSERT new mappings into `catalog_life_map` for 5 situations |
| `src/pages/LifeFlowPage.tsx` | Major rewrite: add quick nav chips, photo-enriched cards, replace weight bars with badges |
| `src/hooks/useLifeOS.ts` | Add `useEnrichCatalogItems()` hook to batch-fetch entity photos/ratings |
| `src/components/life-flow/LifeFlowCategoryChips.tsx` | New: horizontal scroll chips for quick category navigation |
| `src/components/life-flow/LifeFlowEntityCard.tsx` | New: rich card component with photo, title, badge, and CTA |
| `src/components/life-flow/GuidedFallback.tsx` | Minor: no changes needed |

### Enrichment Hook Pattern

```text
useEnrichCatalogItems(catalogItems)
  -> Group by entity_type
  -> For each type, query the corresponding table by IDs
  -> Return merged data: { ...catalogItem, coverImage, rating, isOpen }
```

This keeps the resolver lightweight while providing rich UI data.

### Badge Logic (replacing weight %)

```text
weight >= 85  -> "Top Pick" badge (gold star)
weight >= 70  -> "Recommended" badge (primary color)
trust_level = "verified" -> "Verified" shield icon
otherwise -> no badge, clean card
```

### Database: New Mappings

Approximately 15 new rows in `catalog_life_map`, selected from real active entities in the database:
- 3 clinics for `arrival_first_day` (from 20 active clinics)
- 3 vehicles for `arrival_first_day` (from 64 active vehicles)
- 2 experiences for `arrival_first_day` (from 71 active)
- 2 tours for `pre_trip_planning` (from 29 active)
- 2 legal_services for `business_work` (from 14 active)
- 2 restaurants for `long_term_living` (from 25 active)
- 2 properties for `family_with_children` (from 28 active)
