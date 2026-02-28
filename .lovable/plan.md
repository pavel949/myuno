# Plan: Unified Listings Table (Variant C)

## Status: Phase 2 COMPLETE ✅

## Previous Plan (COMPLETED): Consolidate `owner_properties` → `properties` ✅

---

## Problem
11 vertical tables duplicate 12-15 common columns each (~180 duplicated columns total).
No FK references from other tables — migration is safe.

## Phase 1: Database ✅
1. Created `listings` table with common fields + JSONB `attributes`
2. Migrated data from 11 tables (preserving UUIDs)
3. Created compatibility views
4. Added RLS + indexes

## Phase 2: Frontend ✅
### Public hooks → listings:
- ✅ useExperiences, useVehicles, useBanks, useClinics
- ✅ useYachts, useEducation, useBabysitters, usePetServices

### Admin hooks → listings:
- ✅ useAdminExperiences, useAdminYachts, useAdminVehicles
- ✅ useAdminRestaurants, useAdminClinics
- ✅ useAdminEducation, useAdminPets, useAdminCleaning, useAdminBabysitters

### Search & infrastructure → listings:
- ✅ useCategoryCounts — single count query
- ✅ useRelatedEntities — single query with vertical filters
- ✅ useGlobalSearch — unified listings query + reduced individual table queries
- ✅ intakeVerticals.ts — 8 verticals updated to table='listings'

### NOT migrated (by design):
- `properties` — stays separate (PMS, bookings, financial ledger)
- `bouquets` — has FK to `flower_shops`, kept separate
- Non-listing tables (salons, gyms, events, etc.) — not in scope

## Phase 3: Cleanup (TODO)
- Drop old tables after verification period
- Remove compatibility views
- Migrate bouquets if flower_shops FK is resolved
