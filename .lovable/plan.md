## Problem (confirmed in code)

Three independent vertical lists drift from each other, breaking handoffs:

| Source | IDs |
|---|---|
| `src/lib/intakeVerticals.ts` (AI intake, 25) | `yachts, properties, owner_properties, tours, water_activities, restaurants, salons, clinics, gyms, vehicles, events, babysitters, cleaning_services, legal_services, pet_services, education_providers, pharmacies, insurance_providers, flower_shops, stores, providers, marketplace_products, marketplace_vendors, vendor_locations` |
| `src/lib/leadVerticalConfig.ts` (Lead form, 14) | `properties, yachts, tours, vehicles, legal, clinics, babysitters, salons, gyms, water_activities, restaurants, other, home_services, property_services` |
| `VendorQuickCreateFAB` + `VendorCategoryGrid` (Manual add, 14) | `beauty, restaurants, transport, yachts, properties, tours, fitness, cleaning, childcare, flowers, health, education, legal, pets` |

Drift examples: `salons↔beauty`, `clinics↔health`, `babysitters↔childcare`, `gyms↔fitness`, `vehicles↔transport`, `legal_services↔legal`, `flower_shops↔flowers`. Vendor org metadata stores any of these — so when the FAB filters by it, vendors who onboarded with `flower_shops` see no Quick-Create entry, and AI intake → manual edit handoff breaks. Missing manual-add: `events`, `pharmacies`, `insurance_providers`, `water_activities` (page or hook exists but no FAB/grid entry).

Property photo bug: `owner/property-wizard/steps/PhotosStep` stores `imageArray[0]` as `cover_image` and `imageArray.slice(1)` as `images`. `VendorProperties.getInitialFormData` passes them as separate fields and `CanonicalPropertyForm` re-merges as `[cover_image, ...images]`. On edit the cover is shown twice; reordering silently swaps the cover.

## Plan

### 1. Single canonical entry registry — `src/lib/verticals/vendorEntries.ts` (NEW)

One list of 18 entries. Each = canonical id (matches DB-table semantics: `salons`, `clinics`, `gyms`, `vehicles`, `babysitters`, `cleaning_services`, `legal_services`, `pet_services`, `education_providers`, `flower_shops`, `pharmacies`, `insurance_providers`, `water_activities`, `events`, `tours`, `yachts`, `restaurants`, `properties`) + `aliases[]` (legacy slugs) + `vendorPath` + Lucide icon + i18n labels + `fabEnabled / gridEnabled / leadEnabled` flags.

Helpers: `resolveVendorAlias(slug) → canonical | null`, `resolveVendorAliases(slugs[]) → canonical[]`, `getVendorEntry(id)`.

### 2. Refactor consumers to read from the registry

- **`VendorQuickCreateFAB`** — delete local `verticalOptions`, build from `VENDOR_ENTRIES.filter(fabEnabled)`. Filter by `resolveVendorAliases(orgMetadata.verticals)` so legacy slugs work.
- **`VendorCategoryGrid`** — delete local `allCategories`, same pattern.
- **Vendor onboarding** verticals checklist (already lists 15 slugs): write through `resolveVendorAlias` so saved metadata stays canonical going forward.

### 3. Property photo fix

- **`src/components/owner/property-wizard/steps/PhotosStep.tsx`**: stop splitting. Hold one ordered `images` array via `updateFormData({ images, cover_image: images[0] || '' })`. Read with `formData.images || []` (no `[cover_image, ...images]` re-merge).
- **`src/pages/vendor/VendorProperties.tsx#getInitialFormData`**: build `images = editingProperty.cover_image ? [cover_image, ...images.filter(u => u !== cover_image)] : (images || [])`. Same on submit: derive `cover_image = data.images?.[0]`.
- **`src/hooks/property-wizard/buildPayload.ts`**: ensure `cover_image = images?.[0]` written on persist.
- Add **"Cover" badge** on first thumbnail in PhotosStep so users know reordering swaps the cover.

### 4. New vendor pages — Pharmacy & Insurance

