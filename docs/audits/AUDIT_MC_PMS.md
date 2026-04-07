# Management Companies (MC / PMS) — Deep Structural Audit

**Date:** 2026-02-26  
**Status:** Analysis only. No code changes.

---

## A. DATA ARCHITECTURE

### Core Tables

#### `management_companies`
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | no | gen_random_uuid() |
| slug | text UNIQUE | no | |
| name_en / name_ru | text | no | |
| description_en / description_ru | text | yes | |
| logo, cover_image | text | yes | |
| phone, email, website, whatsapp | text | yes | |
| address, district | text | yes | |
| languages, services | text[] | yes | |
| founded_year | int | yes | |
| properties_count | int | yes | Auto-updated by trigger `trg_mc_properties_count` |
| rating, review_count | numeric/int | yes | |
| is_verified, is_active, is_featured | bool | yes | |
| license_number, tax_id | text | yes | Added via consolidation migration |
| service_districts | text[] | yes | |
| has_24_7_support, has_emergency_service | bool | yes | |
| default_commission_rate | numeric | yes | |
| min_contract_months | int | yes | |
| director_name | text | yes | |
| provider_id | uuid FK→providers | yes | UNIQUE. Auto-synced via trigger `sync_provider_to_management_company` |
| created_by | uuid | yes | |
| created_at, updated_at | timestamptz | no | |

**RLS:** Public read (is_active=true), members can update, admins full access.  
**Triggers:** `update_management_companies_updated_at`, `trg_mc_properties_count` (on properties table).

#### `management_company_members`
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid PK | no |
| company_id | uuid FK→management_companies | no |
| user_id | uuid FK→auth.users | no |
| role | text | no | Default 'member'. Values: director, admin, manager, staff, accountant, member |
| is_active | bool | no | Default true |
| created_at | timestamptz | no |

**RLS:** Members see own company members, admins see all.  
**Indexes:** `idx_mc_members_user` on user_id.

#### `properties` (relevant columns)
| Column | Notes |
|--------|-------|
| management_company_id | uuid FK→management_companies. Nullable. |
| owner_id | uuid. The individual owner. |
| provider_id | uuid FK→providers. |

**Index:** `idx_properties_management_company`.  
**Trigger:** `trg_mc_properties_count` — auto-increments/decrements `management_companies.properties_count` on INSERT/UPDATE/DELETE.

#### `property_management_terms`
Per-property commission/revenue split definitions between owner and manager.  
Key fields: `property_id`, `manager_user_id`, `commission_rate`, `commission_type` (percent/fixed), `commission_base` (gross/net), `revenue_split_owner`, `revenue_split_manager`, `expense_responsibility` (JSONB), `status` (draft/active/pending_approval/archived).

#### `property_bookings`
Created automatically via trigger `trg_create_property_booking` when an order with `vertical='property'` transitions to `status='confirmed'`.  
Links to `orders` via `order_id` column.

#### `property_financials`
Manual income/expense tracking per property. Filtered by `owner_id` (⚠️ see bugs).

#### `ledger_accounts` / `ledger_entries`
Double-entry ledger. Account types: `platform_revenue`, `customer`, `vendor_balance`, `wallet`, `platform_cashback`, `escrow`, `refund_reserve`.  
`record_ledger_entries(p_order_id)` RPC creates 3 entries per confirmed order.

#### `vertical_commission_rules`
Platform-wide commission rates per vertical. Used by `calculate_order_totals` RPC.

#### `agent_deals`
Sales CRM for MC agents. FK to `management_companies` via `company_id`.

#### `staff_members` / `staff_property_assignments`
Separate staff registry (cleaners, maintenance, etc.) with property assignments. Scoped by `owner_id`.

---

### Entity Relationships (Text-based ERD)

