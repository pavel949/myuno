
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

---

## 2. WHAT WAS COMPLETED (Parts 1-3 + Cleanup)

### Part 1 — Data Foundation (DONE ✅)
- Districts normalized to Title Case (21 unique values, 0 NULLs)
- Platform fee recalculated: all orders now show exactly 10.0% fee
- Zero-amount orders addressed
- Provider commission rates differentiated: 8% (2 providers), 10% (109), 15% (29)
- `normalize_district()` trigger added
- `validate_order_fee()` trigger added

### Part 2 — Booking Flow and MC Layer (DONE ✅)
- `property_bookings` now has 16 records (15 from iCal, 1 from Agoda)
- `order_id` column added to `property_bookings`
- `create_property_booking_from_order()` trigger activated
- 3 Management Companies exist, all verified
- `paid_at` column added to orders

### Part 3 — Payment Pipeline (DONE ✅)
- Stripe webhook handler: 709 lines, handles checkout.session.completed, payment_intent.payment_failed, refunds, disputes, expiry
- `record_ledger_entries` RPC created (idempotent)
- Wallet balances reset to 0 (all 7 wallets)
- Confirmation emails, notifications, status history all wired
- 84 Edge Functions deployed

### P0 Cleanup (DONE ✅)
- P0.1: `src/data/marketplaceProducts.ts` — already deleted (0 imports)
- P0.2: `src/data/demo/properties.json` — already deleted
- P0.3: `src/data/demo/restaurants.json` — already deleted
- Dead code directory `src/data/` is empty

### MC Linkage (DONE ✅)
- **All 41 properties** now linked to Management Companies (0 orphaned)
  - **Show Property Phuket** — 21 properties (Kamala, Patong, Kathu + original)
  - **Ignatev Estate Co., ltd** — 17 properties (Thalang, Si Sunthon, Sakhu, Ao Po, Pasak + original)
  - **Pavel Real Estate MC** — 3 properties (Phuket Town, Koh Kaew)

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

### Payments
- **0 real Stripe payments processed** (paid_at is NULL for all 38 orders)
- Stripe webhook is fully coded but has never fired in production
- `ledger_accounts`: 0 records
- `ledger_entries`: 0 records

### Users
- **7 profiles** total (internal team only)

---

## 4. WHAT WAS COMPLETED (Part 4: Notifications & Guest Experience ✅)

### Notification Pipeline
- Stripe webhook → in-app notification → email: fully wired for payment success, failure, refund, expiry, wallet topup
- Refund email payload format fixed (was sending wrong field names to `send-email` function)
- 9 branded email templates in `send-email` function (welcome, booking-confirmation, payment-receipt, payment-failed, booking-reminder, review-request, document-expiry, refund-processed, vendor-order)
- `send-order-email` function handles order_confirmation, order_cancellation, wallet_topup, order_request_received

### Voucher Auto-Generation
- Stripe webhook now auto-calls `generate-booking-voucher` after successful payment
- Voucher includes QR code, guest details, amounts, and property info
- Voucher record saved to `booking_vouchers` table

### Guest Check-in Flow
- Full online check-in form (passport, contacts, arrival info, house rules acceptance)
- Check-in submission now notifies property owner via in-app notification
- Owner can verify check-in via `useOwnerCheckIns` hook
- Guest sees confirmation status (submitted → verified)

### Guest Messaging
- Real-time property chat (`property_chat_messages` table + realtime subscription)
- AI auto-reply via `ai-guest-autoreply` edge function
- Conversation list with unread counts
- Pre-booking inquiries + booking-specific chats

### Push Notifications
- Browser push subscription via `usePushSubscription` hook
- VAPID key is placeholder — needs production key before launch
- Notification preferences (booking_reminders, promotions, status_updates)

---

## 5. WHAT REMAINS TO BE DONE

### Part 5: Launch Readiness (Next)
- E2E payment test with Stripe test card (CRITICAL)
- Generate production VAPID keys for push notifications
- Maintenance mode toggle for public launch
- Performance audit of 337-table schema
- Dead table cleanup (182 empty tables)
- RLS policy verification across all tables

### Post-Launch (P1-P2)
- P1.1: Refactor `useAdminContent.ts` (498 lines)
- P1.2: Deprecate `useSupabaseQuery.ts`
- P1.3: Align restaurant query keys
- P1.4: Add ESLint react-hooks/exhaustive-deps
- P1.5: Type-safe admin mutations

---

## 5. REMAINING BLOCKERS

### Blocker 1: Zero Real Payments
All 38 orders have `paid_at = NULL`. Until an E2E payment test succeeds, the platform cannot accept money.

### Blocker 2: Ledger System Dead
`ledger_accounts` and `ledger_entries` both have 0 records. Financial reporting is impossible.

### Blocker 3: 182 Empty Tables
54% of the database schema is unused.

### Blocker 4: No External Users
7 profiles, all internal. No customer acquisition funnel is active.

---

## 6. RECOMMENDED NEXT STEPS (Priority Order)

1. **E2E Stripe Payment Test** — pay with test card, verify full pipeline
2. **Part 4 Implementation** — Guest notifications, email templates, vouchers
3. **Part 5 Implementation** — Launch readiness checklist, dead table audit
4. **First external user onboarding** — Test the full guest journey
