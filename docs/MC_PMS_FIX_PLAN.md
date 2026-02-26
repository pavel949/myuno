# MC / PMS Fix Plan — Engineering Design Document

**Date:** 2026-02-26  
**Status:** Plan only. No code changes.  
**Based on:** `docs/AUDIT_MC_PMS.md`

---

## A. Problem Statement

### 5 Critical Issues

| # | Issue | Symptom in UI | Symptom in Data |
|---|-------|---------------|-----------------|
| 1 | **MC commission terms never executed** | MC director sees 0 revenue from managed properties | `property_management_terms` rows exist but are never read by `record_ledger_entries` or any calculation path |
| 2 | **MC users can't see portfolio bookings** | Bookings page empty for MC-managed (non-owned) properties | `useAllPropertyBookings` queries `owner_properties.owner_id = user.id` only |
| 3 | **MC users can't see portfolio financials** | Financial dashboard empty for MC-managed properties | `usePropertyFinancialsFull` filters `owner_id = user.id`; `getAccessiblePropertyIds` checks `owner_properties` + `property_delegates` but NOT `management_company_members` |
| 4 | **Staff is owner-scoped, not company-scoped** | MC director only sees staff they personally created, not company-wide staff | `staff_members.owner_id` has no FK/reference to `management_companies`; `useStaffMembers` filters `owner_id = user.id` |
| 5 | **iCal sync drops date updates** | External booking date changes silently ignored, calendar shows stale data | Edge function checks `external_id` existence and skips if found; no UPSERT logic for date/price changes |

---

## B. Target Behavior (Definition of Done)

### MC Director
- [ ] Sees ALL properties linked to their active MC (`properties.management_company_id = activeCompanyId`)
- [ ] Sees ALL bookings for those properties in calendar, timeline, and booking list
- [ ] Sees aggregated financials (income/expenses) across MC portfolio
- [ ] Revenue dashboard shows correct occupancy, ADR, RevPAR for MC portfolio
- [ ] Sees company-wide staff (all staff created by any MC member)
- [ ] Commission terms are applied in ledger: MC receives its cut per `property_management_terms`
- [ ] iCal-sourced bookings update when external calendar events change dates

### MC Staff (Manager/Accountant)
- [ ] Same portfolio visibility as Director (scoped by active company)
- [ ] Can create/edit bookings for MC properties
- [ ] Can record financials for MC properties
- [ ] Cannot modify MC settings or commission terms (Director only)

### Individual Owner (no MC)
- [ ] **No regression**: sees only personally owned + delegated properties
- [ ] Financials, bookings, staff all continue to work via `owner_id` path
- [ ] If property IS linked to an MC, owner still sees it in their view

---

## C. Data Access Model — Single Source of Truth

### New utility: `getAccessiblePropertyIds`

**Location:** `src/lib/getAccessiblePropertyIds.ts` (extracted, shared)

```typescript
interface AccessiblePropertyIdsInput {
  userId: string;
  activeCompanyId: string | null; // from useActiveCompany
}

interface AccessiblePropertyIdsResult {
  ownedIds: string[];      // properties.owner_id = userId
  delegatedIds: string[];  // property_delegates.user_id = userId (active)
  companyIds: string[];    // properties.management_company_id = activeCompanyId
  allIds: string[];        // deduplicated union
}
```

**Rules:**
1. `ownedIds` ← `SELECT id FROM properties WHERE owner_id = $userId`
2. `delegatedIds` ← `SELECT property_id FROM property_delegates WHERE user_id = $userId AND status = 'active'`
3. `companyIds` ← IF user is member of `activeCompanyId` (verified via `management_company_members`), THEN `SELECT id FROM properties WHERE management_company_id = $activeCompanyId`
4. `allIds` = `UNION(ownedIds, delegatedIds, companyIds)` deduplicated

**Edge cases:**
- `activeCompanyId = null` → skip step 3 (individual owner mode)
- User is member of MC but MC has 0 properties → `companyIds = []`
- Property owned by user AND linked to their MC → appears once (dedup)
- User switches companies → `companyIds` changes, queries re-fetch via new React Query key

**Alternative (DB RPC):** Create `get_accessible_property_ids(p_user_id uuid, p_company_id uuid)` as a `SECURITY DEFINER` function. Pros: single round-trip, enforceable at DB level. Cons: harder to debug, requires migration. **Recommendation: Start with client-side utility (Phase 1), migrate to RPC (Phase 2) if performance warrants.**

---

