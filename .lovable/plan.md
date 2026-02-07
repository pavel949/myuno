
# Yacht Vertical: Full Audit and Upgrade Plan

## Current State Assessment

### Data Completeness (97 active yachts)

| Field | Filled | Missing | Coverage |
|-------|--------|---------|----------|
| price_full_day | 43 | 54 | 44% |
| price_half_day | 29 | 68 | 30% |
| price_overnight | 27 | 70 | 28% |
| price_sunset | 2 | 95 | 2% |
| description_en | 48 | 49 | 49% |
| features_en | 47 | 50 | 48% |
| addons | 1 | 96 | 1% |
| departure_times | 0 | 97 | 0% |
| beam | 0 | 97 | 0% |
| engines | 0 | 97 | 0% |
| slug | 50 | 47 | 52% |
| pricing_rules (seasonal) | 0 | -- | 0% |

### Critical Issues Found

**1. 54 yachts have NO pricing at all** -- they show as "0 THB" in listing cards. These are mostly Boat Lagoon Yachting vessels added without prices.

**2. Category taxonomy mismatch:** DB has `motor_yacht`, `superyacht`, `catamaran`, `speedboat`, but YACHT_CATEGORIES filter uses `yacht`, `sailing` -- categories that don't exist in data. `motor_yacht` and `superyacht` have no matching filter category.

**3. No yacht content adapter exists** in `src/lib/adapters/` -- yachts are the only major vertical without a canonical `mapYachtToCardProps()` adapter.

**4. charter_options is always `[full_day]`** for all 97 yachts, even those with half_day/overnight pricing. This field is not used anywhere meaningful.

**5. Addons system is empty** -- only 1 yacht (My Sky 53) has addons data. No UI exists to display or select addons during booking.

**6. No seasonal pricing rules** -- `yacht_pricing_rules` table exists with season/day_of_week/special_event support, but has 0 rows. High/low season pricing is not implemented.

**7. Detail page missing key sections** vs. competitors (Sailo, GetMyBoat, Click&Boat):
   - No "What's Included / Not Included" section
   - No addons/extras selection
   - No cancellation policy display
   - No fuel policy display
   - No insurance info
   - No provider/operator info card
   - No itinerary/route suggestions
   - No "Similar Yachts" section

**8. Booking flow** only supports half_day/full_day -- no sunset or overnight charter types despite DB columns existing.

---

## Upgrade Plan

### Phase 1: Data Integrity Fix (Database)

**1.1 Scrape missing prices from boatlagoonyachting.com** for all 54 vessels with NULL pricing via edge function.

**1.2 Fix charter_options** to reflect actual pricing availability:
```sql
UPDATE yachts SET charter_options = array_remove(
  array_remove(
    ARRAY[
      CASE WHEN price_half_day IS NOT NULL THEN 'half_day' END,
      CASE WHEN price_full_day IS NOT NULL THEN 'full_day' END,
      CASE WHEN price_sunset IS NOT NULL THEN 'sunset' END,
      CASE WHEN price_overnight IS NOT NULL THEN 'overnight' END
    ], NULL
  ), NULL
);
```

**1.3 Generate slugs** for 47 missing entries.

**1.4 Populate departure_times** with sensible defaults per charter type.

### Phase 2: Taxonomy and Filter Alignment

**2.1 Fix YACHT_CATEGORIES** to match actual DB values:
```
all, catamaran, motor_yacht, superyacht, speedboat
```
Remove phantom `yacht` and `sailing` categories.

**2.2 Add sort by length** (common in yacht marketplaces) and "Newest" sort option.

### Phase 3: Content Adapter

**3.1 Create `mapYachtToCardProps()`** adapter in `src/lib/adapters/yachtAdapters.ts` following the same pattern as vehicleAdapters. Map charter type label, "from" price logic, specs badges (length, cabins, year), and provider name.

### Phase 4: Detail Page Upgrade to Industry Standard

**4.1 Add "Included / Not Included" section** rendering `features_en` as included items + a new `exclusions_en` text array column.

**4.2 Add "Extras & Add-ons" section** parsing the `addons` JSONB with structured schema:
```json
[
  { "name_en": "Jet Ski", "name_ru": "...", "price": 15000, "unit": "per_hour" },
  { "name_en": "Extra guest (11+)", "price": 2000, "unit": "per_person" }
]
```

**4.3 Add "Policies" section** displaying:
- Cancellation policy (from `cancellation_policy` field)
- Fuel policy (from `fuel_policy`)
- Insurance (from `insurance_included` + `insurance_notes`)
- Deposit requirement (from `deposit_percent`)

**4.4 Add "Operator" card** showing provider name, rating, fleet count, and contact.

**4.5 Add "Similar Yachts" carousel** at the bottom (same type, similar price range).

### Phase 5: Booking Flow Expansion

**5.1 Support all 4 charter types** (half_day, full_day, sunset, overnight) in `YachtBookingQuickSelect` and `YachtBooking` page.

**5.2 Add addons selection step** in booking flow with price calculation.

**5.3 Show cancellation policy and deposit info** in booking summary.

### Phase 6: Seasonal Pricing

**6.1 Seed yacht_pricing_rules** with Phuket high season (Nov-Apr, +20-30%) and low season (May-Oct) baseline for major vessels.

**6.2 Display seasonal pricing badge** on cards ("High Season" / "Low Season") based on current date.

---

## Technical Details

### New DB Columns Needed
- `exclusions_en text[]` -- what's NOT included
- `exclusions_ru text[]`
- Standardize `addons` JSONB schema to structured array

### New Files
- `src/lib/adapters/yachtAdapters.ts` -- content adapter
- Update `src/lib/adapters/index.ts` -- export yacht adapter

### Modified Files
- `src/pages/yachts/YachtDetail.tsx` -- add 4 new sections (included/excluded, addons, policies, operator, similar)
- `src/pages/yachts/YachtsIndex.tsx` -- use adapter for card rendering
- `src/components/yachts/YachtBookingQuickSelect.tsx` -- support sunset/overnight, addons
- `src/lib/filterConfigs/yachtFiltersKlook.ts` -- fix categories to match DB
- `src/components/filters/YachtsFilters.tsx` -- align with actual data

### Execution Order
1. Database migrations (new columns, data fixes)
2. Scrape missing prices via edge function
3. Fix taxonomy/filters
4. Create adapter
5. Upgrade detail page
6. Expand booking flow
7. Seed seasonal pricing
