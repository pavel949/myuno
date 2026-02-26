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

## 2. WHAT WAS COMPLETED (Parts 1-5)

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
- All 41 properties linked to MCs (0 orphaned)
- `paid_at` column added to orders

### Part 3 — Payment Pipeline (DONE ✅)
- Stripe webhook handler: 709 lines, handles checkout.session.completed, payment_intent.payment_failed, refunds, disputes, expiry
- `record_ledger_entries` RPC created (idempotent)
- Wallet balances reset to 0 (all 7 wallets)
- Confirmation emails, notifications, status history all wired
- 84 Edge Functions deployed

### Part 4 — Notifications & Guest Experience (DONE ✅)
- Stripe webhook → in-app notification → email: fully wired
- 9 branded email templates (welcome, booking, payment, refund, etc.)
- Voucher auto-generation after Stripe payment
- Guest check-in flow with owner notifications
- Real-time guest messaging with AI auto-reply
- Push notification subscription (needs production VAPID key)

### Part 5 — Launch Readiness (DONE ✅)
- Security scan: **PASSED** — no RLS issues found
- Dead code cleanup: `src/data/` directory removed
- P0.1-P0.3 dead files: confirmed deleted
- App version bumped to 3.39.0
- Maintenance mode: built and operational (default OFF for public access)
- MC linkage: 41/41 properties assigned

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

## 4. LAUNCH CHECKLIST

| Item | Status | Owner |
|------|--------|-------|
| Security scan (RLS) | ✅ Passed | AI |
| Dead code cleanup | ✅ Done | AI |
| All properties linked to MCs | ✅ 41/41 | AI |
| Email notification pipeline | ✅ Wired | AI |
| Voucher generation | ✅ Wired | AI |
| Guest check-in flow | ✅ Working | AI |
| Maintenance mode | ✅ Ready (default OFF) | AI |
| App version 3.39.0 | ✅ Bumped | AI |
| **E2E Stripe payment test** | ⏳ **MANUAL** | **Pavel** |
| **Production VAPID key** | ⏳ **MANUAL** | **Pavel** |
| **First external user test** | ⏳ **MANUAL** | **Pavel** |

---

## 5. REMAINING MANUAL STEPS (Pavel)

### Step 1: E2E Stripe Payment Test
1. Открыть любой листинг (property/yacht/experience)
2. Нажать "Book" / "Order"
3. На странице оплаты использовать тестовую карту: `4242 4242 4242 4242`
4. Проверить:
   - Заказ получил статус `confirmed` + `paid_at` заполнен
   - В таблице `ledger_entries` появились записи
   - Пришло email-уведомление
   - Сгенерирован ваучер бронирования

### Step 2: Production VAPID Key (если нужны push-уведомления)
```bash
npx web-push generate-vapid-keys
```
Заменить placeholder в `src/hooks/usePushSubscription.ts`

### Step 3: Первый внешний пользователь
1. Открыть сайт в режиме инкогнито
2. Зарегистрироваться как новый пользователь
3. Пройти путь: просмотр → бронирование → оплата → check-in

---

## 6. POST-LAUNCH BACKLOG (P1-P2)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| P1.1 | Refactor `useAdminContent.ts` (498 lines) | 8pt | P1 |
| P1.2 | Deprecate `useSupabaseQuery.ts` | 5pt | P1 |
| P1.3 | Align restaurant query keys | 2pt | P1 |
| P1.4 | Add ESLint react-hooks/exhaustive-deps | 2pt | P1 |
| P1.5 | Type-safe admin mutations | 3pt | P1 |
| P2.1 | Filter URL persistence | 5pt | P2 |
| P2.2 | Admin→Public cache invalidation | 3pt | P2 |
| P2.3 | Dead table cleanup (182 empty) | 3pt | P2 |
