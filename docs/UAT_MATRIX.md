# UAT Matrix — MC/PMS Hard Test Suite

> **Version:** 1.0 · **Last updated:** 2026-02-28

## How to Run

1. **Seed test data:** Tests auto-seed idempotently on first run.
2. **Run tests:** `npx vitest run src/test/mc-hard-suite/` or use Admin → QA Test Runner.
3. **View report:** Admin → QA Test Runner → latest run results.

---

## Test Entities

| Entity | ID Prefix | Details |
|--------|-----------|---------|
| MC_Alpha | `mc-alpha-*` | 10 properties, verified |
| MC_Beta | `mc-beta-*` | 5 properties, verified |
| Owner_A | `owner-a-*` | Linked to MC_Alpha |
| Owner_B | `owner-b-*` | Linked to MC_Beta |
| Staff_Alpha | `staff-alpha-*` | Staff in MC_Alpha |
| Guest_User | `guest-*` | No MC membership |

---

## Test Cases

### Module 1: Tenant Isolation (RLS)

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| RLS-001 | User is MC_Alpha staff | Query properties for MC_Beta company_id | Empty result set | P0 |
| RLS-002 | User is MC_Alpha staff | Query property_bookings for MC_Beta property | Empty result set | P0 |
| RLS-003 | User is MC_Alpha staff | Query crm_contacts for MC_Beta company_id | Empty result set | P0 |
| RLS-004 | User is MC_Alpha staff | Query property_financials for MC_Beta property | Empty result set | P0 |
| RLS-005 | User is MC_Alpha staff | Query ical_calendar_sources for MC_Beta property | Empty result set | P0 |
| RLS-006 | User is Guest (no MC) | Query management_company_members | Empty result set | P0 |
| RLS-007 | User is MC_Alpha staff | Attempt INSERT booking for MC_Beta property | RLS violation error | P0 |
| RLS-008 | User is MC_Alpha staff | Direct URL to MC_Beta property detail | 404 or empty | P0 |

### Module 2: Consent Logging

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| CON-001 | Active legal_documents exist | New user signs up and accepts | legal_acceptances record created with user_id, doc_key, version, ip, user_agent | P0 |
| CON-002 | New version activated | Existing user logs in | LegalComplianceModal shown, blocks until accepted | P0 |
| CON-003 | Admin views acceptances | Open Admin → Legal Documents → Acceptances tab | Audit log with search/filter/export CSV | P1 |
| CON-004 | Multiple doc versions | Check both versions logged | Each version has separate acceptance record | P1 |
| CON-005 | Edge function | Call legal-accept with invalid doc_id | Returns 400 error | P1 |

### Module 3: Booking Engine

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| BKG-001 | MC_Alpha property active | Create booking via MC admin | property_bookings record, property_financials entry, status=pending | P0 |
| BKG-002 | Existing booking | Transition pending→confirmed→checked_in→checked_out | Each status saved correctly | P0 |
| BKG-003 | Confirmed booking exists | Attempt overlapping booking same dates | Conflict detected, booking blocked | P0 |
| BKG-004 | Booking with pricing | Change dates | total_amount recalculated | P1 |
| BKG-005 | Confirmed booking | Cancel booking | Status=cancelled, cancellation fields populated | P1 |
| BKG-006 | Marketplace order | create_order_atomic for property vertical | property_booking auto-created via trigger | P0 |

### Module 4: iCal Sync

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| ICAL-001 | Calendar source configured | Run sync | External blocks imported, no duplicates | P0 |
| ICAL-002 | Previous sync completed | Run sync again | No duplicate events created | P0 |
| ICAL-003 | External block overlaps internal confirmed | Run sync | Conflict logged, internal booking preserved | P0 |
| ICAL-004 | External event cancelled | Run sync | Block removed/updated | P1 |
| ICAL-005 | Timezone handling | Import event with UTC dates | Stored correctly in Asia/Bangkok | P1 |

### Module 5: Pricing / Commission / Financials

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| FIN-001 | Booking confirmed, management_terms exist | Check property_financials | platform_fee + mc_commission + owner_payout = total_amount | P0 |
| FIN-002 | Multiple bookings | Generate period report | Sums match individual records | P1 |
| FIN-003 | MC_Alpha user | View MC_Beta financials | Empty result (RLS) | P0 |
| FIN-004 | Rounding | Booking with odd amount (e.g., 3333.33) | Consistent rounding, no penny drift | P1 |

### Module 6: MC Tariffs / Property Limits

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| TAR-001 | MC_Alpha has 10 slots, 10 properties | Attempt to add 11th property | Blocked with "upgrade required" | P0 |
| TAR-002 | MC_Alpha at limit | Attempt bulk import exceeding limit | Import blocked | P0 |
| TAR-003 | Slot deactivated | Access PMS features for that property | PropertySlotGate blocks access | P1 |

### Module 7: Isolated Storefront

| ID | Preconditions | Steps | Expected | Severity |
|----|--------------|-------|----------|----------|
| SF-001 | MC_Alpha has storefront slug | Visit /b/:slug | Only MC_Alpha properties shown | P0 |
| SF-002 | On storefront page | Search/filter | No MC_Beta or platform properties leak | P0 |
| SF-003 | On storefront page | Direct URL to MC_Beta property | 404 or redirect | P0 |
| SF-004 | Storefront booking | Complete booking | source_storefront_id and source_company_id set | P1 |

---

## Severity Definitions

| Level | Description | SLA |
|-------|-------------|-----|
| P0 | Data leakage, double booking, broken auth | Must fix before release |
| P1 | Functional regression, incorrect calculations | Fix within sprint |
| P2 | UX issue, minor display bug | Backlog |
