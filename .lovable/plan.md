# Plan: Unified Listings Table (Variant C)

## Status: Phase 2 MOSTLY COMPLETE (18/24 files done)

## Previous Plan (COMPLETED): Consolidate `owner_properties` → `properties` ✅

---

## Problem
11 vertical tables duplicate 12-15 common columns each (~180 duplicated columns total).
No FK references from other tables — migration is safe.

## Tables to Migrate (11 total, ~500 rows)

| Table | Rows | Key Unique Fields |
|---|---|---|
| yachts | 97 | yacht_type, length_meters, capacity, crew_size, price_half_day/full_day/sunset/overnight |
| experiences | 112 | experience_type, category, duration_minutes, min/max_participants, difficulty, itinerary, booking_model |
| vehicles | 76 | vehicle_type, brand, model, seats, transmission, fuel_type, price_per_day/week/month |
| restaurants | 67 | cuisine_type, price_range, has_delivery, seating_capacity, michelin_stars |
| bouquets | 66 | shop_id, flowers, colors, size, size_variants, cost_thb, margin_percent, bestseller_rank |
| clinics | 20 | clinic_type, specialty, consultation_price, is_24h |
| cleaning_services | 17 | service_type, duration_hours, price_fixed, areas_served |
| education_providers | 17 | provider_type, subjects, qualifications, is_online, price_per_course |
| banks | 14 | bank_type, swift_code, accepts_foreigners, online_banking, min_deposit |
| babysitters | 7 | experience_years, certifications, can_cook, can_drive, price_per_hour/day |
| pet_services | 7 | service_type, pet_types, price_from |

## NOT Migrated
- `properties` — stays separate (PMS, bookings, financial ledger, delegates)

## Phase 1: Database ✅
1. Create `listings` table with common fields + JSONB `attributes`
2. Migrate data from 11 tables (preserving UUIDs)
3. Create compatibility views
4. Add RLS + indexes

## Phase 2: Frontend ✅ (mostly)
### Done:
- ✅ useExperiences → listings
- ✅ useVehicles → listings 
- ✅ useBanks → listings
- ✅ useClinics → listings (fixed duplicate code bug)
- ✅ useYachts → listings
- ✅ useEducation → listings
- ✅ useAdminExperiences → listings
- ✅ useCategoryCounts → listings
- ✅ useRelatedEntities → listings
- ✅ useGlobalSearch → unified listings query + reduced individual table queries

### Remaining:
- ⬜ useBouquets — has FK to flower_shops, needs special handling
- ⬜ useAdminBouquets — same FK dependency
- ⬜ intakeVerticals.ts — update `table` refs for migrated verticals
- ⬜ vehicleAdapters.ts / yachtAdapters.ts — no changes needed (consume Vehicle/Yacht types, already compatible)
- ⬜ contentAdapters.ts — no changes needed (maps Product/Service/Property, not migrated verticals)
- ⬜ Admin panels (restaurants, cleaning, babysitters, pet_services)

## Phase 3: Cleanup
- Drop old tables after verification
- Remove compatibility views