## D. Code Refactor Plan (Frontend)

### D.1 — New shared utility

| Action | File |
|--------|------|
| **CREATE** | `src/lib/getAccessiblePropertyIds.ts` |

Extract logic from `usePropertyFinancials.getAccessiblePropertyIds` and `usePropertyCare.getUserPropertyIds` into one shared function that accepts `activeCompanyId`.

### D.2 — Hook-by-hook changes

#### `useAllPropertyBookings` (`src/hooks/usePropertyBookings.ts:374-474`)
| Aspect | Current | Target |
|--------|---------|--------|
| Property IDs source | `owner_properties WHERE owner_id = user.id` | `getAccessiblePropertyIds(user.id, activeCompanyId)` |
| Query key | `['all-property-bookings', user?.id]` | `['all-property-bookings', user?.id, activeCompanyId]` |
| Dependency | `useAuth` only | Add `useActiveCompany` |
| Property lookup for enrichment | `owner_properties` by ID | `properties` table (or unified view) |

#### `usePropertyBookings` (`src/hooks/usePropertyBookings.ts:82-149`)
| Aspect | Current | Target |
|--------|---------|--------|
| Access check | `owner_properties.owner_id` + `property_delegates` | `getAccessiblePropertyIds(user.id, activeCompanyId)` |
| Query key | `['property-bookings', user?.id, propertyId]` | `['property-bookings', user?.id, activeCompanyId, propertyId]` |

#### `usePropertyFinancialsFull` (`src/hooks/usePropertyFinancials.ts:90-113`)
| Aspect | Current | Target |
|--------|---------|--------|
| Filter | `.eq('owner_id', user.id)` | `.in('property_id', allIds)` from `getAccessiblePropertyIds` |
| Property join | `owner_properties(id, title, title_ru)` | `properties(id, title_en, title_ru)` |
| Query key | `['property-financials-full', user?.id, propertyId]` | `['property-financials-full', user?.id, activeCompanyId, propertyId]` |

#### `getAccessiblePropertyIds` (`src/hooks/usePropertyFinancials.ts:125-147`)
| Aspect | Current | Target |
|--------|---------|--------|
| Sources | `owner_properties` + `property_delegates` | **Replace** with shared `getAccessiblePropertyIds` from `src/lib/` |

#### `useFinancialStats` (`src/hooks/usePropertyFinancials.ts:229-296`)
| Aspect | Current | Target |
|--------|---------|--------|
| Property IDs | `getAccessiblePropertyIds(user.id)` (old, no MC) | New shared version with `activeCompanyId` |
| Query key | Add `activeCompanyId` |

#### `usePropertyFinancialsPaginated` (`src/hooks/usePropertyFinancials.ts:149-196`)
| Same pattern as above |

#### `usePropertyFinancialsCount` (`src/hooks/usePropertyFinancials.ts:201-227`)
| Same pattern as above |

#### `useRevenueAnalytics` (`src/hooks/useRevenueAnalytics.ts`)
| Aspect | Current | Target |
|--------|---------|--------|
| Properties source | `useOwnerProperties()` (owner_id only) | `useMyProperties().allProperties` |
| Financials | `usePropertyFinancialsFull()` (owner_id only) | Already fixed after D.2 above |
| Bookings | `useAllPropertyBookings()` | Already fixed after D.2 above |

#### `useStaffMembers` (`src/hooks/useStaffMembers.ts:41-57`)
| Aspect | Current | Target |
|--------|---------|--------|
| Filter | `.eq('owner_id', user!.id)` | `.eq('owner_id', user!.id)` OR if `activeCompanyId`: `.eq('company_id', activeCompanyId)` |
| Query key | `['staff-members', user?.id]` | `['staff-members', user?.id, activeCompanyId]` |
| Requires migration | Yes — add `company_id` column to `staff_members` |

#### `useAllStaffMembers` (`src/hooks/useStaffMembers.ts:60-76`)
| Same as above |

#### `useCreateStaffMember` (`src/hooks/useStaffMembers.ts:78-103`)
| Change | Auto-set `company_id` from `activeCompany.company_id` if user is MC member |

#### `usePropertyCare.getUserPropertyIds` (`src/hooks/usePropertyCare.ts:28-37`)
| Aspect | Current | Target |
|--------|---------|--------|
| Sources | `properties.owner_id` + `property_manager_assignments` | **Replace** with shared `getAccessiblePropertyIds` |

### D.3 — Dashboard components consuming these hooks

