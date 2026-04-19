

# План: индексы + materialized views + Telegram-алерты сверки

## 1. Индексы на горячие колонки (миграция)

Анализ существующих показал что **большинство hot-колонок уже индексированы**, но есть пробелы. Добавлю только реально отсутствующие/полезные:

```sql
-- orders: нет составного индекса по статусу+дате (используется в дашбордах + reconciliation)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC);

-- ledger_entries: нет индекса по order_id (критично для reconciliation IN-запроса)
CREATE INDEX IF NOT EXISTS idx_ledger_entries_order_id
  ON public.ledger_entries(order_id) WHERE order_id IS NOT NULL;

-- ledger_entries: по дате для P&L отчётов
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_date
  ON public.ledger_entries(account_id, entry_date DESC);

-- payment_intents: по статусу+дате
CREATE INDEX IF NOT EXISTS idx_payment_intents_status_created
  ON public.payment_intents(status, created_at DESC);

-- property_bookings: по property_id + датам (calendar queries)
CREATE INDEX IF NOT EXISTS idx_property_bookings_property_dates
  ON public.property_bookings(property_id, check_in, check_out);

-- property_financials: по property_id + дата (P&L)
CREATE INDEX IF NOT EXISTS idx_property_financials_property_date
  ON public.property_financials(property_id, entry_date DESC);

-- property_operational_tasks: по статусу + дюдейту
CREATE INDEX IF NOT EXISTS idx_prop_ops_tasks_status_due
  ON public.property_operational_tasks(status, due_date)
  WHERE status IN ('pending','in_progress');

-- analytics_events: партиальный для горячих событий
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON public.analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- crm_contacts: по company_id + updated_at для пайплайна
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_updated
  ON public.crm_contacts(company_id, updated_at DESC);
```

**Пропускаю** (уже есть): `agent_deals.*`, `crm_activities.contact_id+date`, `listings.vertical+active`, `bookings.user_id`.

## 2. Materialized views для дашбордов

Создам 3 MV для самых тяжёлых агрегаций:

**`mv_finance_summary_daily`** — daily KPI для admin/finance:
- orders_count, total_revenue, platform_fees, vendor_payouts по дням
- Источник: `orders` + `ledger_entries`

**`mv_portfolio_health_summary`** — для MC dashboard:
- properties_count, active_listings, occupied_today, pending_tasks per company
- Источник: `properties` + `property_bookings` + `property_operational_tasks`

**`mv_crm_pipeline_summary`** — funnel-метрики:
- contacts_count, deals_by_stage, conversion_rate per company
- Источник: `crm_contacts` + `agent_deals`

Каждая MV:
- Уникальный индекс для `REFRESH CONCURRENTLY`
- RLS не нужен (дашборды у админов/MC через has_role)
- Refresh function `refresh_dashboard_materialized_views()`
- Cron `*/5 * * * *` (каждые 5 минут)

## 3. Telegram-алерты сверки

Расширю существующий `daily-reconciliation` Edge Function:

1. После Resend-email **добавить отправку в Telegram** (через `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` — уже сконфигурированы)
2. **Шаблон сообщения** (HTML):
   ```
   ⚠️ <b>myUNO Reconciliation Alert</b>
   Дата: {today}
   Проверено заказов: {orders.length}
   ❌ Без леджера: {missingCount}
   ⚖️ Несоответствие сумм: {mismatchCount}
   🔗 https://myuno.app/admin/finance
   ```
3. **Отправлять только если есть alerts** (без спама при чистой сверке) — кроме раз в неделю отправлять "✅ All clean" в понедельник
4. **Добавить cron** для `daily-reconciliation` (его нет в списке активных): `0 23 * * *` (06:00 ICT)

## Файлы

- `supabase/migrations/<ts>_indexes_and_dashboard_mvs.sql` — индексы + MV + cron MV refresh
- `supabase/functions/daily-reconciliation/index.ts` — добавить Telegram block
- Insert SQL (через insert tool, не migration) — cron jobs для `daily-reconciliation` и `refresh_dashboard_mvs` с anon key

## Откат

- DROP INDEX CONCURRENTLY для каждого индекса
- DROP MATERIALIZED VIEW
- `cron.unschedule(...)`
- Telegram-блок — простой git revert функции

## Риски

- **Индексы:** создаются `IF NOT EXISTS`, без `CONCURRENTLY` (миграция в транзакции). На таблицах <5000 строк это <1 сек, безопасно.
- **MV:** первая `REFRESH` может быть медленной (5-10 сек), но запускается из cron, не блокирует.
- **Telegram:** если токен не настроен — fail silent, не ломает основную логику.

