

# Plan: Consolidate `owner_properties` into `properties`

## Problem
The dual-table architecture (`properties` + `owner_properties`) creates compounding technical debt:
- **5 parallel queries** where 2 would suffice (in `getAccessiblePropertyIds`)
- **24 files** reference `owner_properties`, each with manual deduplication
- **FK splits**: bookings, tasks, guidebooks point to `owner_properties`; financials point to `properties`
- **Triggers** must search both tables with fallback logic
- All this for a use case of 1 owner, 1-5 properties, 1 MC

## Solution: Single Source of Truth

Merge all PMS-specific columns into `properties` and migrate all foreign keys.

## Steps

### Phase 1 -- Database Migration
1. **Add missing PMS columns to `properties`** (if not already present): `check_in_time`, `check_out_time`, `check_in_instructions`, `check_in_instructions_ru`, `wifi_name`, `wifi_password`, `house_rules`, `house_rules_ru`, `status` (PMS status), and any other columns exclusive to `owner_properties`
2. **Migrate data**: Copy rows from `owner_properties` that don't exist in `properties` (using UPSERT by ID or a mapping key)
3. **Re-point foreign keys**: Update FK references on `property_bookings`, `property_operational_tasks`, `property_maintenance_schedules`, `property_delegates`, `property_guidebook`, `booking_operations`, `booking_meter_readings`, `booking_inventory_reports` to reference `properties(id)` instead of `owner_properties(id)`
4. **Update triggers**: Simplify `fn_auto_expense_on_task_done` and `fn_sync_financial_to_ledger` to query only `properties`
5. **Update RLS**: Remove dual-table policies; all MC-scoped policies reference `properties.management_company_id` directly
6. **Create compatibility view**: `CREATE VIEW owner_properties AS SELECT * FROM properties` for any edge cases during transition

### Phase 2 -- Frontend Refactor (24 files)

**Core access layer** (3 files):
- `src/lib/getAccessiblePropertyIds.ts` -- Remove queries 1b and 3b (owner_properties). Down from 5 queries to 3
- `src/hooks/useMyProperties.ts` -- Remove `useCompanyProperties` dual-table logic. Single query to `properties`
- `src/hooks/usePropertyCare.ts` -- Ensure `useOwnerProperties` queries `properties` table

**Operational hooks** (4 files):
- `src/hooks/useOperationalTasks.ts` -- Change join from `owner_properties!property_id` to `properties!property_id`
- `src/hooks/useMaintenanceSchedules.ts` -- Same join fix
- `src/hooks/usePropertyOwnership.ts` -- Same join fix  
- `src/hooks/useManagementRequests.ts` -- Same join fix

**Booking and guest layer** (4 files):
- `src/hooks/usePropertyBookings.ts` -- Remove `owner_properties` mapping, use `properties` join
- `src/pages/guest/GuestTripDetail.tsx` -- Change `owner_properties` join to `properties`
- `src/pages/guest/MyStay.tsx` -- Update property reference
- `src/hooks/usePropertyGuidebook.ts` -- Change join to `properties`

**Admin** (1 file):
- `src/components/admin/operations/OperationsModerationTab.tsx` -- Query `properties` instead of `owner_properties`

**Transparency dashboard** (1 file):
- `src/pages/owner/OwnerTransparencyDashboard.tsx` -- Change table reference

### Phase 3 -- Cleanup
- Drop `owner_properties` table (or keep as empty view for safety)
- Remove deprecated `getAccessiblePropertyIdsLegacy` function
- Remove `getAccessiblePropertyIds` in `usePropertyFinancials.ts` (already deprecated)

## Impact
- **Queries reduced**: From ~5-6 per screen to 2-3
- **Files simplified**: 24 files lose dual-table branching logic
- **Bugs eliminated**: "Object visible in dashboard but missing in tasks" class of bugs gone
- **RLS simplified**: Single table = single policy set
- **Maintenance cost**: Every future feature touches 1 table instead of 2

## Risks and Mitigations
- **Data loss**: Migration uses UPSERT; backup before execution
- **FK integrity**: Migration re-points FKs in a single transaction
- **Rollback**: Compatibility view `owner_properties` keeps old queries working temporarily
- **Existing bookings**: `property_bookings.property_id` values migrated to match `properties.id`