```
auth.users
  ├─→ management_company_members.user_id
  ├─→ properties.owner_id
  ├─→ staff_members.owner_id
  └─→ agent_deals.agent_id

management_companies
  ├─← management_company_members.company_id
  ├─← properties.management_company_id
  ├─← agent_deals.company_id
  ├─← deal_pipeline_stages.company_id
  └─→ providers.id (via provider_id, UNIQUE, bi-directional sync trigger)

properties
  ├─← property_bookings.property_id
  ├─← property_financials.property_id
  ├─← property_management_terms.property_id
  ├─← property_manager_assignments.property_id
  ├─← staff_property_assignments.property_id
  └─← order_items.resource_id (via orders vertical='property')

orders
  ├─← order_items
  ├─← order_participants
  ├─← ledger_entries.order_id
  └──→ property_bookings.order_id (via trigger)

ledger_accounts
  └─← ledger_entries (debit/credit)
```

### Duplicated Tables
| Issue | Details |
|-------|---------|
| `property_management_companies` | **Dropped.** Was migrated into `management_companies` via migration `20260224062307`. ✅ Resolved. |
| `products` vs `marketplace_products` | `products` is legacy/empty. Marked for drop. |
| `owner_properties` vs `properties` | `owner_properties` is a **VIEW** (v_owner_properties). Some hooks query it directly — creates confusion but not a bug. |

### Unused / Orphan Relationships
| Issue | Severity |
|-------|----------|
| `staff_members` is scoped by `owner_id` but has NO FK to `management_companies`. MC directors can't see company staff — only personally-created staff. | **High** |
| `property_financials.owner_id` — finances only visible to owner, not MC members. | **High** |
| `ledger_accounts.owner_org_id` references `orgs` table, but MC uses `management_companies` — no direct link between MC and ledger. | **Medium** |
| `management_terms_activity` tracks changes but has no MC-level aggregation. | Low |

---

## B. BUSINESS LOGIC FLOW

### 1. MC Onboarding

**How created:** Admin creates MC via `usePMCompanies` → `supabase.from('management_companies').insert()`. Alternatively, auto-created when a provider with `business_category='property_management'` is added (trigger `sync_provider_to_management_company`).

**Relations formed:** Admin manually adds members via `MCMemberManager` component → inserts into `management_company_members`.

**Permissions:** MC role field (`director`, `admin`, `manager`, `staff`, etc.) is stored in `management_company_members.role`. Access checks happen in:
- `useOwnerAccess` — checks `is_verified` + `properties_count > 0`
- `useActiveCompany` — fetches user's MC memberships
- Various sidebar guards

⚠️ **Gap:** No onboarding wizard for MC self-registration. Only admin can create.  
⚠️ **Gap:** No email verification or approval workflow for MC membership.

### 2. Property Assignment to MC

