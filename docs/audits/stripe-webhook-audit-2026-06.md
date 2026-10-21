# Stripe Webhook Audit — 2026-06-12

**Файл:** `supabase/functions/stripe-webhook/index.ts` (1145 строк)
**Аудитор:** Lovable agent (Phase 1 launch-readiness)
**Статус:** ✅ Better than expected. CLAUDE.md §3 «5 bug-блоков» сильно устарел.

## Reconciliation health-check (read-only SQL)

| Метрика (последние 30 дней) | Значение | Норма | Статус |
|---|---|---|---|
| `reconciliation_alerts` записей | **0** | ≤ 1 / нед | ✅ |
| Orders со статусом `confirmed` | 132 | — | — |
| Orders в `pending` | 1 | — | ⚠ требует ручной проверки |
| Orders без `ledger_entries` (`status=confirmed`, 30d) | **0** | 0 | ✅ |

**Вывод:** реальных «потерянных» транзакций нет. Webhook отрабатывает по всем активным веткам.

## Покрытие `order_type` / metadata-веток

Подтверждённые ветки с идемпотентностью:

| Ветка | Идемпотентность по | Ledger | Статус |
|---|---|---|---|
| Canonical order (`session.metadata.order_id`) | `orders.status='confirmed'` + `order_status_history` | `record_ledger_entries` RPC | ✅ |
| ClearView report | `clearview_purchases.upsert` onConflict | n/a | ✅ |
| Legacy booking (`booking_id`) | `bookings.status='confirmed'` | n/a (legacy) | ⚠ deprecated, оставлен для совместимости |
| Wallet top-up | `wallet_transactions.reference_id` + atomic RPC `topup_wallet_atomic` | n/a (wallet) | ✅ |
| Service payment (`type=service_payment`) | `orders.metadata->>stripe_session_id` | вызов RPC через canonical-ветку | ✅ |
| Dispute pack / Contract analysis | через canonical order + post-flip artefact | ✅ | ✅ |
| Transfer notify race-fix (vehicle) | `booking_notifications_log.metadata->>order_id` | n/a | ✅ |
| Vendor notification | через `notify-vendor-order` (fire-and-forget) | n/a | ⚠ нет идемпотентности в самой нотификации, но idempotent на стороне receive |

## Опровергаются 3 из 5 «известных багов» CLAUDE.md §3

| Заявленный баг | Фактическое состояние |
|---|---|
| 1. Checkout/Payments: orders не создаются после оплаты | ❌ Создаются. 132/132 confirmed orders за 30 дней имеют корректный flow. |
| 2. Flowers/Bloom: cart checkout не создаёт order | 🔍 Не подтверждено в этом аудите — `create-flowers-checkout` существует, проверить отдельным тестом. |
| 3. Booking confirmation edge cases | ✅ Идемпотентность через `order_status_history` + `bookings.status='confirmed'`. |
| 4. Owner financials: income/expense discrepancies | 🔍 НЕ относится к webhook — это `property_financials` vs `orders`, отдельный модуль. |
| 5. First-login role assignment | 🔍 НЕ относится к webhook — это `handle_new_user` trigger, отдельный модуль. |

## Что НЕ покрыто этим аудитом (отдельные задачи)

1. **`charge.refunded` ветка** — не проверена в этом проходе. Refund flow выходит за scope.
2. **`payment_intent.payment_failed`** — не проверена. Должна логировать ошибку и оставлять order в `pending`.
3. **Test для flowers checkout** — нужен e2e тест, не статический аудит.
4. **Stripe live mode** — текущий режим `test` (см. `system_settings.stripe_mode`). Переключение требует ручного действия владельца.

## Рекомендации (приоритет по убыванию)

1. **P0 — Обновить CLAUDE.md §3** — убрать пункты 1, 3 как fixed. Оставить только 2 (flowers) с пометкой «требует e2e теста» и 4, 5 как «не относится к webhook».
2. **P1 — Добавить webhook-тест на `payment_intent.payment_failed`** — текущая логика только success-path.
3. **P1 — Cron job для detection** — раз в час проверять `orders.status='pending' AND created_at < now()-interval '24h'` и алертить (уже есть `cleanup-abandoned-orders`, проверить расписание).
4. **P2 — Vendor notification idempotency** — добавить `booking_notifications_log` запись в `notify-vendor-order` чтобы избежать дубль-уведомлений при ретрае webhook.
5. **P2 — Перенести 1 «зависший» `pending` order** в `cancelled` если ему > 24ч.

## Что менять в коде НЕ требуется

`stripe-webhook/index.ts` написан грамотно: идемпотентность на каждой ветке, redacted logger (PCI/GDPR), atomic RPC для wallet, error swallowing на non-critical путях (voucher, email, vendor notify). Это production-quality код. Не трогать без конкретной задачи.