| Component | Hook(s) Used | Change Required |
|-----------|-------------|-----------------|
| `ActiveStaysWidget` | `useAllPropertyBookings`, `useOwnerProperties` | Switch to `useMyProperties` |
| `TodayBriefingWidget` | `useAllPropertyBookings`, `useOwnerProperties` | Switch to `useMyProperties` |
| `BookingSearchBar` | `useAllPropertyBookings` | No change (hook is fixed upstream) |
| `MoneyBlock` | `useFinancialStats` | No change (hook is fixed upstream) |
| `FinancesSummary` | `useFinancialStats` | No change (hook is fixed upstream) |
| `OwnerPortfolio` | `useOwnerProperties`, `usePropertyFinancialsFull`, `useAllPropertyBookings` | Switch properties to `useMyProperties` |
| `OwnerRevenueDashboard` | `useRevenueAnalytics` | No change (hook is fixed upstream) |
| `CashFlowForecast` | `getAccessiblePropertyIds` (imported) | Update import to new shared location |

---

## E. Backend Plan (DB / RPC / Triggers)

### E.1 — Staff Members: add `company_id`

```sql
-- Migration: Add company_id to staff_members
ALTER TABLE public.staff_members 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES management_companies(id);

CREATE INDEX IF NOT EXISTS idx_staff_members_company 
  ON staff_members(company_id);

-- Backfill: for each staff member, find owner's MC membership and set company_id
UPDATE staff_members sm
SET company_id = mcm.company_id
FROM management_company_members mcm
WHERE mcm.user_id = sm.owner_id
  AND mcm.is_active = true
  AND sm.company_id IS NULL;
```

### E.2 — Commission Execution in Ledger

**Precedence rules:**
1. `property_management_terms` for the specific property (status = 'active') → highest priority
2. `management_companies.default_commission_rate` → fallback
3. If neither exists → MC gets 0 (all goes to vendor/owner)

**Where calculation runs:** Inside `record_ledger_entries` RPC (DB function). This is the single point of financial truth.

**Modified `record_ledger_entries` logic:**
```
After calculating v_vendor_amount:
1. Look up property_id from order_items
2. Look up active property_management_terms for that property_id
3. If found: mc_commission = v_vendor_amount * terms.commission_rate / 100
4. Else: look up management_companies.default_commission_rate via properties.management_company_id
5. If mc_commission > 0:
   - Create/get MC ledger account (new account_type: 'mc_balance', keyed by management_company_id)
   - Split v_vendor_amount: owner gets (v_vendor_amount - mc_commission), MC gets mc_commission
   - Entry 3: debit customer → credit mc_balance (mc_commission)
   - Adjust Entry 2: vendor_payment amount = v_vendor_amount - mc_commission
```

**New ledger account type:** `'mc_balance'`

**Decision on MC→Ledger bridge:**

| Option | Pros | Cons |
|--------|------|------|
| A: Map MC → `orgs` | Reuses existing `owner_org_id` on `ledger_accounts` | Requires creating `org` per MC; complex migration; `orgs` table has different semantics |
| B: Add `management_company_id` to `ledger_accounts` | Clean separation; no org pollution; simple | New column; minor schema change |

**Recommendation: Option B** — Add `management_company_id` column to `ledger_accounts`. Simpler, less risk.

```sql
ALTER TABLE public.ledger_accounts 
  ADD COLUMN IF NOT EXISTS management_company_id uuid REFERENCES management_companies(id);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_mc 
  ON ledger_accounts(management_company_id);
```

### E.3 — iCal Sync: UPSERT Logic

**Current:** Edge function checks if `external_id` exists in orders metadata → skips if found.

**Target:** If same `external_id` exists but dates differ → UPDATE existing order's `start_at`, `end_at`, `total_amount`.

**Implementation:** In `supabase/functions/ical-sync/index.ts`:
```
For each parsed VEVENT:
1. Search for existing order with metadata->external_id = UID
2. If NOT found → INSERT (current logic)
3. If FOUND:
   a. Compare start_at/end_at with VEVENT DTSTART/DTEND
   b. If dates changed → UPDATE order start_at, end_at, recalculate total_amount
   c. If VEVENT STATUS = CANCELLED → UPDATE order status = 'cancelled'
   d. Log update action in ical_sync_logs
```

### E.4 — RLS Adjustments

