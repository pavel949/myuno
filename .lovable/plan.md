

# Code Review: Agent Message Intake Flow

## Current Status

The two critical bugs (rows→records, data.success→data.inserted) are **fixed**. CRM contact creation and cloud image extraction are **implemented**. The overall flow structure is correct.

## Remaining Issue Found: Table Name Mismatch

There is a **table name mismatch** between the edge function's vertical detection and the frontend's validation that will cause approval failures for certain verticals.

**Edge function** (`intake-listing-agent/index.ts` lines 30-38) defines these verticals:
- `cleaning_services` — but `VALID_INTAKE_TABLES` and `bulk-import` expect `cleaning_providers`
- `legal_services` — but mapping expects `lawyers`
- `education_providers` — but mapping expects `education_centers`
- `pharmacies` — not in `VALID_INTAKE_TABLES` at all
- `insurance_providers` — not in `VALID_INTAKE_TABLES` at all
- `stores` — not in `VALID_INTAKE_TABLES` at all
- `events` — not in `VALID_INTAKE_TABLES` at all
- `vendor_locations` — not in `VALID_INTAKE_TABLES` at all

When the AI detects a cleaning service listing, it assigns `detectedVertical: 'cleaning_services'`. On approval, `isValidIntakeTable('cleaning_services')` returns **false**, and the listing is rejected with an error toast.

### Fix

Two changes needed:

1. **`supabase/functions/intake-listing-agent/index.ts`** — Fix `STATIC_VERTICALS` entries to use actual DB table names:
   - `cleaning_services` → `cleaning_providers`
   - `legal_services` → `lawyers`
   - `education_providers` → `education_centers`
   - Remove or remap `pharmacies`, `insurance_providers`, `stores`, `events`, `vendor_locations` (these tables don't exist in `PROVIDER_ID_MAPPING`)

2. **`src/lib/providerIdMapping.ts`** — Add any actually-existing tables that are missing (e.g., if `events` table exists in DB, add it to the mapping). Otherwise the edge function shouldn't suggest verticals that can't be imported.

### Impact
- **Properties** (the main agent use case): Works fine — `properties` is correctly mapped
- **Other verticals**: 8 out of 22 static verticals have wrong or missing table names and will fail on approval

### Effort
~10 minutes — rename table IDs in the static fallback array and optionally extend `PROVIDER_ID_MAPPING`.