- **`src/pages/vendor/VendorPharmacy.tsx`** — modeled on `VendorClinics.tsx`. Uses generic `useVerticalCRUD<Pharmacy>('pharmacy', profile?.id)` (registers `'pharmacy'` slug → `pharmacies` table). CRUD form: name EN/RU, description, address, phone, working_hours, delivery_available, is_24h, license_number, cover image + gallery via `UnifiedMediaUploader`.
- **`src/pages/vendor/VendorInsurance.tsx`** — same pattern. Form: name, insurance_types[], languages[], has_24h_support, license_number, address, gallery.
- Add `VendorPharmacy`, `VendorInsurance` lazy entries to `src/components/layout/pageRegistry.ts` and routes `/vendor/pharmacy`, `/vendor/insurance` (under existing `VendorLayout` block) in `AnimatedRoutes.tsx`. These slugs already live in `VERTICALS` registry (`PHARMACY`, `INSURANCE`).

### 5. Lead config alignment — `src/lib/leadVerticalConfig.ts`

- Rename `legal → legal_services` (keep `'legal'` resolvable via `getLeadVerticalById` alias map).
- Add new entries (compact, COMMON_FIELDS-based) for: `flower_shops`, `pet_services`, `education_providers`, `cleaning_services`, `events`, `babysitters` (already there but rename keys to canonical), and keep `restaurants, yachts, tours, vehicles, clinics, gyms, water_activities, properties`.
- `getLeadVerticalById(id)` resolves through `resolveVendorAlias` first.
- Update `detectVerticalFromPath` to use canonical ids.

### 6. Migration — normalize stored vendor metadata

SQL migration that updates `providers.metadata->verticals` and `marketplace_vendors.metadata->verticals` arrays with a `CASE` map: `beauty→salons, childcare→babysitters, health→clinics, medical→clinics, fitness→gyms, transport→vehicles, flowers→flower_shops, flower→flower_shops, legal→legal_services, lawyers→legal_services, pets→pet_services, pet→pet_services, education→education_providers, cleaning→cleaning_services, water→water_activities, watersports→water_activities, pharmacy→pharmacies, insurance→insurance_providers`. Idempotent; written as a `jsonb_set` over a `SELECT` of distinct slugs.

### 7. Consistency tests — extend `src/lib/__tests__/intakeVerticalConsistency.test.ts`

- Every `VENDOR_ENTRIES.id` exists in `INTAKE_VERTICALS` ids.
- Every `fabEnabled` entry has a route in `AnimatedRoutes` (regex scan of file).
- Every `leadEnabled` entry has a `LEAD_VERTICALS` entry by canonical id.
- Every alias resolves to a canonical id (no orphan aliases).

## Files

**New (4):**
- `src/lib/verticals/vendorEntries.ts`
- `src/pages/vendor/VendorPharmacy.tsx`
- `src/pages/vendor/VendorInsurance.tsx`
- `supabase/migrations/<ts>_normalize_vendor_verticals_metadata.sql`

**Edit (8):**
- `src/components/vendor/wizard/VendorQuickCreateFAB.tsx`
- `src/components/vendor/VendorCategoryGrid.tsx`
- `src/components/owner/property-wizard/steps/PhotosStep.tsx`
- `src/pages/vendor/VendorProperties.tsx`
- `src/hooks/property-wizard/buildPayload.ts`
- `src/lib/leadVerticalConfig.ts`
- `src/components/layout/pageRegistry.ts`
- `src/components/layout/AnimatedRoutes.tsx`

**Test (1):**
- `src/lib/__tests__/intakeVerticalConsistency.test.ts`

## Risks / Notes

- No DB schema change — `pharmacies`, `insurance_providers`, `events`, `water_activities` tables already exist with RLS.
- The metadata migration is data-only (allowed via insert tool / migration). If any vendor relied on a non-canonical slug for filtering elsewhere, the alias resolver still accepts it at read-time, so nothing breaks.
- `VendorClinics` etc. are NOT rewritten — the FAB navigates to existing pages with `?create=true`. Each page already responds to "Add" buttons; no per-page change needed.