After adding `company_id` to `staff_members`:
```sql
-- Allow MC members to see company staff
CREATE POLICY "mc_members_view_company_staff" ON staff_members
  FOR SELECT USING (
    owner_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM management_company_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

For `property_financials` — currently filtered by `owner_id` in app code. If we switch to `property_id IN (accessible)`, RLS must allow MC members to read:
```sql
-- Allow MC members to read financials for MC properties
CREATE POLICY "mc_members_view_property_financials" ON property_financials
  FOR SELECT USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );
```

---

## F. Data Migration

### F.1 — `staff_members.company_id` backfill

See E.1 above. Steps:
1. Add nullable column `company_id`
2. Backfill from `management_company_members` (owner → their MC)
3. Going forward: `useCreateStaffMember` sets `company_id` from `activeCompany`

### F.2 — `ledger_accounts.management_company_id`

1. Add nullable column
2. No backfill needed (new entries will use it)
3. Historical MC entries: can be backfilled later if needed for reporting

### F.3 — No destructive changes

All migrations are additive (ADD COLUMN, CREATE INDEX, CREATE POLICY). No data loss risk.

---

## G. UX Fix Plan

| # | Issue | Resolution |
|---|-------|------------|
| 1 | MC bookings invisible | Fix `useAllPropertyBookings` to include MC properties → bookings appear automatically |
| 2 | Revenue dashboard empty for MC | Fix `useRevenueAnalytics` data sources → metrics populate |
| 3 | Financial stats empty | Fix `getAccessiblePropertyIds` → stats show MC portfolio |
| 4 | Staff invisible across MC | Add `company_id` filter → company-wide staff visible |
| 5 | Payout balance not shown | Add placeholder card: "Payouts — Coming Soon" with current `vendor_balance` / `mc_balance` from ledger. No payout workflow yet. |
| 6 | iCal sync status invisible | Add minimal sync status indicator on property detail page (last sync time, error count from `ical_sync_logs`). Phase 4. |
| 7 | Empty state messaging | When MC has 0 properties: show "Add your first property" CTA instead of blank |

---

## H. Test Plan

### H.1 — DB-level sanity checks

```sql
-- After E.2: Verify MC commission split
-- Create test order → confirm → check ledger has 3 entries (platform, owner, MC)
SELECT entry_type, amount FROM ledger_entries WHERE order_id = '<test_order_id>';
-- Expected: platform_fee, vendor_payment (reduced), mc_commission (new)

