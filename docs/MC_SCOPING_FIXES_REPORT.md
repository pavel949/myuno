# MC Scoping Fixes — Vendors / Inventory / Reviews

## FIX 1: VENDORS (`/mc/vendors`)

### Current state (before)
- **Component:** `VendorDirectoryPage.tsx` (route `/mc/vendors`)
- **Hook:** `useOwnerVendors()` in `src/hooks/useOwnerVendors.ts`
- **Table:** `owner_service_vendors`
- **Filter:** Query had **no** application-level filter; RLS policy "Owners manage own vendors" restricted to `owner_id = auth.uid()`, so only the current user’s vendors were visible. Create always set `owner_id: user.id`.
- **Schema:** Table had `owner_id` only; **no `company_id`**.

### Migration SQL
- Added column: `company_id uuid REFERENCES management_companies(id) ON DELETE SET NULL` (nullable).
- Index: `idx_owner_service_vendors_company_id` on `company_id`.
- RLS: Kept "Owners manage own vendors" (owner_id = auth.uid()). Added "MC members access company vendors" — USING/WITH CHECK: `company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid() AND is_active = true)`.

Full migration: `supabase/migrations/20260304120000_mc_scoping_vendors_inventory_reviews.sql`.

### Updated hook code
- `useOwnerVendors` now uses `useActiveCompany()`.
- **Query:** If `activeCompany?.company_id` is set → `.eq('company_id', companyId)`; else → `.eq('owner_id', user.id)`.
- **Create:** If `companyId` is set, insert includes `company_id: companyId`; `owner_id` remains the current user (creator).
- Query key includes `companyId` so cache is correct when switching companies.

### RLS policy SQL
Included in the same migration: policy "MC members access company vendors" as above.

### Component changes
- None. `VendorDirectoryPage` continues to use `useOwnerVendors()`; no props or UI changes.

**Status:** ⚠️ Migration required — schema + hook + RLS.

---

## FIX 2: INVENTORY (`/mc/inventory`)

### Current state (before)
- **Component:** `InventoryPage.tsx` (route `/mc/inventory`)
- **Data:** Inline `useQuery` in the page (no dedicated hook for list).
- **Table:** `property_inventory_items` (has `property_id`, `owner_id`).
- **Filter:** `.eq('owner_id', user!.id)` — only the current user’s inventory.

### Migration SQL
- **No schema change.** Table already has `property_id`; inventory is per-property.
- **RLS:** Added policy "MC members manage company property inventory" — USING/WITH CHECK: `property_id IN (SELECT id FROM properties WHERE management_company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid() AND is_active = true))`.
- Existing policy "Owners can manage their property inventory" (via `owner_properties`) unchanged.

### Updated hook / page code
- **InventoryPage:** Uses `useMyProperties()` → `allPropertyIds = allProperties.map(p => p.property_id)`.
- **Query:** Replaced `.eq('owner_id', user!.id)` with `.in('property_id', allPropertyIds)`. If `allPropertyIds.length === 0`, query is disabled and returns `[]`.
- **Create (add item):** Still sends `owner_id: user!.id` (required by table); RLS allows insert when the property is in the user’s accessible set (owner or MC).

### RLS policy SQL
In same migration: "MC members manage company property inventory" as above.

### Component changes
- `InventoryPage.tsx`: list query now scoped by `allPropertyIds` from `useMyProperties()`.

**Status:** ✅ Complete from app side — no schema change; RLS + component only.

---

## FIX 3: REVIEWS (`/mc/reviews-management`)

### Current state (before)
- **Component:** `ReviewsManagementPage.tsx` (route `/mc/reviews-management`)
- **Table:** `property_reviews` (has `property_id`, `owner_id`).
- **Filter:** `.eq('owner_id', user!.id)` — only reviews for properties owned by the current user.

### Migration SQL
- **No schema change.**
- **RLS:** Added policy "MC members manage company property reviews" — USING/WITH CHECK: same pattern as inventory, `property_id IN (SELECT id FROM properties WHERE management_company_id IN (...))`.
- Existing "Owners manage own reviews" (owner_id = auth.uid()) unchanged.

### Updated hook / page code
- **ReviewsManagementPage:** Uses `useMyProperties()` → `allPropertyIds`.
- **Query:** Replaced `.eq('owner_id', user!.id)` with `.in('property_id', allPropertyIds)`. If `allPropertyIds.length === 0`, query disabled, returns `[]`.
- Respond mutation unchanged; RLS allows update for company property reviews.

### RLS policy SQL
In same migration: "MC members manage company property reviews" as above.

### Component changes
- `ReviewsManagementPage.tsx`: reviews query now scoped by `allPropertyIds` from `useMyProperties()`.

**Status:** ✅ Complete from app side — no schema change; RLS + component only.

---

## Validation checklist

1. **Apply migration:** Run `supabase db push` or apply `20260304120000_mc_scoping_vendors_inventory_reviews.sql` on your Supabase project.
2. **Log in as MC staff** (e.g. role `staff` or `manager`, not company owner).
3. **/mc/vendors:** See all vendors for the active company; create a vendor → row has `company_id` set.
4. **/mc/inventory:** See all inventory for company properties (not empty).
5. **/mc/reviews-management:** See all reviews for company properties.
6. **Isolation:** In another company, the same user (if in two companies) or another user must **not** see the first company’s vendors/inventory/reviews (RLS enforces this).

---

## Files changed

| File | Change |
|------|--------|
| `supabase/migrations/20260304120000_mc_scoping_vendors_inventory_reviews.sql` | New: vendor `company_id`, index, RLS for vendors/inventory/reviews |
| `src/hooks/useOwnerVendors.ts` | useActiveCompany; query/create by company_id when in MC |
| `src/pages/owner/InventoryPage.tsx` | List query by allPropertyIds from useMyProperties |
| `src/pages/owner/ReviewsManagementPage.tsx` | Reviews query by allPropertyIds from useMyProperties |
| `src/integrations/supabase/types.ts` | Added `company_id` to owner_service_vendors Row/Insert/Update |