**How linked:** `properties.management_company_id` is set during property creation (`useCreateOwnerProperty` auto-detects user's MC membership) or manually by admin.

**Ownership enforcement:** None. Any admin can assign any property to any MC. No validation that the property owner agreed.

⚠️ **Gap:** Property can have `owner_id` AND `management_company_id` pointing to unrelated entities. No constraint enforces the relationship.

### 3. Booking Creation

**Origin:** 
1. **Manual** — `usePropertyBookings.createBooking` → inserts into `orders` table with `vertical='property'`
2. **Marketplace** — `create_order_atomic` RPC
3. **iCal Sync** — `ical-sync` Edge Function → creates orders with `source='ical'`

**Status transitions:** `draft → pending → confirmed → completed` or `→ cancelled`. Trigger `trg_create_property_booking` fires on `confirmed`.

⚠️ **Gap:** `usePropertyBookings` queries `owner_properties` (view) for access check, but `useAllPropertyBookings` does NOT include MC company properties — only `owner_id` filtered. MC staff can't see all portfolio bookings via this hook.

### 4. Commission Calculation

**Platform commission:** Defined in `vertical_commission_rules` table per vertical. Calculated by `calculate_order_totals` RPC (DB function). Fallback: 10% hardcoded in `src/lib/calculateOrderTotals.ts`.

**MC commission (owner→MC):** Defined per-property in `property_management_terms` table. Fields: `commission_rate`, `commission_type` (percent/fixed), `commission_base` (gross/net).

⚠️ **Critical gap:** MC commission from `property_management_terms` is **never actually used in any calculation**. The terms are stored but not connected to the booking pipeline, ledger, or payout logic. It's a configuration UI with no execution engine.

⚠️ **Risk:** `default_commission_rate` on `management_companies` table is separate from `property_management_terms.commission_rate`. Dual source of truth.

### 5. Payment → Ledger → Supplier Balance

**Ledger flow (`record_ledger_entries`):**
1. Creates/gets `platform_revenue` account
2. Creates/gets `customer` account (by `customer_user_id`)
3. Creates/gets `vendor_balance` account (by `provider_org_id`)
4. Inserts 3 entries: customer→platform (total), platform→vendor (vendor amount), platform→platform (commission)

⚠️ **Critical:** `provider_org_id` on orders maps to `orgs` table, NOT `management_companies`. MCs that are not linked to a provider/org will have **no ledger entries**.

⚠️ **Not implemented:** Supplier payout calculation. No payout table, no payout schedule, no bank account storage for MCs. The `vendor_balance` ledger account accumulates but is never paid out.

⚠️ **Not implemented:** `property_management_terms.expense_responsibility` JSONB is stored but never used to split expenses in financials.

### 6. iCal Sync

**Flow:** `ical-sync` Edge Function → fetches iCal feed URLs from `external_calendars` → parses VEVENT → upserts into `orders` table.

**Duplicate prevention:** Uses `external_id` (UID from iCal) stored in `orders.metadata.external_id`. Checks before insert.

**Conflict resolution:** ⚠️ **Minimal.** If the same UID exists with different dates, no update happens (ON CONFLICT DO NOTHING on the property_bookings trigger). Calendar updates (date changes) from external sources are **silently dropped**.

**Pricing:** Looks up `owner_properties.price_per_night`, multiplies by nights. Blocks zero-amount orders.

⚠️ **Gap:** No sync log visible to MC admins (only DB-level `ical_sync_logs`). No UI for sync status/errors.

---

## C. FRONTEND IMPLEMENTATION

### Key Hooks & Data Sources

| Hook | Data Source | Used By |
|------|-----------|---------|
| `useActiveCompany` | `management_company_members` + Context | OwnerHeader, Sidebar, all MC-scoped components |
| `useOwnerAccess` | `management_company_members` + `management_companies` | Access gates |
| `useMyProperties` | 3 sources merged: owned + managed + company | Portfolio views |
| `usePropertyBookings` | `orders` (vertical=property) | Calendar, booking lists |
| `useAllPropertyBookings` | `orders` filtered by `owner_properties.owner_id` only ⚠️ | Revenue dashboard |
| `usePropertyFinancialsFull` | `property_financials` filtered by `owner_id` ⚠️ | Financial dashboard |
| `useRevenueAnalytics` | Combines properties + financials + bookings | Revenue page |
| `useStaffMembers` | `staff_members` filtered by `owner_id` ⚠️ | Staff page |
| `usePMCompanies` | `management_companies` (admin CRUD) | Admin MC management |
| `useManagementCompanies` | `management_companies` (public read) | Public MC listings |
| `usePropertyManagementTerms` | `property_management_terms` | Terms tab in property detail |
| `useCommissionRules` | `vertical_commission_rules` | Admin commission settings |
| `useAgentDeals` | `agent_deals` filtered by `company_id` | Sales pipeline |

### State Management
- **React Query** for all server state. No Zustand.
- **React Context** for `ActiveCompanyContext` (company switcher).
- **localStorage** for active company ID persistence.

### Issues Found

| Issue | Severity | File |
|-------|----------|------|
| `useAllPropertyBookings` only queries `owner_properties` by `owner_id`, ignoring MC company properties | **Critical** | `usePropertyBookings.ts:383-395` |
| `usePropertyFinancialsFull` filters by `owner_id = user.id`, MC members can't see portfolio financials | **High** | `usePropertyFinancials.ts:101` |
| `usePropertyFinancialsPaginated` uses `getAccessiblePropertyIds` which checks `owner_properties.owner_id` + `property_delegates` but NOT MC membership | **High** | `usePropertyFinancials.ts:125-147` |
| `useStaffMembers` scoped by `owner_id`, not `company_id` — MC directors only see staff they personally created | **High** | `useStaffMembers.ts:48-51` |
| `useRevenueAnalytics` depends on `useOwnerProperties` (owner_id only) — MC revenue dashboard shows only personal properties | **High** | `useRevenueAnalytics.ts:47` |
| `usePropertyCare.getUserPropertyIds` checks `properties.owner_id` + `property_manager_assignments` but NOT `management_company_id` | **Medium** | `usePropertyCare.ts:28-37` |
| `usePMCompanies` casts supabase results with `as any` — no type safety | Low | `usePMCompanies.ts:133` |
| `usePropertyManagementTerms` uses `supabase as any` to bypass type checking | Low | `usePropertyManagementTerms.ts:64` |
| `useStaffMembers` uses `supabase as any` | Low | `useStaffMembers.ts:39` |

---

## D. UX FLOW AUDIT

### Role 1: MC Admin/Director

| Task | Status | Issues |
|------|--------|--------|
| View portfolio | ✅ Works via `useMyProperties` (company source) | — |
| View bookings | ⚠️ Partial | Only sees bookings for personally owned properties. Company properties bookings invisible. |
| View revenue | ⚠️ Broken | Revenue dashboard (`useRevenueAnalytics`) only pulls owner's properties. MC portfolio revenue NOT shown. |
| Edit property | ✅ Works | Via canonical property form. |
| See payout balance | ❌ Not implemented | No payout UI. Ledger exists but no MC-facing dashboard. |
| View staff activity | ✅ Works | Recently implemented `MemberActivitySheet`. |
| Manage terms | ✅ Works | Property-level terms editor functional. |
| View financial stats | ⚠️ Broken | `useFinancialStats` uses `getAccessiblePropertyIds` which excludes MC properties. |

**Clicks to view a property's bookings:** Home → Owner → Properties → Select Property → Calendar tab = 4 clicks. ✅ Reasonable.

**Dead ends:** 
- Payout balance → No page exists
- Financial reports → Shows empty for MC-managed properties (not owned)

### Role 2: Property Owner (individual, no MC)

| Task | Status | Issues |
|------|--------|--------|
| View performance | ✅ Works | Transparency dashboard. |
| View income | ✅ Works | `usePropertyFinancialsFull` filters by `owner_id`. |
| See occupancy | ✅ Works | Calendar + `useRevenueAnalytics`. |
| Check payout | ❌ Not implemented | No payout UI for owners either. |

---

## E. BUG & RISK DETECTION

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | MC commission terms never executed | **Critical** | `property_management_terms` stores commission rates but no code path uses them during order processing or ledger recording. MC gets 0% of bookings. |
| 2 | MC members can't see portfolio financials | **Critical** | `usePropertyFinancialsFull` and `useFinancialStats` filter by `owner_id = user.id`. MC director sees empty dashboards for managed properties. |
| 3 | MC members can't see portfolio bookings | **Critical** | `useAllPropertyBookings` queries `owner_properties` by `owner_id` only. |
| 4 | No MC→Ledger connection | **High** | `record_ledger_entries` uses `provider_org_id` which maps to `orgs`, not `management_companies`. MCs without a provider link get no financial tracking. |
| 5 | Staff table not MC-scoped | **High** | `staff_members` uses `owner_id` (personal), not `company_id`. Staff invisible to other MC directors. |
| 6 | iCal sync date changes silently dropped | **High** | External booking date changes are ignored (ON CONFLICT DO NOTHING). |
| 7 | Dual commission source of truth | **Medium** | `management_companies.default_commission_rate` vs `property_management_terms.commission_rate` — no code resolves which takes precedence. |
| 8 | `expense_responsibility` JSONB unused | **Medium** | Stored in `property_management_terms` but never read by any expense logic. |
| 9 | No payout mechanism | **Medium** | `vendor_balance` ledger accounts accumulate but no payout workflow exists. |
| 10 | Property can be assigned to MC without owner consent | **Medium** | No validation or approval workflow. |
| 11 | Booking trigger reads from `owner_properties` view | Low | If view definition changes, trigger may break silently. |
| 12 | Multiple `as any` casts bypass type safety | Low | `usePMCompanies`, `useStaffMembers`, `usePropertyManagementTerms`. |

---

## F. CODE CONSISTENCY CHECK

| Check | Status |
|-------|--------|
| Naming: MC vs management_company | ⚠️ Mixed. Code uses: `MC`, `management_company`, `PMCompany`, `company`, `УК`. No single convention. |
| Hook naming | ⚠️ Inconsistent: `usePMCompanies` (admin), `useManagementCompanies` (public), `useActiveCompany` (context). |
| Table naming | ✅ Consistent `snake_case` in DB. |
| Semantic tokens in UI | Not audited (analysis-only scope). |
| React Query keys | ⚠️ Inconsistent: `admin-management-companies`, `management-companies`, `user-companies`. Different key namespaces for same entity. |
| Supabase client usage | ⚠️ Several hooks use `supabase as any` to bypass type checking for tables not in generated types. |
| ENV vars | ✅ Standard via `@/integrations/supabase/client`. |

---

## G. PERFORMANCE ANALYSIS

| Check | Status | Details |
|-------|--------|---------|
| N+1 queries | ⚠️ | `usePropertyBookings` makes 3 sequential queries (owner_properties, property_delegates, then orders). Could be 1 RPC. |
| Large table scans | ⚠️ | `usePropertyFinancialsFull` fetches ALL financials without pagination (default hook). Paginated version exists but not universally used. |
| Missing indexes | ✅ | Key indexes present on `management_company_id`, `owner_id`, `company_id`. |
| Bundle weight | Not measured (analysis-only). |
| Excessive re-renders | ⚠️ | `useMyProperties` triggers 3 independent queries, each causing re-render cascade. |
| Over-complex state | ⚠️ | `useMyProperties` deduplication logic runs on every render (useMemo but 3 dep arrays). |

---

## H. SUMMARY

| Metric | Score | Notes |
|--------|-------|-------|
| **Architectural Maturity** | **5/10** | Tables exist, triggers work, but MC is not integrated as a first-class entity in the booking/financial pipeline. |
| **Financial Integrity** | **3/10** | Ledger exists but MC commission is never recorded. `property_management_terms` is dead configuration. Payout is non-existent. |
| **UX Clarity** | **4/10** | MC admin sees portfolio properties but can't see their bookings or revenue. Major data visibility gaps. |
| **Scalability Risk** | **Medium-High** | Current architecture won't support 5+ MCs with 50+ properties each without addressing N+1 queries and missing MC-scoped data access. |

### Immediate Top 5 Fixes (Do Not Implement)

1. **MC-scoped data access layer** — Create a unified `getMCPropertyIds(companyId)` helper and refactor `useAllPropertyBookings`, `usePropertyFinancialsFull`, `useFinancialStats`, `useRevenueAnalytics` to include MC company properties.

2. **Connect MC commission to booking pipeline** — When `record_ledger_entries` fires for a property order, look up `property_management_terms` for the property and create an additional ledger entry splitting revenue between owner and MC.

3. **MC→Org/Ledger bridge** — Either add `management_company_id` to `ledger_accounts` or ensure every MC has a corresponding `orgs` entry + `provider` entry so `provider_org_id` on orders resolves correctly.

4. **Staff table MC-scoping** — Add `company_id` FK to `staff_members` table. Migrate existing records. Update `useStaffMembers` to filter by active company.

5. **iCal sync update handling** — Change conflict resolution from DO NOTHING to UPSERT on `(property_id, external_id)` so date/amount changes from external calendars propagate.