-- After E.1: Verify staff backfill
SELECT count(*) FROM staff_members WHERE company_id IS NOT NULL;
-- Should be > 0 if any staff owners are MC members
```

### H.2 — Integration tests (happy path)

| Test | Steps | Expected |
|------|-------|----------|
| MC director sees portfolio bookings | Login as MC director → navigate to bookings | All bookings for MC properties visible |
| MC director sees financials | Navigate to financials page | Transactions for all MC properties shown |
| MC director sees staff | Navigate to staff page | All staff with matching `company_id` shown |
| Company switcher changes data | Switch to different MC → check bookings | Bookings refresh to new MC's properties |
| Individual owner unaffected | Login as owner without MC → check all pages | Same behavior as before |

### H.3 — Role-based access tests

| Scenario | Actor | Expected |
|----------|-------|----------|
| MC Director views other MC's data | Director of MC-A | Cannot see MC-B properties/bookings/financials |
| MC Staff creates booking | Staff member | Can create for MC properties |
| MC Staff edits terms | Staff member | Cannot edit commission terms (Director only) |
| Owner without MC | Individual owner | Sees only owned + delegated properties |
| Owner WITH MC | Owner who is also MC member | Sees personal + MC properties (deduplicated) |

### H.4 — iCal update tests

| Scenario | Expected |
|----------|----------|
| Same UID, dates changed | Existing order updated with new dates |
| Same UID, cancelled status | Order status set to cancelled |
| Same UID, no changes | No update, no duplicate |
| New UID | New order created |

### H.5 — Regression checklist

- [ ] Owner-only bookings page still works
- [ ] Owner financials page still works
- [ ] Owner staff page still works
- [ ] Property creation still auto-links to MC
- [ ] Booking creation still triggers `property_bookings` record
- [ ] Ledger entries for non-MC orders unchanged (2 entries: platform + vendor)
- [ ] Calendar view shows correct bookings
- [ ] `useMyProperties` dedup still works
- [ ] Company switcher persists selection
- [ ] Revenue dashboard loads for owners without MC

---

## I. Rollout Plan

### Phase 1: Access Layer + Dashboard Visibility
**Risk: Low | Impact: High**

1. Create `src/lib/getAccessiblePropertyIds.ts`
2. Refactor `useAllPropertyBookings` to use new utility
3. Refactor `usePropertyFinancialsFull`, `useFinancialStats`, `usePropertyFinancialsPaginated`, `usePropertyFinancialsCount`
4. Refactor `useRevenueAnalytics` to use `useMyProperties`
5. Update dashboard components (`ActiveStaysWidget`, `TodayBriefingWidget`, `OwnerPortfolio`)
6. Add RLS policy for `property_financials` MC member access
7. **Checkpoint:** MC director can see bookings + financials for MC portfolio

### Phase 2: Staff Scoping
**Risk: Low | Impact: Medium**

1. Migration: add `company_id` to `staff_members`
2. Backfill `company_id`
3. Update `useStaffMembers` / `useCreateStaffMember` to use `company_id`
4. Add RLS policy for company staff access
5. **Checkpoint:** MC director sees all company staff

### Phase 3: Commission → Ledger Integration
**Risk: Medium | Impact: High**

1. Migration: add `management_company_id` to `ledger_accounts`
2. Update `record_ledger_entries` RPC to split MC commission
3. Add payout balance placeholder UI
4. **Checkpoint:** New confirmed bookings create 3-way split in ledger (platform + owner + MC)

### Phase 4: iCal Update Handling + Sync Status UI
**Risk: Medium | Impact: Medium**

1. Update `ical-sync` Edge Function with UPSERT logic
2. Add sync status indicator on property detail page
3. **Checkpoint:** External date changes reflected in orders; sync errors visible

---

## File Map

| Action | File | Phase |
|--------|------|-------|
| **CREATE** | `src/lib/getAccessiblePropertyIds.ts` | 1 |
| MODIFY | `src/hooks/usePropertyBookings.ts` — `useAllPropertyBookings`, `usePropertyBookings` | 1 |
| MODIFY | `src/hooks/usePropertyFinancials.ts` — all hooks + remove old `getAccessiblePropertyIds` | 1 |
| MODIFY | `src/hooks/useRevenueAnalytics.ts` — switch to `useMyProperties` | 1 |
| MODIFY | `src/hooks/usePropertyCare.ts` — `getUserPropertyIds` → shared utility | 1 |
| MODIFY | `src/components/owner/dashboard/ActiveStaysWidget.tsx` | 1 |
| MODIFY | `src/components/owner/dashboard/TodayBriefingWidget.tsx` | 1 |
| MODIFY | `src/pages/owner/OwnerPortfolio.tsx` | 1 |
| MODIFY | `src/components/owner/financials/CashFlowForecast.tsx` — import path | 1 |
| MODIFY | `src/hooks/usePropertyReports.ts` — import path | 1 |
| MODIFY | `src/hooks/usePropertyBudgets.ts` — import path | 1 |
| **MIGRATION** | Add RLS: `mc_members_view_property_financials` | 1 |
| **MIGRATION** | `staff_members` ADD `company_id` + backfill | 2 |
| **MIGRATION** | RLS: `mc_members_view_company_staff` | 2 |
| MODIFY | `src/hooks/useStaffMembers.ts` | 2 |
| **MIGRATION** | `ledger_accounts` ADD `management_company_id` | 3 |
| **MIGRATION** | Update `record_ledger_entries` RPC | 3 |
| MODIFY | `supabase/functions/ical-sync/index.ts` | 4 |

## SQL Migration Checklist

- [ ] Phase 1: RLS policy `mc_members_view_property_financials` on `property_financials`
- [ ] Phase 2: `ALTER TABLE staff_members ADD COLUMN company_id`
- [ ] Phase 2: Backfill `staff_members.company_id`
- [ ] Phase 2: RLS policy `mc_members_view_company_staff` on `staff_members`
- [ ] Phase 3: `ALTER TABLE ledger_accounts ADD COLUMN management_company_id`
- [ ] Phase 3: Update `record_ledger_entries` function
- [ ] Phase 3: Index on `ledger_accounts(management_company_id)`

## QA Checklist

- [ ] MC director sees all MC property bookings
- [ ] MC director sees aggregated financials
- [ ] MC director sees company-wide staff
- [ ] Individual owner sees only own data (no regression)
- [ ] Company switcher changes all data views
- [ ] New booking creates correct ledger entries (3-way split)
- [ ] iCal date changes update existing orders
- [ ] Revenue dashboard shows correct metrics for MC portfolio
- [ ] No N+1 queries introduced
- [ ] React Query keys include `activeCompanyId` where needed
