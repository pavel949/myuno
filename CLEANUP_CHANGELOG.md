# UNO Platform Cleanup Changelog
Date: 2026-02-25

## Part 1: Data Foundation
- Normalized district names to Title Case via DB trigger (`normalize_district()`)
- Fixed `platform_fee_amount` calculation (was using `commission_rate` as multiplier instead of percentage)
- Recalculated all existing orders to 10% fee
- Added validation trigger `validate_order_fee()` preventing fee > total
- Voided 14 zero-amount orders from calendar sync
- Fixed iCal sync to calculate `total_amount` from property pricing
- Differentiated provider commission rates: 15% yachts, 8% restaurants/property, 10% default

## Part 2: Booking Flow & Management Companies
- Added `order_id` column to `property_bookings` for order linkage
- Created `create_property_booking_from_order()` trigger on orders table
- Backfilled 4 property bookings from existing confirmed orders
- Fixed broken triggers: `create_financial_from_booking`, `log_booking_activity`
- Disabled `block_property_bookings_insert` (was blocking all inserts)
- Linked 24 properties to 2 Management Companies (Ignatev: 11, Show Property: 13)
- Initialized `property_management_terms` for linked properties
- Flagged empty `products` table as legacy (active table: `marketplace_products`)

## Part 3: Payment Pipeline & Ledger
- Audited full Stripe payment flow (frontend → Edge Function → webhook)
- Enhanced `stripe-webhook` to set `paid_at` and call ledger RPC
- Created `record_ledger_entries()` RPC for double-entry accounting
- Added `paid_at` column to orders table
- Reset 7 dummy wallet balances to 0
- Verified Stripe secrets configured in Edge Functions

## Part 4: Infrastructure Cleanup
- Created `supabase/functions/FUNCTION_INDEX.md` documenting all 80 Edge Functions
- Identified 12 orphan functions (no frontend/cron references)
- Identified 2 phantom config entries (fazwaz-discover/scrape)
- Removed 3 duplicate cron jobs (ical sync was running every 5min)
- Set calendar sync to every 30 minutes
- Added `cleanup_old_sync_logs()` with daily cron (30-day retention)
- Cleaned ~360 orphan `task_entity_map` records
- Verified CRM tables schema complete (no changes needed)

## Part 5: UI Focus & Final Validation
- Created `src/config/activeVerticals.ts` feature flag system
- Filtered QuickActionsGrid to show only core verticals (property, cleaning, transfer, transport)
- Filtered AllServicesGrid for non-admin users (admin sees everything)
- Added "Coming Soon" section with grayed-out future verticals
- Updated HeroBlock messaging to property management focus
- Updated DiscoverCTABanner to "Property Management" focus
- Verified owner dashboard uses correct data sources (property_financials + property_bookings)

---

## Final Validation Results

### Data Integrity
| # | Check | Result |
|---|-------|--------|
| 1 | Districts unique, Title Case | ✅ 21 unique districts |
| 2 | No fee > total | ✅ 0 violations |
| 3 | Fees correctly calculated (10%) | ✅ 0 mismatches |
| 4 | No active zero-amount orders | ✅ 0 found |
| 5 | Provider rates differentiated | ✅ 3 distinct rates |

### Booking Pipeline
| # | Check | Result |
|---|-------|--------|
| 6 | Property bookings populated | ✅ 13 records |
| 7 | Management terms exist | ✅ 5 records |
| 8 | Properties linked to MCs | ✅ 24 properties |

### Payment Pipeline
| # | Check | Result |
|---|-------|--------|
| 9 | Booking payments | ⚠️ 0 (no real payments yet — webhook ready) |
| 10 | Ledger entries | ⚠️ 0 (no real payments yet — RPC ready) |
| 11 | Ledger balanced | ✅ N/A (0 entries = balanced) |
| 12 | Wallets reset | ✅ Sum = 0 |

### Infrastructure
| # | Check | Result |
|---|-------|--------|
| 13 | No garbage orders in 24h | ✅ 0 zero-amount orders |
| 14 | Sync logs reasonable | ✅ 282 in 24h (pre-fix backlog clearing) |

### MC Properties
| Company | Properties |
|---------|-----------|
| Ignatev Estate | 11 |
| Show Property Phuket | 13 |
| Pavel Real Estate MC | 0 (new, unlinked) |

---

## What Happens Next

1. **Switch Stripe to live mode** (currently test)
2. **Process first real payment** to verify full E2E flow
3. **Onboard first management company** (in-person)
4. **Stop coding. Start selling.**
