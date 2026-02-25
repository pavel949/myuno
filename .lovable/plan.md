
# UNO Platform — Full Status Report

## 1. DATABASE INFRASTRUCTURE

### Scale
- **337 tables** in the public schema
- **182 tables are EMPTY** (54% — never used)
- **155 tables have data** — the active core

### Key Tables with Data
| Table | Records | Role |
|-------|---------|------|
| calendar_sync_logs | 2,465 | iCal sync audit trail |
| task_entity_map | 662 | LifeOS task links |
| catalog_life_map | 431 | LifeOS catalog mappings |
| lookup_values | 406 | System lookups |
| salon_services | 261 | Beauty vertical |
| property_analytics | 155 | Property views/stats |
| property_projects | 152 | Developer projects |
| providers | 140 | Vendor registry |
| marketplace_products | 124 | Marketplace items |
| experiences | 112 | Tours/activities |
| yacht_pricing_rules | 111 | Yacht pricing |
| yachts | 97 | Yacht listings |
| property_activity_log | 99 | PMS activity |
| vehicles | 76 | Transport listings |
| restaurants | 67 | Restaurant listings |
| bouquets | 66 | Flower arrangements |
| services | 56 | Service listings |
| properties | 41 | Core property inventory |
| orders | 38 | All marketplace orders |
| property_bookings | 16 | PMS bookings |
| profiles | 7 | Registered users |
| wallets | 7 | User wallets |

### Empty Critical Tables (0 records)
- **ledger_accounts** — financial accounting not activated
- **ledger_entries** — zero financial records
- **booking_payments** — no payment records
- **booking_operations** — no ops tracking
- **featured_listings** — monetization not started
- **partner_applications** — no vendor onboarding
- **crm_contacts / crm_tasks** — CRM unused
- **marketplace_reviews** — no reviews

---

## 2. WHAT WAS COMPLETED (Parts 1-3)

### Part 1 — Data Foundation (DONE)
- Districts normalized to Title Case (21 unique values, 0 NULLs)
- Platform fee recalculated: all orders now show exactly 10.0% fee
- Zero-amount orders addressed
- Provider commission rates differentiated: 8% (2 providers), 10% (109), 15% (29)
- `normalize_district()` trigger added
- `validate_order_fee()` trigger added

### Part 2 — Booking Flow and MC Layer (DONE)
- `property_bookings` now has 16 records (15 from iCal, 1 from Agoda)
- `order_id` column added to `property_bookings`
- `create_property_booking_from_order()` trigger activated
- 3 Management Companies exist, all verified:
  - **Show Property Phuket** — 13 properties linked
  - **Ignatev Estate Co., ltd** — 11 properties linked
  - **Pavel Real Estate MC** — 0 properties linked
- 24 of 41 properties linked to MCs (58%)
- `paid_at` column added to orders

### Part 3 — Payment Pipeline (DONE)
- Stripe webhook handler: 709 lines, handles checkout.session.completed, payment_intent.payment_failed, refunds, disputes, expiry
- `record_ledger_entries` RPC created (idempotent)
- Wallet balances reset to 0 (all 7 wallets)
- Confirmation emails, notifications, status history all wired
- 84 Edge Functions deployed

---

## 3. CURRENT OPERATIONAL STATE

### Orders Summary
| Status | Count | GMV (THB) |
|--------|-------|-----------|
| cancelled | 12 | 3,500 |
| completed | 10 | 172,640 |
| confirmed | 10 | 509,650 |
| pending | 5 | 275,100 |
| in_progress | 1 | 1,800 |
| **Total** | **38** | **962,690** |

### Orders by Vertical
| Vertical | Count | GMV (THB) |
|----------|-------|-----------|
| property | 18 | 511,500 |
| yacht | 6 | 409,800 |
| tour | 6 | 25,800 |
| restaurant | 3 | 4,990 |
| cleaning | 2 | 3,300 |
| beauty | 2 | 4,800 |
| flowers | 1 | 2,500 |

### Payments
- **0 real Stripe payments processed** (paid_at is NULL for all 38 orders)
- Stripe webhook is fully coded but has never fired in production
- `ledger_accounts`: 0 records
- `ledger_entries`: 0 records
- `booking_payments`: 0 records

### Users
- **7 profiles** total (internal team only)
- No external customers yet

### Listings Inventory
| Vertical | Count |
|----------|-------|
| Marketplace products | 124 |
| Experiences | 112 |
| Yachts | 97 |
| Vehicles | 76 |
| Restaurants | 67 |
| Bouquets | 66 |
| Services | 56 |
| Properties | 41 |
| **Total listings** | **~639** |

---

## 4. WHAT REMAINS TO BE DONE

### Part 4: Notifications and Guest Experience (Next)
- Guest check-in flow activation
- Push notification testing
- Email templates verification (send-order-email function exists but untested)
- Booking voucher generation (generate-booking-voucher function exists)
- Guest messaging (booking_messages table is empty)

### Part 5: Launch Readiness
- E2E payment test with Stripe test card (CRITICAL — never done)
- Maintenance mode toggle for public launch
- Performance audit of 337-table schema
- Dead table cleanup (182 empty tables)
- RLS policy verification across all tables

### Outstanding from fix-plan.md
- P0.1: Delete unused `src/data/marketplaceProducts.ts` (783 lines)
- P0.2: Delete unused `src/data/demo/properties.json`
- P0.3: Delete unused `src/data/demo/restaurants.json`
- P1.1: Refactor `useAdminContent.ts` (498 lines)
- P1.2: Deprecate `useSupabaseQuery.ts`

---

## 5. CRITICAL BLOCKERS

### Blocker 1: Zero Real Payments
All 38 orders have `paid_at = NULL`. The Stripe webhook has never processed a real payment. The ledger system is wired but contains 0 entries. **Until an E2E payment test succeeds, the platform cannot accept money.**

### Blocker 2: Ledger System Dead
`ledger_accounts` and `ledger_entries` both have 0 records. The `record_ledger_entries` RPC exists but has never been called. Financial reporting is impossible.

### Blocker 3: 17 Properties Not Linked to MCs
41 properties total, 24 linked. 17 remain orphaned. The third MC (Pavel Real Estate MC) has 0 properties.

### Blocker 4: 182 Empty Tables
54% of the database schema is unused. This creates maintenance burden, confuses the codebase, and increases attack surface for RLS misconfiguration.

### Blocker 5: No External Users
7 profiles, all internal. No customer acquisition funnel is active. Partner applications table is empty.

---

## 6. RECOMMENDED NEXT STEPS (Priority Order)

1. **E2E Stripe Payment Test** — Create a test order, pay with `4242 4242 4242 4242`, verify webhook fires, order updates to confirmed, ledger entries are created, notification is sent
2. **Part 4 Implementation** — Guest notifications, email templates, vouchers
3. **Part 5 Implementation** — Launch readiness checklist, dead table audit
4. **Link remaining 17 properties** to MCs
5. **Delete dead code files** (P0.1-P0.3)
6. **First external user onboarding** — Test the full guest journey from discovery to payment to check-in
